"""
Microservico de processamento de imagens para o AgoraEncontrei.
Porta padrao: 3200

Seguranca:
- Token compartilhado obrigatorio em producao (IMAGE_PROCESSOR_TOKEN).
  Requests sem o header `x-image-processor-token` correto sao rejeitadas
  com 401. A comparacao e feita com hmac.compare_digest (timing-safe).
- CORS restrito a lista de origens configurada via IMAGE_PROCESSOR_ORIGINS
  (separadas por virgula). Padrao: localhost do dev + dominio de producao.
- SSRF: URLs externas sao resolvidas e bloqueadas se apontarem para IPs
  privados, loopback ou link-local. Apenas http/https sao aceitos.
- Uploads tem limite de MAX_UPLOAD_BYTES (padrao 15 MB).
"""
import os, io, json, base64, tempfile, hmac, ipaddress, socket
from urllib.parse import urlparse
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from filters import (
    FILTERS, generate_preview, process_image,
    extract_filter_from_dng, load_all_filters, save_custom_filter
)
from logos import (
    list_logos as logos_list,
    get_logo as logos_get,
    get_logo_path as logos_get_path,
    get_default_logo as logos_get_default,
    save_logo as logos_save,
    delete_logo as logos_delete,
    set_default_logo as logos_set_default,
    rename_logo as logos_rename,
)

app = FastAPI(title="AgoraEncontrei Image Processor", version="1.1.0")

# ── CORS ──────────────────────────────────────────────────────────────────
_default_origins = "http://localhost:3000,http://localhost:3100,https://agoraencontrei.com.br,https://www.agoraencontrei.com.br"
_origins = [o.strip() for o in os.environ.get("IMAGE_PROCESSOR_ORIGINS", _default_origins).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "x-image-processor-token"],
)

# ── Auth ──────────────────────────────────────────────────────────────────
IMAGE_PROCESSOR_TOKEN = os.environ.get("IMAGE_PROCESSOR_TOKEN", "")
_is_production = os.environ.get("NODE_ENV") == "production" or os.environ.get("IMAGE_PROCESSOR_ENV") == "production"


def verify_token(x_image_processor_token: Optional[str] = Header(default=None)):
    """Valida o token compartilhado. Em producao, token e obrigatorio.
    Em dev (sem token configurado) o endpoint continua aberto para facilitar o setup."""
    if not IMAGE_PROCESSOR_TOKEN:
        if _is_production:
            # Fail-closed em producao: sem token configurado, tudo e bloqueado.
            raise HTTPException(status_code=503, detail="IMAGE_PROCESSOR_TOKEN nao configurado")
        return  # Dev mode
    provided = x_image_processor_token or ""
    if not hmac.compare_digest(provided, IMAGE_PROCESSOR_TOKEN):
        raise HTTPException(status_code=401, detail="Token invalido")


# ── Limits ────────────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = int(os.environ.get("IMAGE_PROCESSOR_MAX_UPLOAD", 15 * 1024 * 1024))  # 15 MB
MAX_BATCH_ITEMS = int(os.environ.get("IMAGE_PROCESSOR_MAX_BATCH", 20))
FETCH_TIMEOUT = 15  # segundos


# ── SSRF guard ────────────────────────────────────────────────────────────
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS/GCP/Azure metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("0.0.0.0/8"),
]


def _is_blocked_ip(host: str) -> bool:
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return True  # cannot resolve => treat as hostile
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            continue
        for net in _BLOCKED_NETWORKS:
            if ip in net:
                return True
    return False


def fetch_image_bytes(url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="URL deve ser http(s)")
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="URL sem host")
    if _is_blocked_ip(parsed.hostname):
        raise HTTPException(status_code=400, detail="URL aponta para rede privada/loopback")

    resp = requests.get(url, timeout=FETCH_TIMEOUT, stream=True)
    resp.raise_for_status()
    # Streaming read com cap — evita baixar arquivos gigantes.
    buf = bytearray()
    for chunk in resp.iter_content(chunk_size=65536):
        if chunk:
            buf.extend(chunk)
            if len(buf) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Arquivo externo excede limite")
    return bytes(buf)


async def _read_upload(file: UploadFile) -> bytes:
    """Le um UploadFile respeitando MAX_UPLOAD_BYTES e abortando se exceder."""
    buf = bytearray()
    while True:
        chunk = await file.read(65536)
        if not chunk:
            break
        buf.extend(chunk)
        if len(buf) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Upload excede limite")
    return bytes(buf)


