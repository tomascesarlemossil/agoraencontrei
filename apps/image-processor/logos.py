"""
Logo library — storage e manipulacao de multiplos logos.

Cada logo tem um id (uuid) + nome amigavel + o arquivo binario (normalizado
para PNG transparente) + metadados em JSON.

Formatos aceitos no upload (qualquer coisa que o Pillow abrir + PDF):
  - PNG, JPG/JPEG, WEBP, AVIF, BMP, GIF, TIFF
  - PDF (primeira pagina, convertida via PyMuPDF quando disponivel)

O logo e sempre armazenado internamente como `logo.png` (RGBA). Isso:
  * da suporte a transparencia
  * evita problemas de formato ao aplicar watermark
  * permite converter formatos na entrada sem tocar no filters.py
"""
from __future__ import annotations
import io
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from PIL import Image


# Diretorio de armazenamento dos logos. Configuravel via LOGOS_STORE_DIR para
# apontar para um volume PERSISTENTE (ex.: no Railway, monte um volume e
# defina LOGOS_STORE_DIR=/data/logos). Sem isso, o padrao fica no filesystem
# do container — que e efemero e perde os logos a cada redeploy.
LOGOS_DIR = Path(os.environ.get("LOGOS_STORE_DIR") or (Path(__file__).parent / "logos_store"))
LOGOS_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = LOGOS_DIR / "index.json"


# ── Index helpers ────────────────────────────────────────────────────────

def _load_index() -> Dict[str, dict]:
    if not INDEX_PATH.exists():
        return {}
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_index(idx: Dict[str, dict]) -> None:
    INDEX_PATH.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Multi-tenant isolation ─────────────────────────────────────────────────
# Cada logo pertence a uma empresa (`company` = companyId do CRM). A API SEMPRE
# envia `company` do JWT (req.user.cid). Assim um parceiro só enxerga/edita/
# deleta/aplica os PRÓPRIOS logos — nunca os de outra empresa.
#
# Compatibilidade: quando `company` é None (chamada legada/interna sem escopo),
# o comportamento antigo é mantido (todos os registros). Registros LEGADOS sem
# o campo `company` ficam ocultos para consultas escopadas por empresa.

def _belongs(rec: dict, company: Optional[str]) -> bool:
    """True se o registro é visível para `company`. company=None → sem escopo
    (vê tudo). Com escopo, exige match exato do campo `company` do registro."""
    if company is None:
        return True
    return rec.get("company") == company


def _scoped_index(company: Optional[str]) -> Dict[str, dict]:
    return {k: v for k, v in _load_index().items() if _belongs(v, company)}


# ── Public API ───────────────────────────────────────────────────────────

def list_logos(company: Optional[str] = None) -> List[dict]:
    """Returns the registered logos of `company` (newest first)."""
    logos = list(_scoped_index(company).values())
    logos.sort(key=lambda l: l.get("created_at", ""), reverse=True)
    return logos


def get_logo(logo_id: str, company: Optional[str] = None) -> Optional[dict]:
    """Returns a single logo record IF it belongs to `company`, else None."""
    rec = _load_index().get(logo_id)
    if rec is None or not _belongs(rec, company):
        return None
    return rec


def get_logo_path(logo_id: str, company: Optional[str] = None) -> Optional[str]:
    """Returns the filesystem path to the PNG of the given logo (scoped)."""
    rec = get_logo(logo_id, company)
    if not rec:
        return None
    path = LOGOS_DIR / rec["filename"]
    return str(path) if path.exists() else None


def get_default_logo(company: Optional[str] = None) -> Optional[dict]:
    """Returns the default logo OF `company` (or newest if none flagged),
    or None when the company has no logos."""
    scoped = _scoped_index(company)
    if not scoped:
        return None
    for rec in scoped.values():
        if rec.get("is_default"):
            return rec
    logos = list(scoped.values())
    logos.sort(key=lambda l: l.get("created_at", ""), reverse=True)
    return logos[0] if logos else None


