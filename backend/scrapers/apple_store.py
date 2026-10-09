"""
Apple App Store Scraper
Uses iTunes Search API + Bing web crawler fallback.
"""

import httpx
from scrapers.google_search import scrape_google_search_for_platform

ITUNES_SEARCH_URL = "https://itunes.apple.com/search"


async def scrape_apple_store(brand_name: str) -> list:
    """
    Search Apple App Store via iTunes Search API & Web Crawler fallback.
    """
    results = []

    try:
        async with httpx.AsyncClient(timeout=15.0, verify=False, follow_redirects=True) as client:
            response = await client.get(
                ITUNES_SEARCH_URL,
                params={
                    "term": brand_name,
                    "entity": "software",
                    "country": "us",
                    "limit": 15,
                },
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                },
            )

            if response.status_code == 200:
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
                        },
                    })
    except Exception as e:
        print(f"[WARN] iTunes API error: {e}")

    # Fallback to web search crawler if iTunes API returns 0 items
    if not results:
        results = await scrape_google_search_for_platform(brand_name, "apple_store")

    return results
