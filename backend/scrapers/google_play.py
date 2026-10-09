"""
Google Play Store Scraper
Uses the 'google-play-scraper' library (pip install google-play-scraper).
Repo: https://github.com/JoMingyu/google-play-scraper
"""

from google_play_scraper import search, app as app_detail
import asyncio


async def scrape_google_play(brand_name: str) -> list:
    """
    Search Google Play Store for apps matching the brand name.
    Uses google-play-scraper library.
    """
    results = []

    try:
        # Run the synchronous library call in a thread pool
        search_results = await asyncio.to_thread(
            search,
            brand_name,
            lang="en",
            country="us",
            n_hits=15,
        )

        for item in search_results:
            results.append({
                "platform": "google_play",
                "item_name": item.get("title", ""),
                "item_url": f"https://play.google.com/store/apps/details?id={item.get('appId', '')}",
                "item_icon_url": item.get("icon", ""),
                "item_developer": item.get("developer", ""),
                "item_description": item.get("summary", "") or item.get("description", "")[:300],
                "raw_data": {
                    "app_id": item.get("appId", ""),
                    "score": item.get("score"),
                    "installs": item.get("installs", ""),
                    "price": item.get("price", 0),
                    "developer_id": item.get("developerId", ""),
                    "genre": item.get("genre", ""),
                },
            })

    except Exception as e:
        print(f"[WARN] Google Play scraper error: {e}")

    return results
