"""
Microservico de processamento de imagens para o AgoraEncontrei.
Porta padrao: 3200
"""
import os, io, json, base64, tempfile
import requests
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from filters import (
    FILTERS, generate_preview, process_image,
    extract_filter_from_dng, load_all_filters, save_custom_filter
)

app = FastAPI(title="AgoraEncontrei Image Processor", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def fetch_image_bytes(url: str) -> bytes:
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.content


def get_logo_path() -> Optional[str]:
    for ext in ['png', 'jpg', 'jpeg', 'webp']:
        p = Path(__file__).parent / f"logo.{ext}"
        if p.exists():
            return str(p)
    return None


@app.get("/health")
def health():
    return {"status": "ok", "service": "image-processor"}


@app.get("/filters")
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


@app.post("/preview")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/preview/upload")
async def preview_filter_upload(
    file: UploadFile = File(...),
    filter_id: str = Form(...),
    apply_logo: bool = Form(True),
    logo_position: str = Form("bottom-right"),
    preview_width: int = Form(800),
):
    """Preview a partir de arquivo enviado diretamente."""
    try:
        image_bytes = await file.read()
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ProcessRequest(BaseModel):
    image_url: str
    filter_id: str
    apply_logo: bool = True
    logo_position: str = "bottom-right"
    output_quality: int = 92


@app.post("/process")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BatchProcessRequest(BaseModel):
    image_urls: List[str]
    filter_id: str
    apply_logo: bool = True
    logo_position: str = "bottom-right"
    output_quality: int = 92


@app.post("/process/batch")
async def process_batch(req: BatchProcessRequest):
    """Processa multiplas imagens em lote."""
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
        except Exception as e:
            errors.append({"index": i, "url": url, "error": str(e)})

    return {
        "processed": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors,
    }


@app.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Faz upload do logo da imobiliaria."""
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["png", "jpg", "jpeg", "webp"]:
        raise HTTPException(status_code=400, detail="Formato invalido. Use PNG, JPG ou WebP.")
    logo_path = Path(__file__).parent / f"logo.{ext}"
    content = await file.read()
    with open(logo_path, "wb") as f:
        f.write(content)
    return {"message": "Logo salvo com sucesso", "path": str(logo_path)}


@app.post("/import-filter")
async def import_filter_from_dng(
    file: UploadFile = File(...),
    filter_name: str = Form(None),
):
    """Importa novo filtro a partir de arquivo DNG do Lightroom."""
    if not file.filename.lower().endswith(".dng"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .dng sao suportados.")

    with tempfile.NamedTemporaryFile(suffix=".dng", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        filter_data = extract_filter_from_dng(
            tmp_path,
            filter_name or file.filename.replace(".dng", ""),
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


@app.get("/filters/{filter_id}")
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


@app.delete("/filters/{filter_id}")
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
