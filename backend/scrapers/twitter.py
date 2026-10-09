"""
Twitter/X Scraper
Uses Nitter instances and DuckDuckGo search (site:twitter.com OR site:x.com).
"""

import httpx
from bs4 import BeautifulSoup
import urllib.parse
import asyncio

NITTER_INSTANCES = [
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.cz",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


async def scrape_twitter(brand_name: str) -> list:
    """
    Search Twitter/X for profiles matching the brand name.
    """
    results = []

    # 1. Try DuckDuckGo search site:twitter.com / site:x.com (fast, guaranteed fallback)
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            query = f'(site:twitter.com OR site:x.com) "{brand_name}"'
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

                        if url and ("twitter.com/" in url or "x.com/" in url) and not any(x in url for x in ["/status/", "/intent/"]):
                            display_name = title.replace(" (@", " (").replace(") / Twitter", "").replace(") / X", "").replace(" | Twitter", "").replace(" | X", "").strip()
                            results.append({
                                "platform": "twitter",
                                "item_name": display_name or brand_name,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": display_name,
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "title": title,
                                    "snippet": snippet,
                                    "twitter_url": url,
                                },
                            })
    except Exception as e:
        print(f"[WARN] Twitter DDG search error: {e}")

    # 2. Try Nitter instances if DDG search returned no results
    if not results:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, verify=False) as client:
            for instance in NITTER_INSTANCES:
                try:
                    response = await client.get(
                        f"{instance}/search",
                        params={"f": "users", "q": brand_name},
                        headers=HEADERS,
                    )

                    if response.status_code != 200:
                        continue

                    soup = BeautifulSoup(response.text, "lxml")
                    user_cards = soup.select(".timeline-item") or soup.select(".user-card")

                    for card in user_cards[:15]:
                        try:
                            profile = _parse_nitter_card(card, instance)
                            if profile:
                                results.append(profile)
                        except Exception:
                            continue

                    if results:
                        break
                except Exception:
                    continue

    return results


def _parse_nitter_card(card, instance: str) -> dict:
    handle_el = card.select_one(".username") or card.select_one("a[href*='/']")
    if not handle_el:
        return None

    username = handle_el.get_text(strip=True).lstrip("@")
    if not username:
        return None

    name_el = card.select_one(".fullname") or card.select_one(".display-name")
    display_name = name_el.get_text(strip=True) if name_el else username

    bio_el = card.select_one(".tweet-content") or card.select_one(".bio")
    bio = bio_el.get_text(strip=True) if bio_el else ""

    avatar_el = card.select_one("img.avatar") or card.select_one("img")
    avatar_url = ""
    if avatar_el:
        src = avatar_el.get("src", "")
        if src.startswith("/"):
            avatar_url = f"{instance}{src}"
        else:
            avatar_url = src

    return {
        "platform": "twitter",
        "item_name": f"@{username}",
        "item_url": f"https://twitter.com/{username}",
        "item_icon_url": avatar_url,
        "item_developer": display_name,
        "item_description": bio,
        "raw_data": {
            "username": username,
            "display_name": display_name,
            "bio": bio,
        },
    }


def _clean_ddg_url(raw_url: str) -> str:
    if "uddg=" in raw_url:
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "uddg" in parsed:
            return parsed["uddg"][0]
    return raw_url
