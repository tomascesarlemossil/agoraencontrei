"""
Regression tests for the logo library (logos.py):

  1. Alpha preservation — a transparent PNG/WEBP KEEPS its transparency; it is
     never flattened onto a white background. This is the exact bug behind
     "logo transparente com quadrado branco atrás".
  2. Format acceptance — an opaque JPEG is accepted and normalised to PNG-RGBA.
  3. Multi-tenant isolation — a logo belongs to a company (companyId); a
     partner can only list / read / delete / rename / set-default its OWN logos.

The module reads LOGOS_STORE_DIR at import time, so each test reloads `logos`
against a fresh temp dir (fixture below) to keep the index.json isolated.
"""
import importlib
import io

import pytest
from PIL import Image


@pytest.fixture
def logos(tmp_path, monkeypatch):
    monkeypatch.setenv("LOGOS_STORE_DIR", str(tmp_path))
    import logos as logos_mod
    importlib.reload(logos_mod)
    return logos_mod


# ── Image builders ─────────────────────────────────────────────────────────

def _transparent_png() -> bytes:
    """20x20 image, mostly transparent, with one opaque red pixel at (0,0)."""
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    img.putpixel((0, 0), (255, 0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _transparent_webp() -> bytes:
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    img.putpixel((0, 0), (0, 255, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="WEBP", lossless=True)
    return buf.getvalue()


def _opaque_jpeg() -> bytes:
    img = Image.new("RGB", (20, 20), (12, 58, 31))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def _load_saved(logos, rec, company=None):
    path = logos.get_logo_path(rec["id"], company)
    assert path is not None
    return Image.open(path)


# ── Alpha preservation ─────────────────────────────────────────────────────

def test_transparent_png_keeps_alpha(logos):
    rec = logos.save_logo("Marca", _transparent_png(), "image/png", company="c1")
    img = _load_saved(logos, rec, "c1")
    assert img.mode == "RGBA"
    # The transparent region must still be transparent (alpha 0), NOT white.
    r, g, b, a = img.getpixel((10, 10))
    assert a == 0, "logo transparente foi achatado (perdeu o alpha)"
    # And it must not have been flattened to opaque white anywhere.
    assert img.getpixel((10, 10)) != (255, 255, 255, 255)
    # The opaque content pixel survives.
    assert img.getpixel((0, 0))[3] == 255


def test_transparent_webp_keeps_alpha(logos):
    rec = logos.save_logo("Marca WEBP", _transparent_webp(), "image/webp", company="c1")
    img = _load_saved(logos, rec, "c1")
    assert img.mode == "RGBA"
    assert img.getpixel((10, 10))[3] == 0


def test_opaque_jpeg_is_accepted_and_normalised(logos):
    rec = logos.save_logo("Marca JPG", _opaque_jpeg(), "image/jpeg", company="c1")
    assert rec["mime"] == "image/png"
    img = _load_saved(logos, rec, "c1")
    assert img.mode == "RGBA"  # normalised to RGBA even without transparency


def test_invalid_bytes_raise_valueerror(logos):
    with pytest.raises(ValueError):
        logos.save_logo("Lixo", b"not an image at all", "image/png", company="c1")


# ── Multi-tenant isolation ─────────────────────────────────────────────────

def test_list_is_scoped_by_company(logos):
    a = logos.save_logo("A1", _transparent_png(), "image/png", company="A")
    b = logos.save_logo("B1", _transparent_png(), "image/png", company="B")

    ids_a = {r["id"] for r in logos.list_logos("A")}
    ids_b = {r["id"] for r in logos.list_logos("B")}
    assert ids_a == {a["id"]}
    assert ids_b == {b["id"]}
    # No scope (None) still sees everything (legacy/internal callers).
    ids_all = {r["id"] for r in logos.list_logos(None)}
    assert ids_all == {a["id"], b["id"]}


def test_cross_tenant_read_is_blocked(logos):
    b = logos.save_logo("B1", _transparent_png(), "image/png", company="B")
    # Company A cannot see B's logo by id, path, get, or default.
    assert logos.get_logo(b["id"], "A") is None
    assert logos.get_logo_path(b["id"], "A") is None
    assert logos.get_default_logo("A") is None
    # But B can.
    assert logos.get_logo(b["id"], "B") is not None


def test_cross_tenant_mutations_are_blocked(logos):
    b = logos.save_logo("B1", _transparent_png(), "image/png", company="B")
    assert logos.delete_logo(b["id"], "A") is False
    assert logos.rename_logo(b["id"], "hack", "A") is None
    assert logos.set_default_logo(b["id"], "A") is None
    # B's record is untouched.
    assert logos.get_logo(b["id"], "B")["name"] == "B1"
    # Owner can rename/delete.
    assert logos.rename_logo(b["id"], "B renamed", "B")["name"] == "B renamed"
    assert logos.delete_logo(b["id"], "B") is True


def test_default_is_per_company(logos):
    a1 = logos.save_logo("A1", _transparent_png(), "image/png", company="A")
    a2 = logos.save_logo("A2", _transparent_png(), "image/png", company="A")
    b1 = logos.save_logo("B1", _transparent_png(), "image/png", company="B")

    # First logo of each company becomes that company's default.
    assert logos.get_default_logo("A")["id"] == a1["id"]
    assert logos.get_default_logo("B")["id"] == b1["id"]

    # Switching A's default only touches A's logos, never B's.
    logos.set_default_logo(a2["id"], "A")
    assert logos.get_default_logo("A")["id"] == a2["id"]
    assert logos.get_logo(b1["id"], "B")["is_default"] is True
