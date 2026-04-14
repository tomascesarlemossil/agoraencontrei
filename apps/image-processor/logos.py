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
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from PIL import Image


LOGOS_DIR = Path(__file__).parent / "logos_store"
LOGOS_DIR.mkdir(exist_ok=True)
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


# ── Public API ───────────────────────────────────────────────────────────

def list_logos() -> List[dict]:
    """Returns the list of all registered logos, newest first."""
    idx = _load_index()
    logos = list(idx.values())
    logos.sort(key=lambda l: l.get("created_at", ""), reverse=True)
    return logos


def get_logo(logo_id: str) -> Optional[dict]:
    """Returns a single logo record, or None if not found."""
    return _load_index().get(logo_id)


def get_logo_path(logo_id: str) -> Optional[str]:
    """Returns the filesystem path to the PNG file of the given logo."""
    rec = get_logo(logo_id)
    if not rec:
        return None
    path = LOGOS_DIR / rec["filename"]
    return str(path) if path.exists() else None


def get_default_logo() -> Optional[dict]:
    """Returns the logo marked as default, or the newest if none is marked,
    or None if the store is empty. Kept for backwards compatibility with
    callers that expect a single implicit logo."""
    idx = _load_index()
    if not idx:
        return None
    for rec in idx.values():
        if rec.get("is_default"):
            return rec
    logos = list(idx.values())
    logos.sort(key=lambda l: l.get("created_at", ""), reverse=True)
    return logos[0] if logos else None


def save_logo(name: str, image_bytes: bytes, original_mime: str) -> dict:
    """
    Persists a new logo. Converts the input to PNG-RGBA so the watermark
    pipeline stays uniform regardless of the uploaded format.

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
    is_first = len(idx) == 0
    record = {
        "id": logo_id,
        "name": (name or "Logo sem nome").strip()[:120] or "Logo sem nome",
        "filename": filename,
        "mime": "image/png",
        "original_mime": original_mime,
        "width": width,
        "height": height,
        "bytes": len(png_bytes),
        "is_default": is_first,  # first one becomes default automatically
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    idx[logo_id] = record
    _save_index(idx)
    return record


def delete_logo(logo_id: str) -> bool:
    """Removes the logo's file and its index entry. Returns True when
    something was actually removed."""
    idx = _load_index()
    rec = idx.pop(logo_id, None)
    if rec is None:
        return False
    file_path = LOGOS_DIR / rec["filename"]
    try:
        file_path.unlink(missing_ok=True)
    except OSError:
        pass
    # If we just deleted the default, promote the most recent one.
    if rec.get("is_default") and idx:
        newest_id = max(idx.keys(), key=lambda k: idx[k].get("created_at", ""))
        idx[newest_id]["is_default"] = True
    _save_index(idx)
    return True


def set_default_logo(logo_id: str) -> Optional[dict]:
    """Marks `logo_id` as the default, clearing the flag on every other
    record. Returns the new default record or None when the id is unknown."""
    idx = _load_index()
    if logo_id not in idx:
        return None
    for k, rec in idx.items():
        rec["is_default"] = (k == logo_id)
    _save_index(idx)
    return idx[logo_id]


def rename_logo(logo_id: str, new_name: str) -> Optional[dict]:
    """Updates the display name of a logo. Returns the updated record or
    None when the id is unknown."""
    idx = _load_index()
    if logo_id not in idx:
        return None
    idx[logo_id]["name"] = (new_name or "").strip()[:120] or idx[logo_id]["name"]
    _save_index(idx)
    return idx[logo_id]


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