def resolve_logo_path(logo_id: Optional[str]) -> Optional[str]:
    """
    Returns the filesystem path of a given logo id, or the default logo when
    `logo_id` is empty/None. Falls back to the legacy single-file layout
    (logo.png / logo.jpg / ...) when nothing has been migrated to the new
    library yet, so old installs keep working until the user uploads
    something new.
    """
    if logo_id:
        p = logos_get_path(logo_id)
        if p:
            return p
        # Fall through: ignore unknown ids instead of raising — matches the
        # previous "best-effort" behaviour of the legacy helper.
    default = logos_get_default()
    if default:
        return logos_get_path(default["id"])
    # Legacy fallback — look for the hard-coded single-file logo left over
    # from before the logo library existed.
    for ext in ['png', 'jpg', 'jpeg', 'webp']:
        p = Path(__file__).parent / f"logo.{ext}"
        if p.exists():
            return str(p)
    return None


# Backwards-compat shim — older callers (import-filter et al) still use this.
def get_logo_path() -> Optional[str]:
    return resolve_logo_path(None)


@app.get("/health")
def health():
    return {"status": "ok", "service": "image-processor"}


@app.get("/filters", dependencies=[Depends(verify_token)])
def list_filters():
    all_filters = load_all_filters()
    return {
        "filters": [
            {
                "id": f["id"],
                "name": f["name"],
                "description": f.get("description", ""),
                "source": f.get("source", "builtin"),
            }
            for f in all_filters.values()
        ]
    }


class PreviewRequest(BaseModel):
    image_url: str
    filter_id: str
    apply_logo: bool = True
    logo_id: Optional[str] = None          # None => use default logo
    logo_position: str = "bottom-right"
    logo_size_percent: float = 8.0         # % da menor dimensao da foto
    logo_opacity: float = 0.85             # 0.0 - 1.0
    preview_width: int = 800