def save_logo(name: str, image_bytes: bytes, original_mime: str, company: Optional[str] = None) -> dict:
    """
    Persists a new logo FOR `company`. Converts the input to PNG-RGBA so the
    watermark pipeline stays uniform regardless of the uploaded format and a
    transparent PNG/WEBP KEEPS its alpha (never flattened to white).

    Raises ValueError when the bytes cannot be interpreted as an image.
    """
    png_bytes = _normalize_to_png(image_bytes, original_mime)

    logo_id = uuid.uuid4().hex
    filename = f"{logo_id}.png"
    (LOGOS_DIR / filename).write_bytes(png_bytes)

    # Record the image dimensions so the UI can pick a sensible default size.
    with Image.open(io.BytesIO(png_bytes)) as probe:
        width, height = probe.size

    idx = _load_index()
    # "is_default" é POR EMPRESA — o primeiro logo da empresa vira o default dela.
    is_first_for_company = not any(_belongs(r, company) for r in idx.values())
    record = {
        "id": logo_id,
        "name": (name or "Logo sem nome").strip()[:120] or "Logo sem nome",
        "filename": filename,
        "mime": "image/png",
        "original_mime": original_mime,
        "company": company,
        "width": width,
        "height": height,
        "bytes": len(png_bytes),
        "is_default": is_first_for_company,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    idx[logo_id] = record
    _save_index(idx)
    return record


def delete_logo(logo_id: str, company: Optional[str] = None) -> bool:
    """Removes the logo (IF it belongs to `company`) and its index entry.
    Returns True when something was actually removed."""
    idx = _load_index()
    rec = idx.get(logo_id)
    if rec is None or not _belongs(rec, company):
        return False
    idx.pop(logo_id, None)
    file_path = LOGOS_DIR / rec["filename"]
    try:
        file_path.unlink(missing_ok=True)
    except OSError:
        pass
    # If we just deleted the company's default, promote its most recent one.
    if rec.get("is_default"):
        siblings = {k: v for k, v in idx.items() if _belongs(v, rec.get("company"))}
        if siblings:
            newest_id = max(siblings.keys(), key=lambda k: siblings[k].get("created_at", ""))
            idx[newest_id]["is_default"] = True
    _save_index(idx)
    return True


def set_default_logo(logo_id: str, company: Optional[str] = None) -> Optional[dict]:
    """Marks `logo_id` as the default of ITS company (clearing the flag only
    on that company's other logos). Returns the record or None when unknown/
    not owned by `company`."""
    idx = _load_index()
    target = idx.get(logo_id)
    if target is None or not _belongs(target, company):
        return None
    owner = target.get("company")
    for k, rec in idx.items():
        if rec.get("company") == owner:
            rec["is_default"] = (k == logo_id)
    _save_index(idx)
    return idx[logo_id]


def rename_logo(logo_id: str, new_name: str, company: Optional[str] = None) -> Optional[dict]:
    """Updates the display name of a logo (IF owned by `company`). Returns the
    updated record or None when unknown/not owned."""
    idx = _load_index()
    rec = idx.get(logo_id)
    if rec is None or not _belongs(rec, company):
        return None
    rec["name"] = (new_name or "").strip()[:120] or rec["name"]
    _save_index(idx)
    return rec


# ── Format normalization ────────────────────────────────────────────────

def _normalize_to_png(image_bytes: bytes, original_mime: str) -> bytes:
    """
    Converts an arbitrary uploaded file into PNG bytes preserving alpha.

    PDF: extracts the first page at 300 DPI via PyMuPDF when installed.
         Without PyMuPDF, raises a clear error so the API layer can surface
         a useful message instead of a 500.
    """
    mime = (original_mime or "").lower()

    if mime == "application/pdf" or image_bytes[:4] == b"%PDF":
        return _pdf_first_page_to_png(image_bytes)

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = img.convert("RGBA")
            out = io.BytesIO()
            img.save(out, format="PNG", optimize=True)
            return out.getvalue()
    except Exception as exc:
        raise ValueError(f"Arquivo nao reconhecido como imagem: {exc}")


def _pdf_first_page_to_png(pdf_bytes: bytes) -> bytes:
    """Renders the first page of the PDF into a transparent PNG. Uses
    PyMuPDF (fitz) which ships as a pre-built wheel and doesn't require
    poppler on the system."""
    try:
        import fitz  # type: ignore  # PyMuPDF
    except ImportError:
        raise ValueError(
            "Upload de PDF requer o pacote PyMuPDF. "
            "Instale com `pip install PyMuPDF` ou adicione no requirements.txt."
        )

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        if doc.page_count == 0:
            raise ValueError("PDF vazio")
        page = doc.load_page(0)
        # 300 DPI — Logo-quality without being massive.
        matrix = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=matrix, alpha=True)
        return pix.tobytes("png")
    finally:
        doc.close()
