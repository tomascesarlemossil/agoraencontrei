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


def get_logo_path() -> Optional[str]:
    for ext in ['png', 'jpg', 'jpeg', 'webp']:
        p = Path(__file__).parent / f"logo.{ext}"
        if p.exists():
            return str(p)
    return None


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
    logo_position: str = "bottom-right"
    preview_width: int = 800


@app.post("/preview", dependencies=[Depends(verify_token)])
async def preview_filter(req: PreviewRequest):
    """Gera preview com filtro. Retorna base64 para exibicao imediata."""
    try:
        image_bytes = fetch_image_bytes(req.image_url)
        logo_path = get_logo_path() if req.apply_logo else None
        result = generate_preview(
            image_bytes=image_bytes,
            filter_id=req.filter_id,
            logo_path=logo_path,
            logo_position=req.logo_position,
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
    logo_position: str = Form("bottom-right"),
    preview_width: int = Form(800),
):
    """Preview a partir de arquivo enviado diretamente."""
    try:
        image_bytes = await _read_upload(file)
        logo_path = get_logo_path() if apply_logo else None
        result = generate_preview(
            image_bytes=image_bytes,
            filter_id=filter_id,
            logo_path=logo_path,
            logo_position=logo_position,
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
    logo_position: str = "bottom-right"
    output_quality: int = 92


@app.post("/process", dependencies=[Depends(verify_token)])
async def process_single(req: ProcessRequest):
    """Processa uma imagem em qualidade completa."""
    try:
        image_bytes = fetch_image_bytes(req.image_url)
        logo_path = get_logo_path() if req.apply_logo else None
        result = process_image(
            image_bytes=image_bytes,
            filter_id=req.filter_id,
            logo_path=logo_path,
            logo_position=req.logo_position,
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
    logo_position: str = "bottom-right"
    output_quality: int = 92


@app.post("/process/batch", dependencies=[Depends(verify_token)])
async def process_batch(req: BatchProcessRequest):
    """Processa multiplas imagens em lote."""
    if len(req.image_urls) > MAX_BATCH_ITEMS:
        raise HTTPException(status_code=400, detail=f"Maximo {MAX_BATCH_ITEMS} URLs por lote")
    results = []
    errors = []
    logo_path = get_logo_path() if req.apply_logo else None

    for i, url in enumerate(req.image_urls):
        try:
            image_bytes = fetch_image_bytes(url)
            result = process_image(
                image_bytes=image_bytes,
                filter_id=req.filter_id,
                logo_path=logo_path,
                logo_position=req.logo_position,
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


@app.post("/upload-logo", dependencies=[Depends(verify_token)])
async def upload_logo(file: UploadFile = File(...)):
    """Faz upload do logo da imobiliaria."""
    filename = (file.filename or "").strip()
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo invalido")
    parts = filename.rsplit(".", 1)
    ext = parts[1].lower() if len(parts) == 2 else ""
    if ext not in ["png", "jpg", "jpeg", "webp"]:
        raise HTTPException(status_code=400, detail="Formato invalido. Use PNG, JPG ou WebP.")
    content = await _read_upload(file)
    logo_path = Path(__file__).parent / f"logo.{ext}"
    with open(logo_path, "wb") as f:
        f.write(content)
    return {"message": "Logo salvo com sucesso", "path": str(logo_path)}


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
