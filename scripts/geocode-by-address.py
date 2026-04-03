#!/usr/bin/env python3
"""
Precision geocoding per property using full address (street + number + city + state).
Runs AFTER geocode-properties.py (city-level pass) to refine coordinates.
Only processes properties that have a street address defined.
"""
import json
import time
import urllib.request
import urllib.parse
import unicodedata
import re

DB_URL = "postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEON_API = "https://ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/sql"

def neon_query(sql, params=None):
    payload = {"query": sql}
    if params:
        payload["params"] = params
    req = urllib.request.Request(
        NEON_API,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Neon-Connection-String": DB_URL,
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def normalize(s):
    """Remove extra spaces and normalize unicode."""
    if not s:
        return ""
    # Normalize to NFC (proper accents)
    s = unicodedata.normalize("NFC", str(s).strip())
    # Remove repeated spaces
    s = re.sub(r"\s+", " ", s)
    # Remove '0000' placeholder numbers
    s = re.sub(r"\b0+\b", "", s).strip()
    return s

def geocode_address(street, number, neighborhood, city, state):
    """Try to geocode with progressively less specific queries."""
    city_n    = normalize(city)
    state_n   = normalize(state) if state and len(state) <= 2 else ""
    street_n  = normalize(street)
    number_n  = normalize(number)
    nbhd_n    = normalize(neighborhood)

    queries = []
    # Most specific first
    if street_n and number_n:
        if nbhd_n:
            queries.append(f"{street_n}, {number_n}, {nbhd_n}, {city_n}, {state_n}, Brasil")
        queries.append(f"{street_n}, {number_n}, {city_n}, {state_n}, Brasil")
    if street_n:
        queries.append(f"{street_n}, {city_n}, {state_n}, Brasil")
    if nbhd_n:
        queries.append(f"{nbhd_n}, {city_n}, {state_n}, Brasil")

    for query in queries:
        if not query.strip():
            continue
        params = urllib.parse.urlencode({
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": "br",
        })
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "AgoraEncontrei/1.0 (geocode-address)"
        })
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                results = json.loads(resp.read())
                if results:
                    return float(results[0]["lat"]), float(results[0]["lon"]), query
        except Exception as e:
            pass
        time.sleep(1.0)  # rate limit between fallback attempts

    return None, None, None

def main():
    # Get all properties WITH street data (regardless of current lat/lng — refresh with precise coords)
    result = neon_query("""
        SELECT id, reference, street, number, neighborhood, city, state
        FROM properties
        WHERE street IS NOT NULL AND street != ''
          AND city IS NOT NULL
        ORDER BY city, reference
        LIMIT 5000
    """)
    props = result.get("rows", [])
    print(f"Properties with street address: {len(props)}")

    updated = 0
    failed  = 0
    skip    = 0

    for i, p in enumerate(props, 1):
        ref       = p.get("reference", "?")
        street    = p.get("street") or ""
        number    = p.get("number") or ""
        nbhd      = p.get("neighborhood") or ""
        city      = p.get("city") or ""
        state     = p.get("state") or ""

        # Skip if street is just a zip or only numbers (not a real address)
        if re.match(r"^\d{5}-?\d{3}$", street.strip()):
            skip += 1
            continue

        print(f"[{i}/{len(props)}] {ref} | {street} {number}, {nbhd}, {city}/{state}...", end=" ", flush=True)

        lat, lng, matched_query = geocode_address(street, number, nbhd, city, state)

        if lat and lng:
            neon_query(
                "UPDATE properties SET latitude = $1, longitude = $2 WHERE id = $3",
                [lat, lng, p["id"]]
            )
            print(f"✅ ({lat:.4f},{lng:.4f})")
            updated += 1
        else:
            print(f"⚠️  not found")
            failed += 1

        time.sleep(1.0)  # Nominatim: max 1 req/sec

    print(f"\n{'='*60}")
    print(f"Address geocoding complete!")
    print(f"  Updated: {updated}")
    print(f"  Failed:  {failed}")
    print(f"  Skipped: {skip}")

    # Final count of nulls
    verify = neon_query("SELECT COUNT(*) as cnt FROM properties WHERE latitude IS NULL")
    print(f"  Still null (all): {verify['rows'][0]['cnt']}")

if __name__ == "__main__":
    main()
