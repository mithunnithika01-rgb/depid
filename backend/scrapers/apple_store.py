"""
Apple App Store Scraper
Uses the free iTunes Search API (no library needed — it's a simple REST API).
Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
"""

import httpx


ITUNES_SEARCH_URL = "https://itunes.apple.com/search"


async def scrape_apple_store(brand_name: str) -> list:
    """
    Search Apple App Store via the official iTunes Search API.
    Completely free, no auth, no scraping.
    """
    results = []

    try:
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.get(
                ITUNES_SEARCH_URL,
                params={
                    "term": brand_name,
                    "entity": "software",
                    "country": "us",
                    "limit": 15,
                },
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
            )

            if response.status_code != 200:
                print(f"[WARN] iTunes API returned status {response.status_code}")
                return results

            data = response.json()

            for item in data.get("results", []):
                results.append({
                    "platform": "apple_store",
                    "item_name": item.get("trackName", ""),
                    "item_url": item.get("trackViewUrl", ""),
                    "item_icon_url": item.get("artworkUrl512", "") or item.get("artworkUrl100", ""),
                    "item_developer": item.get("sellerName", "") or item.get("artistName", ""),
                    "item_description": (item.get("description", "") or "")[:300],
                    "raw_data": {
                        "bundle_id": item.get("bundleId", ""),
                        "price": item.get("price", 0),
                        "rating": item.get("averageUserRating"),
                        "rating_count": item.get("userRatingCount"),
                        "seller_url": item.get("sellerUrl", ""),
                        "genre": item.get("primaryGenreName", ""),
                        "content_rating": item.get("contentAdvisoryRating", ""),
                    },
                })

    except Exception as e:
        print(f"[WARN] Apple Store scraper error: {e}")

    return results