@app.post("/preview", dependencies=[Depends(verify_token)])
async def preview_filter(req: PreviewRequest):
    """Gera preview com filtro. Retorna base64 para exibicao imediata."""
    try:
        image_bytes = fetch_image_bytes(req.image_url)
        logo_path = resolve_logo_path(req.logo_id) if req.apply_logo else None
        result = generate_preview(
            image_bytes=image_bytes,
            filter_id=req.filter_id,
            logo_path=logo_path,
            logo_position=req.logo_position,
            logo_opacity=req.logo_opacity,
            logo_size_percent=req.logo_size_percent,
            preview_width=req.preview_width,
        )
        b64 = base64.b64encode(result).decode("utf-8")
        return {"preview": f"data:image/jpeg;base64,{b64}", "filter_id": req.filter_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/preview/upload", dependencies=[Depends(verify_token)])
async def preview_filter_upload(
    file: UploadFile = File(...),
    filter_id: str = Form(...),
    apply_logo: bool = Form(True),
    logo_id: Optional[str] = Form(None),
    logo_position: str = Form("bottom-right"),
    logo_size_percent: float = Form(8.0),
    logo_opacity: float = Form(0.85),
    preview_width: int = Form(800),
):
    """Preview a partir de arquivo enviado diretamente."""
    try:
        image_bytes = await _read_upload(file)
        logo_path = resolve_logo_path(logo_id) if apply_logo else None
        result = generate_preview(
            image_bytes=image_bytes,
            filter_id=filter_id,
            logo_path=logo_path,
            logo_position=logo_position,
            logo_opacity=logo_opacity,
            logo_size_percent=logo_size_percent,
            preview_width=preview_width,
        )
        b64 = base64.b64encode(result).decode("utf-8")
        return {"preview": f"data:image/jpeg;base64,{b64}", "filter_id": filter_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ProcessRequest(BaseModel):
    image_url: str
    filter_id: str
    apply_logo: bool = True
    logo_id: Optional[str] = None
    logo_position: str = "bottom-right"
    logo_size_percent: float = 8.0
    logo_opacity: float = 0.85
    output_quality: int = 92


@app.post("/process", dependencies=[Depends(verify_token)])
async def process_single(req: ProcessRequest):
    """Processa uma imagem em qualidade completa."""
    try:
        image_bytes = fetch_image_bytes(req.image_url)
        logo_path = resolve_logo_path(req.logo_id) if req.apply_logo else None
        result = process_image(
            image_bytes=image_bytes,
            filter_id=req.filter_id,
            logo_path=logo_path,
            logo_position=req.logo_position,
            logo_opacity=req.logo_opacity,
            logo_size_percent=req.logo_size_percent,
            output_quality=req.output_quality,
        )
        b64 = base64.b64encode(result).decode("utf-8")
        return {"result": f"data:image/jpeg;base64,{b64}", "filter_id": req.filter_id, "size_bytes": len(result)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BatchProcessRequest(BaseModel):
    image_urls: List[str]
    filter_id: str
    apply_logo: bool = True
    logo_id: Optional[str] = None
    logo_position: str = "bottom-right"
    logo_size_percent: float = 8.0
    logo_opacity: float = 0.85
    output_quality: int = 92


@app.post("/process/batch", dependencies=[Depends(verify_token)])
async def process_batch(req: BatchProcessRequest):
    """Processa multiplas imagens em lote."""
    if len(req.image_urls) > MAX_BATCH_ITEMS:
        raise HTTPException(status_code=400, detail=f"Maximo {MAX_BATCH_ITEMS} URLs por lote")
    results = []
    errors = []
    logo_path = resolve_logo_path(req.logo_id) if req.apply_logo else None

    for i, url in enumerate(req.image_urls):
        try:
            image_bytes = fetch_image_bytes(url)
            result = process_image(
                image_bytes=image_bytes,
                filter_id=req.filter_id,
                logo_path=logo_path,
                logo_position=req.logo_position,
                logo_opacity=req.logo_opacity,
                logo_size_percent=req.logo_size_percent,
                output_quality=req.output_quality,
            )
            b64 = base64.b64encode(result).decode("utf-8")
            results.append({
                "index": i,
                "url": url,
                "result": f"data:image/jpeg;base64,{b64}",
                "size_bytes": len(result),
            })
        except HTTPException as he:
            errors.append({"index": i, "url": url, "error": he.detail})
        except Exception as e:
            errors.append({"index": i, "url": url, "error": str(e)})

    return {
        "processed": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors,
    }


# ── Logo library (multi-logo CRUD) ────────────────────────────────────────
#
# Any format Pillow can open is accepted (PNG, JPG, WEBP, AVIF, BMP, TIFF,
# GIF) plus PDF (first page). The file is always stored internally as PNG
# with transparency so the watermark pipeline stays uniform.

# MIME allow-list for logo uploads. Vector SVG is deliberately NOT allowed
# here — it can carry inline <script> and XSS downstream. Raster vector
# formats (PNG/WebP) should be used instead.
ALLOWED_LOGO_MIMES = {
    "image/png", "image/jpeg", "image/jpg", "image/webp",
    "image/avif", "image/bmp", "image/tiff", "image/gif",
    "application/pdf",
}


def _serialize_logo(rec: dict) -> dict:
    """Shape a logo record for the public JSON response. Exposes a URL the
    web UI can use directly as <img src>."""
    return {
        "id": rec["id"],
        "name": rec["name"],
        "mime": rec["mime"],
        "originalMime": rec.get("original_mime"),
        "width": rec.get("width"),
        "height": rec.get("height"),
        "bytes": rec.get("bytes"),
        "isDefault": bool(rec.get("is_default")),
        "createdAt": rec.get("created_at"),
        "url": f"/logos/{rec['id']}/file",
    }


@app.get("/logos", dependencies=[Depends(verify_token)])
def logos_list_endpoint():
    """Returns the library of registered logos."""
    return {"logos": [_serialize_logo(r) for r in logos_list()]}


@app.post("/logos", dependencies=[Depends(verify_token)])
async def logos_upload_endpoint(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
):
    """Uploads a new logo. Accepts any image format Pillow handles, plus PDF.
    The file is normalised to PNG-RGBA on disk regardless of input format."""
    filename = (file.filename or "").strip()
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo invalido")

    mime = (file.content_type or "").lower()
    # Accept when either the declared MIME is on the allow-list OR the
    # extension suggests a supported type. Browsers sometimes send empty
    # content-type for .avif / .bmp, so relying purely on MIME is fragile.
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    ext_allowed = ext in {"png", "jpg", "jpeg", "webp", "avif", "bmp", "tiff", "tif", "gif", "pdf"}
    if mime not in ALLOWED_LOGO_MIMES and not ext_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Formato nao suportado ({mime or ext or 'desconhecido'}). "
                   "Use PNG, JPG, WEBP, BMP, TIFF, GIF ou PDF."
        )

    content = await _read_upload(file)
    display_name = (name or filename or "Logo sem nome").rsplit(".", 1)[0]
    try:
        rec = logos_save(display_name, content, mime or f"image/{ext}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _serialize_logo(rec)


@app.get("/logos/{logo_id}", dependencies=[Depends(verify_token)])
def logos_get_endpoint(logo_id: str):
    rec = logos_get(logo_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Logo nao encontrado")
    return _serialize_logo(rec)


@app.get("/logos/{logo_id}/file", dependencies=[Depends(verify_token)])
def logos_file_endpoint(logo_id: str):
    """Serves the raw PNG bytes of a logo. Used by the web UI as a
    thumbnail source; also handy for debugging."""
    from fastapi.responses import Response
    path = logos_get_path(logo_id)
    if not path:
        raise HTTPException(status_code=404, detail="Logo nao encontrado")
    with open(path, "rb") as f:
        data = f.read()
    return Response(content=data, media_type="image/png")


@app.delete("/logos/{logo_id}", dependencies=[Depends(verify_token)])
def logos_delete_endpoint(logo_id: str):
    removed = logos_delete(logo_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Logo nao encontrado")
    return {"ok": True}


class LogoPatchRequest(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None


@app.patch("/logos/{logo_id}", dependencies=[Depends(verify_token)])
def logos_patch_endpoint(logo_id: str, req: LogoPatchRequest):
    """Renames a logo and/or toggles the default flag."""
    updated = None
    if req.name is not None:
        updated = logos_rename(logo_id, req.name)
    if req.is_default is True:
        updated = logos_set_default(logo_id)
    if updated is None and logos_get(logo_id) is None:
        raise HTTPException(status_code=404, detail="Logo nao encontrado")
    final = logos_get(logo_id)
    return _serialize_logo(final) if final else {"ok": True}


# ── Backwards-compat: old single-logo endpoint still works ───────────────
@app.post("/upload-logo", dependencies=[Depends(verify_token)])
async def upload_logo_legacy(file: UploadFile = File(...)):
    """Legacy single-file upload. Creates a new entry in the logo library
    (marked as default when it's the first one). Prefer POST /logos."""
    return await logos_upload_endpoint(file=file, name=None)


@app.post("/import-filter", dependencies=[Depends(verify_token)])
async def import_filter_from_dng(
    file: UploadFile = File(...),
    filter_name: str = Form(None),
):
    """Importa novo filtro a partir de arquivo DNG do Lightroom."""
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".dng"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .dng sao suportados.")
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo invalido")

    content = await _read_upload(file)
    with tempfile.NamedTemporaryFile(suffix=".dng", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        filter_data = extract_filter_from_dng(
            tmp_path,
            filter_name or filename.replace(".dng", ""),
        )
        save_custom_filter(filter_data)
        return {
            "message": "Filtro importado com sucesso",
            "filter": {
                "id": filter_data["id"],
                "name": filter_data["name"],
                "description": filter_data["description"],
            },
        }
    finally:
        os.unlink(tmp_path)


@app.get("/filters/{filter_id}", dependencies=[Depends(verify_token)])
def get_filter(filter_id: str):
    all_filters = load_all_filters()
    if filter_id not in all_filters:
        raise HTTPException(status_code=404, detail="Filtro nao encontrado")
    f = all_filters[filter_id]
    return {
        "id": f["id"],
        "name": f["name"],
        "description": f.get("description", ""),
        "source": f.get("source", "builtin"),
        "params": f["params"],
    }


@app.delete("/filters/{filter_id}", dependencies=[Depends(verify_token)])
def delete_filter(filter_id: str):
    if filter_id in FILTERS:
        raise HTTPException(status_code=400, detail="Nao e possivel remover filtros padrao.")
    custom_path = Path(__file__).parent / "custom_filters.json"
    if not custom_path.exists():
        raise HTTPException(status_code=404, detail="Filtro nao encontrado")
    with open(custom_path) as f:
        custom = json.load(f)
    if filter_id not in custom:
        raise HTTPException(status_code=404, detail="Filtro nao encontrado")
    del custom[filter_id]
    with open(custom_path, "w") as f:
        json.dump(custom, f, indent=2)
    return {"message": "Filtro removido com sucesso"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("IMAGE_PROCESSOR_PORT", 3200))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
