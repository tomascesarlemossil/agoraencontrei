#!/usr/bin/env python3
"""
Geocode all properties with null latitude/longitude using Nominatim (OpenStreetMap).
Groups by unique city+state to minimize API calls (~20 requests for 991 properties).
"""
import json
import time
import urllib.request
import urllib.parse
import urllib.error

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

def geocode_city(city, state):
    """Geocode a Brazilian city using Nominatim."""
    query = f"{city}, {state}, Brazil"
    params = urllib.parse.urlencode({
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "br",
    })
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "AgoraEncontrei/1.0 (imobiliaria-lemos@geocode)"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        print(f"  ⚠️  Geocoding error for {city}/{state}: {e}")
    return None, None

def main():
    # Step 1: Get all unique city+state combinations with null lat/lng
    result = neon_query("""
        SELECT UPPER(city) as city_norm, state, COUNT(*) as cnt
        FROM properties
        WHERE latitude IS NULL
        GROUP BY UPPER(city), state
        ORDER BY cnt DESC
    """)
    cities = result["rows"]
    print(f"Found {len(cities)} unique city+state combinations to geocode\n")

    geocoded = 0
    failed = 0

    for row in cities:
        city_norm = row["city_norm"]
        state = row["state"]
        cnt = row["cnt"]

        print(f"Geocoding: {city_norm}, {state} ({cnt} properties)...", end=" ", flush=True)
        lat, lng = geocode_city(city_norm, state)

        if lat and lng:
            # Update all properties in this city+state (case-insensitive match)
            update_result = neon_query(
                """UPDATE properties
                   SET latitude = $1, longitude = $2
                   WHERE UPPER(city) = $3 AND state = $4 AND latitude IS NULL""",
                [lat, lng, city_norm, state]
            )
            updated = update_result.get("rowCount", 0)
            print(f"✅ lat={lat:.4f}, lng={lng:.4f} → {updated} properties updated")
            geocoded += int(updated)
        else:
            print(f"❌ not found")
            failed += 1

        # Respect Nominatim rate limit: 1 request per second
        time.sleep(1.1)

    # Step 2: Summary
    print(f"\n{'='*50}")
    print(f"Geocoding complete!")
    print(f"  Properties updated: {geocoded}")
    print(f"  Cities failed:      {failed}")

    # Verify
    verify = neon_query("SELECT COUNT(*) as cnt FROM properties WHERE latitude IS NULL AND status = 'ACTIVE'")
    remaining = verify["rows"][0]["cnt"]
    print(f"  Still null (active): {remaining}")

if __name__ == "__main__":
    main()
