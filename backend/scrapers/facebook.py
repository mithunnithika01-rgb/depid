"""
Facebook Scraper
Searches Facebook for brand pages using DuckDuckGo search (site:facebook.com)
and optional facebook_scraper library fallback.
"""

import httpx
from bs4 import BeautifulSoup
import urllib.parse
import asyncio

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


async def scrape_facebook(brand_name: str) -> list:
    """
    Search Facebook for pages matching the brand name.
    """
    results = []

    # 1. Search site:facebook.com via DuckDuckGo (fast, robust, no login required)
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            query = f'site:facebook.com "{brand_name}"'
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

                        if url and "facebook.com" in url and not any(x in url for x in ["/sharer", "/dialog", "/plugins"]):
                            page_name = title.replace(" - Home | Facebook", "").replace(" | Facebook", "").replace(" - Facebook", "").strip()
                            results.append({
                                "platform": "facebook",
                                "item_name": page_name or brand_name,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": page_name,
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "title": title,
                                    "snippet": snippet,
                                    "facebook_url": url,
                                },
                            })
    except Exception as e:
        print(f"[WARN] Facebook DDG search error: {e}")

    # 2. Try facebook_scraper for top 1 handle if DDG yielded nothing
    if not results:
        page_name = brand_name.lower().strip().replace(" ", "")
        try:
            from facebook_scraper import get_page_info
            info = await asyncio.to_thread(_get_page_info_safe, page_name)
            if info:
                results.append(info)
        except Exception:
            pass

    return results


def _get_page_info_safe(page_name: str):
    try:
        from facebook_scraper import get_page_info
        info = get_page_info(page_name)
        if not info:
            return None
        return {
            "platform": "facebook",
            "item_name": info.get("name", page_name),
            "item_url": f"https://www.facebook.com/{page_name}",
            "item_icon_url": info.get("profile_picture", ""),
            "item_developer": info.get("name", ""),
            "item_description": info.get("about", "") or info.get("description", ""),
            "raw_data": {
                "page_name": page_name,
                "likes": info.get("likes"),
                "followers": info.get("followers"),
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
