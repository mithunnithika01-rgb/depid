"""
YouTube Scraper
Uses httpx to search YouTube directly (no API key needed).
Falls back to youtube-search-python if available.
"""

import httpx
from bs4 import BeautifulSoup
import json
import re
import asyncio


async def scrape_youtube(brand_name: str) -> list:
    """
    Search YouTube for channels matching the brand name.
    Uses direct YouTube search page scraping.
    """
    results = []

    # Method 1: Try youtube-search-python library
    try:
        from youtubesearchpython import ChannelsSearch
        search = await asyncio.to_thread(_lib_search, brand_name)
        if search:
            return search
    except Exception:
        pass

    # Method 2: Scrape YouTube search directly
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, verify=False) as client:
            response = await client.get(
                "https://www.youtube.com/results",
                params={"search_query": brand_name, "sp": "EgIQAg%3D%3D"},  # sp = filter by channels
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )

            if response.status_code != 200:
                return results

            # YouTube embeds data in a script tag as JSON
            text = response.text
            # Find the ytInitialData JSON
            match = re.search(r'var ytInitialData = ({.*?});</script>', text)
            if not match:
                match = re.search(r'ytInitialData\s*=\s*({.*?});\s*</script>', text)

            if match:
                try:
                    data = json.loads(match.group(1))
                    results = _parse_yt_data(data)
                except json.JSONDecodeError:
                    pass

    except Exception as e:
        print(f"[WARN] YouTube scraper error: {e}")

    return results


def _lib_search(brand_name: str) -> list:
    """Try using youtube-search-python library."""
    try:
        from youtubesearchpython import ChannelsSearch
        search = ChannelsSearch(brand_name, limit=10)
        data = search.result()
        results = []

        for ch in data.get("result", []):
            thumbnails = ch.get("thumbnails", [])
            thumb_url = thumbnails[-1].get("url", "") if thumbnails else ""

            # Build description from snippet
            desc_snippet = ch.get("descriptionSnippet", [])
            if isinstance(desc_snippet, list):
                desc = " ".join([s.get("text", "") for s in desc_snippet])
            else:
                desc = str(desc_snippet) if desc_snippet else ""

            results.append({
                "platform": "youtube",
                "item_name": ch.get("title", ""),
                "item_url": f"https://www.youtube.com/channel/{ch.get('id', '')}",
                "item_icon_url": thumb_url,
                "item_developer": ch.get("title", ""),
                "item_description": desc,
                "raw_data": {
                    "channel_id": ch.get("id", ""),
                    "subscribers": ch.get("subscribers", ""),
                    "video_count": ch.get("videoCount", ""),
                },
            })

        return results
    except Exception:
        return []


def _parse_yt_data(data: dict) -> list:
    """Parse YouTube's ytInitialData JSON for channel results."""
    results = []

    try:
        contents = (
            data.get("contents", {})
            .get("twoColumnSearchResultsRenderer", {})
            .get("primaryContents", {})
            .get("sectionListRenderer", {})
            .get("contents", [])
        )

        for section in contents:
            items = (
                section.get("itemSectionRenderer", {})
                .get("contents", [])
            )

            for item in items:
                channel = item.get("channelRenderer", {})
                if not channel:
                    continue

                channel_id = channel.get("channelId", "")
                title = channel.get("title", {}).get("simpleText", "")

                # Get thumbnail
                thumbs = channel.get("thumbnail", {}).get("thumbnails", [])
                thumb_url = thumbs[-1].get("url", "") if thumbs else ""
                if thumb_url.startswith("//"):
                    thumb_url = "https:" + thumb_url

                # Get description
                desc_runs = channel.get("descriptionSnippet", {}).get("runs", [])
                description = " ".join([r.get("text", "") for r in desc_runs])

                # Get subscriber count
                subs = channel.get("subscriberCountText", {}).get("simpleText", "")

                if title:
                    results.append({
                        "platform": "youtube",
                        "item_name": title,
                        "item_url": f"https://www.youtube.com/channel/{channel_id}",
                        "item_icon_url": thumb_url,
                        "item_developer": title,
                        "item_description": description,
                        "raw_data": {
                            "channel_id": channel_id,
                            "subscribers": subs,
                        },
                    })

    except Exception:
        pass

    return results
