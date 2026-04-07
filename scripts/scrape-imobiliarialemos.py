#!/usr/bin/env python3
"""
Scraper for www.imobiliarialemos.com.br
Fetches all ~976 active property listings across ~82 pages.
Listing pages give: ref, type, price, purpose, bedrooms, bathrooms, parking, neighborhood.
Detail pages give: suites, area (útil/construída/total), full title.
"""

import json
import re
import time
import math
import urllib.request
import urllib.error
from urllib.parse import urljoin

BASE_URL = "https://www.imobiliarialemos.com.br"
OUTPUT_FILE = "/Users/tomaslemos/Downloads/squads/agoraencontrei/scripts/imobiliarialemos-scrape.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

DELAY_BETWEEN_PAGES = 0.3  # seconds
DETAIL_DELAY = 0.5


def fetch_url(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            print(f"  [attempt {attempt+1}] Error fetching {url}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return None


def parse_price(price_str):
    """Convert 'R$ 1.250.000,00' to int (cents-free)."""
    if not price_str:
        return None
    price_str = price_str.strip()
    if "consulta" in price_str.lower() or "negoci" in price_str.lower():
        return None
    cleaned = re.sub(r"[R$\s]", "", price_str)
    cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def parse_area(area_str):
    """Convert '76,00 m²' or '76 m²' to float."""
    if not area_str:
        return None
    m = re.search(r"([\d]+(?:[.,]\d+)?)", area_str)
    if m:
        try:
            return float(m.group(1).replace(",", "."))
        except ValueError:
            return None
    return None


def extract_detalhe_value(chunk, icon_class):
    """
    From a chunk like:
    <div class="detalhe_novo"><div class="icone_numero"><i class="ph ph-bed"></i><span>3</span></div><span> quartos</span></div>
    Extract the number for the given icon class.
    """
    pattern = re.compile(
        r'class="[^"]*' + re.escape(icon_class) + r'[^"]*"[^>]*></i><span>(\d+)</span>',
        re.IGNORECASE
    )
    m = pattern.search(chunk)
    return int(m.group(1)) if m else None


def parse_listing_card(card_html):
    """Parse a single property card from listing page HTML."""
    prop = {}

    # URL and purpose from the href
    url_m = re.search(r'href="(/(?:comprar|alugar)/[^"]+)"', card_html)
    if url_m:
        path = url_m.group(1)
        prop["url"] = BASE_URL + path
        prop["purpose"] = "SALE" if "/comprar/" in path else "RENT"
    else:
        prop["url"] = None
        prop["purpose"] = None

    # Reference code: Ref.AP00922 or Ref.CA01623
    ref_m = re.search(r'Ref\.([A-Z]{2}\d+)', card_html)
    if not ref_m:
        return None
    prop["reference"] = ref_m.group(1)

    # Property type (from h3 title_novo)
    type_m = re.search(r'class="titulo_novo[^"]*">([^<]+)</h3>', card_html)
    prop["propertyType"] = type_m.group(1).strip() if type_m else None

    # Price - look for valor_novo section
    # <small>VENDA</small><h5>R$ 850.000,00</h5> or <small>LOCAÇÃO</small><h5>R$ 3.500,00</h5>
    price_section_m = re.search(
        r'<small>(VENDA|LOCA[ÇC][ÃA]O|ALUGUEL|TEMPORADA)</small><h5>(R\$\s*[\d.,]+|Valor sob consulta)</h5>',
        card_html, re.IGNORECASE
    )
    if price_section_m:
        purpose_label = price_section_m.group(1).upper()
        price_raw = price_section_m.group(2)
        price_val = parse_price(price_raw)

        if "LOCA" in purpose_label or "ALUGUEL" in purpose_label or "TEMPORADA" in purpose_label:
            prop["purpose"] = "RENT"
            prop["price"] = None
            prop["priceRent"] = price_val
        else:
            prop["purpose"] = "SALE"
            prop["price"] = price_val
            prop["priceRent"] = None
    else:
        # Try generic price
        price_m = re.search(r'R\$\s*([\d.,]+)', card_html)
        if price_m:
            price_val = parse_price("R$ " + price_m.group(1))
            # Heuristic: very low values likely rentals
            if price_val is not None and price_val < 30000:
                prop["purpose"] = prop.get("purpose") or "RENT"
                prop["price"] = None
                prop["priceRent"] = price_val
            else:
                prop["price"] = price_val
                prop["priceRent"] = None
        else:
            prop["price"] = None
            prop["priceRent"] = None

    # Characteristics from icones_caracteristicas section
    chars_m = re.search(r'icones_caracteristicas">(.*?)</div></div></div>', card_html, re.DOTALL)
    chars_html = chars_m.group(1) if chars_m else card_html

    # Bedrooms: ph-bed icon
    bed_m = re.search(r'ph-bed[^>]*></i><span>(\d+)</span>', chars_html)
    prop["bedrooms"] = int(bed_m.group(1)) if bed_m else None

    # Bathrooms: ph-shower icon
    bath_m = re.search(r'ph-shower[^>]*></i><span>(\d+)</span>', chars_html)
    prop["bathrooms"] = int(bath_m.group(1)) if bath_m else None

    # Parking: ph-car-simple icon
    park_m = re.search(r'ph-car-simple[^>]*></i><span>(\d+)</span>', chars_html)
    prop["parkingSpaces"] = int(park_m.group(1)) if park_m else None

    # Neighborhood: final_card section
    neigh_m = re.search(r'class="final_card"><span>([^<]+)</span>', card_html)
    prop["neighborhood"] = neigh_m.group(1).strip() if neigh_m else None

    # Title: not on listing cards directly, will get from detail
    prop["title"] = None
    prop["suites"] = None
    prop["totalArea"] = None
    prop["builtArea"] = None

    return prop


def scrape_listing_page(page_num):
    """Scrape one listing page, return list of property dicts and total count."""
    if page_num == 1:
        url = f"{BASE_URL}/imoveis/"
    else:
        url = f"{BASE_URL}/imoveis/pagina-{page_num}/"

    html = fetch_url(url)
    if not html:
        return [], None

    # Get total count
    total_count = None
    count_m = re.search(r"(\d+)\s+Im[oó]veis?\s+encontrados?", html, re.IGNORECASE)
    if count_m:
        total_count = int(count_m.group(1))

    # Split into cards
    cards_raw = re.split(
        r'(?=<a[^>]+href="/(?:comprar|alugar)/[^"]+"\s+class="link_resultado")',
        html
    )

    properties = []
    for card_html in cards_raw[1:]:  # Skip preamble
        # Take reasonable chunk of the card
        card_chunk = card_html[:4000]
        prop = parse_listing_card(card_chunk)
        if prop:
            properties.append(prop)

    return properties, total_count


def scrape_detail_page(url):
    """Fetch detail page and extract suites, areas, title."""
    html = fetch_url(url)
    if not html:
        return {}

    extra = {}

    # Title from h1
    title_m = re.search(r'<h1[^>]*class="titulo"[^>]*>([^<]+)</h1>', html, re.IGNORECASE)
    if title_m:
        extra["title"] = title_m.group(1).strip()
    else:
        # Fallback: og:title
        og_m = re.search(r'property="og:title"\s+content="([^"]+)"', html)
        if og_m:
            extra["title"] = og_m.group(1).strip()

    # Detail section with suites, areas (different structure than listing cards)
    # <div class="detalhe"><i class="icon bath"></i><span>sendo 1<span> suíte</span></span></div>
    suite_m = re.search(r'(\d+)\s*<span>\s*su[ií]te', html, re.IGNORECASE)
    if not suite_m:
        # Alternative: "sendo 1 suíte" in span text
        suite_m = re.search(r'sendo\s+(\d+)\s*(?:<[^>]+>)?\s*su[ií]te', html, re.IGNORECASE)
    if not suite_m:
        suite_m = re.search(r'(\d+)\s*su[ií]te', html, re.IGNORECASE)
    if suite_m:
        extra["suites"] = int(suite_m.group(1))

    # Area - look for m² útil / construída / total
    # <span>76,00 m² útil</span>
    util_m = re.search(r'([\d]+(?:[.,]\d+)?)\s*m[²2]\s*[úu]til', html, re.IGNORECASE)
    construida_m = re.search(r'([\d]+(?:[.,]\d+)?)\s*m[²2]\s*constru[ií]da', html, re.IGNORECASE)
    total_m = re.search(r'([\d]+(?:[.,]\d+)?)\s*m[²2]\s*total', html, re.IGNORECASE)

    if util_m:
        extra["builtArea"] = parse_area(util_m.group(0))
    if construida_m:
        extra["builtArea"] = parse_area(construida_m.group(0))
    if total_m:
        extra["totalArea"] = parse_area(total_m.group(0))
    elif util_m and "totalArea" not in extra:
        # If no explicit total, use útil as totalArea when there's only one area
        extra["totalArea"] = parse_area(util_m.group(0))

    return extra


def main():
    all_properties = []
    seen_refs = set()

    print("Phase 1: Scraping all listing pages...")
    print("=" * 60)

    # Get page 1 and determine total pages
    print("Fetching page 1...")
    props, total_count = scrape_listing_page(1)
    print(f"  Total properties on site: {total_count}")

    for p in props:
        if p["reference"] not in seen_refs:
            all_properties.append(p)
            seen_refs.add(p["reference"])

    if total_count:
        total_pages = math.ceil(total_count / 12)
    else:
        total_pages = 82

    print(f"  Total pages to scrape: {total_pages}")
    print(f"  Found {len(props)} on page 1")

    # Scrape pages 2 through total_pages
    for page_num in range(2, total_pages + 1):
        print(f"Fetching page {page_num}/{total_pages}...", end=" ", flush=True)
        props, _ = scrape_listing_page(page_num)
        new_count = 0
        for p in props:
            if p["reference"] not in seen_refs:
                all_properties.append(p)
                seen_refs.add(p["reference"])
                new_count += 1
        print(f"{new_count} new ({len(all_properties)} total)")
        time.sleep(DELAY_BETWEEN_PAGES)

    print()
    print(f"Phase 1 complete: {len(all_properties)} unique properties from listing pages")
    print()

    # Save intermediate results
    print("Saving intermediate results...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_properties, f, ensure_ascii=False, indent=2)

    print()
    print("Phase 2: Fetching detail pages for additional data...")
    print("=" * 60)

    # For each property, fetch detail page to get suites, area, title
    for i, prop in enumerate(all_properties):
        if not prop.get("url"):
            continue

        print(f"  [{i+1}/{len(all_properties)}] {prop['reference']}...", end=" ", flush=True)
        extra = scrape_detail_page(prop["url"])

        if extra.get("title"):
            prop["title"] = extra["title"]
        if extra.get("suites") is not None:
            prop["suites"] = extra["suites"]
        if extra.get("totalArea") is not None:
            prop["totalArea"] = extra["totalArea"]
        if extra.get("builtArea") is not None:
            prop["builtArea"] = extra["builtArea"]

        print(f"title={'OK' if prop.get('title') else '-'} suites={prop.get('suites','-')} area={prop.get('totalArea','-')}")
        time.sleep(DETAIL_DELAY)

        # Save every 50 properties
        if (i + 1) % 50 == 0:
            print(f"  [Checkpoint] Saving {len(all_properties)} properties...")
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(all_properties, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 60)

    # Final cleanup: ensure all fields exist
    required_fields = ["reference", "title", "bedrooms", "suites", "bathrooms",
                       "parkingSpaces", "totalArea", "builtArea", "price",
                       "priceRent", "purpose", "url", "neighborhood", "propertyType"]
    for prop in all_properties:
        for field in required_fields:
            prop.setdefault(field, None)

    # Final save
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_properties, f, ensure_ascii=False, indent=2)

    print(f"Total unique properties scraped: {len(all_properties)}")
    sale_count = sum(1 for p in all_properties if p.get("purpose") == "SALE")
    rent_count = sum(1 for p in all_properties if p.get("purpose") == "RENT")
    no_purpose = sum(1 for p in all_properties if not p.get("purpose"))
    with_title = sum(1 for p in all_properties if p.get("title"))
    with_area = sum(1 for p in all_properties if p.get("totalArea"))
    with_suites = sum(1 for p in all_properties if p.get("suites") is not None)
    print(f"  SALE: {sale_count}, RENT: {rent_count}, Unknown: {no_purpose}")
    print(f"  With title: {with_title}, With area: {with_area}, With suites: {with_suites}")
    print(f"Written to: {OUTPUT_FILE}")

    return all_properties


if __name__ == "__main__":
    main()
