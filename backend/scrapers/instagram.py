"""
Instagram Scraper
Uses Instaloader and DuckDuckGo search (site:instagram.com) for public profile discovery.
"""

import instaloader
import asyncio
import httpx
from bs4 import BeautifulSoup
import urllib.parse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


async def scrape_instagram(brand_name: str) -> list:
    """
    Search Instagram for profiles matching the brand name.
    """
    results = []

    # 1. Search site:instagram.com via DuckDuckGo
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            query = f'site:instagram.com "{brand_name}"'
            resp = await client.post(
                "https://html.duckduckgo.com/html/",
                data={"q": query},
                headers=HEADERS,
            )
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                for r in soup.select(".result"):
                    link_el = r.select_one(".result__a")
                    snippet_el = r.select_one(".result__snippet")
                    if link_el:
                        raw_href = link_el.get("href", "")
                        url = _clean_ddg_url(raw_href)
                        title = link_el.get_text(strip=True)
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                        if url and "instagram.com/" in url and not any(x in url for x in ["/p/", "/reel/", "/stories/"]):
                            # Extract username from URL or title
                            profile_name = title.replace(" (@", " (").replace(" • Instagram photos and videos", "").replace(" - Instagram", "").strip()
                            results.append({
                                "platform": "instagram",
                                "item_name": profile_name or brand_name,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": profile_name,
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "title": title,
                                    "snippet": snippet,
                                    "instagram_url": url,
                                },
                            })
    except Exception as e:
        print(f"[WARN] Instagram DDG search error: {e}")

    # 2. Try Instaloader for exact handle if DDG yielded no results
    if not results:
        try:
            L = instaloader.Instaloader(
                download_pictures=False,
                download_videos=False,
                download_video_thumbnails=False,
                download_geotags=False,
                download_comments=False,
                save_metadata=False,
                compress_json=False,
                quiet=True,
                max_connection_attempts=1,
            )
            handle = brand_name.lower().strip().replace(" ", "")
            profile = await asyncio.to_thread(_get_profile, L, handle)
            if profile:
                results.append(profile)
        except Exception as e:
            print(f"[WARN] Instaloader error: {e}")

    return results


def _get_profile(loader, username: str) -> dict:
    """Fetch a single Instagram profile's public data."""
    try:
        profile = instaloader.Profile.from_username(loader.context, username)
        return {
            "platform": "instagram",
            "item_name": f"@{profile.username}",
            "item_url": f"https://www.instagram.com/{profile.username}/",
            "item_icon_url": profile.profile_pic_url or "",
            "item_developer": profile.full_name or "",
            "item_description": profile.biography or "",
            "raw_data": {
                "username": profile.username,
                "full_name": profile.full_name,
                "followers": profile.followers,
                "following": profile.followees,
                "posts": profile.mediacount,
                "is_verified": profile.is_verified,
            },
        }
    except Exception:
        return None


def _clean_ddg_url(raw_url: str) -> str:
    if "uddg=" in raw_url:
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "uddg" in parsed:
            return parsed["uddg"][0]
    return raw_url
