#!/usr/bin/env python3
"""
Scraper for the CURRENT www.imobiliarialemos.com.br site (rebuilt platform).

Produces a complete, clean backup of every active listing so the data can be
re-imported correctly — fixing wrong info and mixed-up photos.

Two phases:
  1. Listing pages  (/imoveis/pagina-N/)  → one card per property with:
       siteId, url, purpose, type, uf/city/neighborhood, price, bedrooms,
       bathrooms, parking spaces, reference code.
  2. Detail pages   (the card's own URL)  → title, description, suites,
       areas (útil→builtArea, construída→totalArea) and the ISOLATED photo
       gallery (only the property's own photos — never the "Imóveis
       semelhantes" section, which belongs to OTHER properties and was the
       root cause of the mixed-photo bug).

Cards are returned newest-first (highest siteId first), preserving the site's
publication order so the importer can keep the latest listings on top.

Output: JSON array written to --out (default scripts/lemos-backup.json).
Usage:  python3 scripts/scrape-imobiliarialemos.py [--out FILE] [--limit N]
"""

import argparse
import json
import math
import os
import re
import time
import urllib.request

BASE_URL = "https://www.imobiliarialemos.com.br"
DEFAULT_OUT = os.path.join(os.path.dirname(__file__), "lemos-backup.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

DELAY_LISTING = 0.3
DELAY_DETAIL = 0.4
PER_PAGE = 12

# Everything after this heading belongs to OTHER properties (recommendations).
SIMILAR_MARKERS = ["imóveis semelhantes", "imoveis semelhantes",
                   "imóveis relacionados", "imoveis relacionados"]

# Non-photo chrome that can appear on the same CDNs.
FAKE_PATTERNS = ["fundosite", "favicon", "painel_2023", "autoatendimento",
                 "logo", "banner", "whatsapp", "placeholder", "sem-foto",
                 "foto_vazio", "noimage"]

TYPE_MAP = {
    "apartamento": "APARTMENT", "casa": "HOUSE", "terreno": "LAND",
    "chacara": "FARM", "chácara": "FARM", "sitio": "FARM", "sítio": "FARM",
    "fazenda": "FARM", "rancho": "RANCH", "galpao": "WAREHOUSE",
    "galpão": "WAREHOUSE", "barracao": "WAREHOUSE", "escritorio": "OFFICE",
    "sala": "OFFICE", "loja": "STORE", "studio": "STUDIO",
    "cobertura": "PENTHOUSE", "kitnet": "KITNET", "flat": "APARTMENT",
    "predio": "CONDO", "prédio": "CONDO", "sobrado": "HOUSE",
}


def fetch_url(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:  # noqa: BLE001
            print(f"  [attempt {attempt+1}] error {url}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return None


def parse_price(text):
    """'R$ 1.100.000,00' → 1100000 (int). None for 'sob consulta'."""
    if not text:
        return None
    if re.search(r"consulta|negoci", text, re.I):
        return None
    cleaned = re.sub(r"[R$\s]", "", text).replace(".", "").replace(",", ".")
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def parse_area(text):
    """'1.000,00 m²' → 1000.0. pt-BR: '.' is thousands, ',' is decimal."""
    if not text:
        return None
    m = re.search(r"[\d.]+(?:,\d+)?", text)
    if not m:
        return None
    cleaned = m.group(0).replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def title_case(slug):
    if not slug:
        return None
    return " ".join(w.capitalize() for w in slug.replace("-", " ").split())


def isolate_photos(html):
    """Return the property's own gallery photos, in order, deduped by hash."""
    low = html.lower()
    cut = len(html)
    for marker in SIMILAR_MARKERS:
        idx = low.find(marker)
        if idx != -1 and idx < cut:
            cut = idx
    scoped = html[:cut]

    regex = re.compile(
        r"https?://(?:cdnuso\.com|cdn[0-9]*\.uso\.com\.br)/\d+/\d{4}/\d{2}/([a-z0-9_]+)\.(?:jpg|jpeg|png|webp)",
        re.I,
    )
    by_hash = {}
    for m in regex.finditer(scoped):
        url = m.group(0)
        if any(p in url.lower() for p in FAKE_PATTERNS):
            continue
        h = re.sub(r"^(mini_|thumb_|small_|medio_|media_|p_)", "", m.group(1))
        if h in by_hash:
            continue
        canonical = re.sub(r"https?://cdn[0-9]*\.uso\.com\.br", "https://cdnuso.com", url)
        canonical = re.sub(r"/(mini_|thumb_|small_|medio_|media_|p_)", "/", canonical)
        by_hash[h] = canonical
    return list(by_hash.values())


def parse_listing_card(seg):
    """Parse one card segment beginning at its anchor href."""
    href_m = re.search(r'href="(/(?:comprar|alugar)/([a-z]{2})/([a-z0-9-]+)/([a-z0-9-]+)/([a-z0-9-]+)/(\d+))"', seg, re.I)
    if not href_m:
        return None
    path, uf, city_slug, neigh_slug, type_slug, site_id = href_m.groups()

    prop = {
        "siteId": site_id,
        "url": BASE_URL + path,
        "purpose": "SALE" if "/comprar/" in path else "RENT",
        "state": uf.upper(),
        "city": title_case(city_slug),
        "neighborhood": title_case(neigh_slug),
        "type": TYPE_MAP.get(type_slug.lower(), "HOUSE"),
        "typeSlug": type_slug,
    }

    # The split already bounds `seg` to a single card, so scan the whole thing.
    card = seg

    # Price lives in a dedicated block: <div class="valor_novo"><small>VENDA
    # </small><h5>R$ 1.100.000,00</h5></div>. Reading it here (instead of the
    # first "R$" anywhere) avoids stray artifacts like financing widgets.
    prop["price"], prop["priceRent"] = None, None
    vb = re.search(r'valor_novo"[^>]*>\s*<small>([^<]*)</small>\s*<h5>([^<]*)</h5>', card, re.I)
    if vb:
        label = vb.group(1).upper()
        val = parse_price(vb.group(2))
        if re.search(r"LOCA|ALUGUEL|TEMPORADA", label):
            prop["purpose"] = "RENT"
            # Rent below R$50 is a placeholder for "sob consulta", not a price.
            prop["priceRent"] = val if (val and val >= 50) else None
        else:
            # Sale below R$1.000 is a placeholder (e.g. "R$ 1,11"), not a price.
            prop["price"] = val if (val and val >= 1000) else None

    # Characteristics use icon markup: <i class="ph ph-bed"></i><span>3</span>.
    def icon_num(icon):
        m = re.search(icon + r'[^>]*></i><span>(\d+)</span>', card, re.I)
        return int(m.group(1)) if m else None

    prop["bedrooms"] = icon_num(r"ph-bed")
    prop["bathrooms"] = icon_num(r"ph-shower")
    prop["parkingSpaces"] = icon_num(r"ph-car")

    ref_m = re.search(r"Ref\.?\s*([A-Z]{2,3}\d{3,7})", card)
    prop["reference"] = ref_m.group(1) if ref_m else None

    # Display location "BAIRRO - CIDADE/UF" from the final_card span.
    loc_m = re.search(r'final_card"><span>([^<]+)</span>', card)
    if loc_m:
        loc = loc_m.group(1).strip()
        parts = re.match(r"(.+?)\s*-\s*(.+?)/([A-Za-z]{2})\s*$", loc)
        if parts:
            prop["neighborhood"] = parts.group(1).strip().title()
            prop["city"] = parts.group(2).strip().title()
            prop["state"] = parts.group(3).upper()

    # Placeholders filled from the detail page.
    prop.update({"title": None, "description": None, "suites": None,
                 "totalArea": None, "builtArea": None, "landArea": None,
                 "images": [], "coverImage": None})
    return prop


def scrape_listing_page(page_num):
    url = f"{BASE_URL}/imoveis/" if page_num == 1 else f"{BASE_URL}/imoveis/pagina-{page_num}/"
    html = fetch_url(url)
    if not html:
        return [], None
    # The results count is "942 Imóveis encontrados". Match that phrase
    # specifically — a plain "N Imóveis" also matches the per-page selector
    # options (12/24/48), and picking the first would truncate to one page.
    total = None
    m = re.search(r"(\d+)\s+Im[oó]ve[íi]?s?\s+encontrad", html, re.I)
    if m:
        total = int(m.group(1))
    else:
        nums = [int(x) for x in re.findall(r"(\d+)\s+Im[oó]ve", html, re.I)]
        total = max(nums) if nums else None
    segments = re.split(r'(?=href="/(?:comprar|alugar)/)', html)
    cards = []
    for seg in segments[1:]:
        card = parse_listing_card(seg)
        if card:
            cards.append(card)
    return cards, total


def scrape_detail(prop):
    html = fetch_url(prop["url"])
    if not html:
        return

    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S | re.I)
    if m:
        prop["title"] = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1))).strip()
    if not prop["title"]:
        og = re.search(r'og:title"\s+content="([^"]+)"', html)
        if og:
            prop["title"] = og.group(1).strip()

    # Full description: between "Descrição do imóvel" and "Ver mais"/"Características".
    dm = re.search(r"Descri[çc][ãa]o do im[óo]vel(.*?)(?:Ver mais|Ver menos|Caracter[íi]sticas)", html, re.S | re.I)
    if dm:
        desc = re.sub(r"<[^>]+>", " ", dm.group(1))
        desc = re.sub(r"\s+", " ", desc).strip()
        if desc:
            prop["description"] = desc
    if not prop["description"]:
        og = re.search(r'og:description"\s+content="([^"]+)"', html)
        if og:
            prop["description"] = og.group(1).strip()

    txt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    sm = re.search(r"sendo\s+(\d+)\s*su[ií]te", txt, re.I) or re.search(r"(\d+)\s*su[ií]tes?", txt, re.I)
    if sm:
        prop["suites"] = int(sm.group(1))
    bm = re.search(r"(\d+)\s*dormit[óo]rios?", txt, re.I)
    if bm and not prop.get("bedrooms"):
        prop["bedrooms"] = int(bm.group(1))
    if not prop.get("bathrooms"):
        m2 = re.search(r"(\d+)\s*banheiros?", txt, re.I)
        if m2:
            prop["bathrooms"] = int(m2.group(1))
    if not prop.get("parkingSpaces"):
        m2 = re.search(r"(\d+)\s*vagas?", txt, re.I)
        if m2:
            prop["parkingSpaces"] = int(m2.group(1))

    util = re.search(r"([\d.,]+)\s*m[²2]\s*[úu]til", txt, re.I)
    constr = re.search(r"([\d.,]+)\s*m[²2]\s*constru[ií]da", txt, re.I)
    total = re.search(r"([\d.,]+)\s*m[²2]\s*total", txt, re.I)
    terreno = re.search(r"([\d.,]+)\s*m[²2]\s*terreno", txt, re.I)
    if util:
        prop["builtArea"] = parse_area(util.group(1))
    elif constr:
        prop["builtArea"] = parse_area(constr.group(1))
    if total:
        prop["totalArea"] = parse_area(total.group(1))
    elif util:
        prop["totalArea"] = parse_area(util.group(1))
    if terreno:
        prop["landArea"] = parse_area(terreno.group(1))

    photos = isolate_photos(html)
    if photos:
        prop["images"] = photos
        prop["coverImage"] = photos[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=0, help="stop after N properties (0 = all)")
    args = ap.parse_args()

    all_props, seen = [], set()

    print("Phase 1: listing pages...")
    cards, total = scrape_listing_page(1)
    print(f"  site reports {total} properties")
    for c in cards:
        if c["siteId"] not in seen:
            all_props.append(c); seen.add(c["siteId"])

    total_pages = math.ceil(total / PER_PAGE) if total else 90
    for page in range(2, total_pages + 1):
        cards, _ = scrape_listing_page(page)
        new = 0
        for c in cards:
            if c["siteId"] not in seen:
                all_props.append(c); seen.add(c["siteId"]); new += 1
        print(f"  page {page}/{total_pages}: +{new} ({len(all_props)} total)")
        if args.limit and len(all_props) >= args.limit:
            all_props = all_props[:args.limit]; break
        time.sleep(DELAY_LISTING)

    print(f"\nPhase 1 done: {len(all_props)} unique properties")
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(all_props, f, ensure_ascii=False, indent=2)

    print("\nPhase 2: detail pages (info + isolated photos)...")
    for i, prop in enumerate(all_props):
        scrape_detail(prop)
        print(f"  [{i+1}/{len(all_props)}] {prop['siteId']} "
              f"title={'ok' if prop['title'] else '-'} "
              f"photos={len(prop['images'])} suites={prop.get('suites','-')}")
        time.sleep(DELAY_DETAIL)
        if (i + 1) % 50 == 0:
            with open(args.out, "w", encoding="utf-8") as f:
                json.dump(all_props, f, ensure_ascii=False, indent=2)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(all_props, f, ensure_ascii=False, indent=2)

    with_photos = sum(1 for p in all_props if p["images"])
    with_title = sum(1 for p in all_props if p["title"])
    print(f"\nDone. {len(all_props)} properties → {args.out}")
    print(f"  with title: {with_title} | with photos: {with_photos}")


if __name__ == "__main__":
    main()
