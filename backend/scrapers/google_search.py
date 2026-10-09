"""
Google / DuckDuckGo Search Scraper
Universal fallback — searches for brand mentions across all platforms.
Uses DuckDuckGo HTML & Google search with verify=False.
"""

import httpx
from bs4 import BeautifulSoup
import urllib.parse


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


async def scrape_google_search(brand_name: str) -> list:
    """
    Search web engines for brand mentions across all social platforms.
    Universal fallback for any platform that fails.
    """
    results = []

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False) as client:
        query = f'"{brand_name}" (site:twitter.com OR site:instagram.com OR site:facebook.com OR site:youtube.com OR site:linkedin.com)'

        # 1. Try DuckDuckGo HTML search
        try:
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

                        if url and url.startswith("http"):
                            platform = _detect_platform(url)
                            results.append({
                                "platform": platform or "web_search",
                                "item_name": title,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": "",
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "source": "duckduckgo",
                                    "detected_platform": platform,
                                    "title": title,
                                    "snippet": snippet,
                                },
                            })
        except Exception as e:
            print(f"[WARN] DuckDuckGo search error: {e}")

        # 2. Try Google search if DDG produced few results
        if len(results) < 3:
            try:
                response = await client.get(
                    "https://www.google.com/search",
                    params={"q": query, "num": 15},
                    headers=HEADERS,
                )

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    for result in soup.select("div.g, div[data-sokoban-container]"):
                        try:
                            link_el = result.select_one("a")
                            if not link_el:
                                continue

                            url = link_el.get("href", "")
                            if not url or not url.startswith("http"):
                                continue

                            platform = _detect_platform(url)
                            title_el = result.select_one("h3")
                            title = title_el.get_text(strip=True) if title_el else ""

                            snippet_el = result.select_one("div.VwiC3b, span.aCOpRe")
                            snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                            results.append({
                                "platform": platform or "google_search",
                                "item_name": title,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": "",
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "source": "google_search",
                                    "detected_platform": platform,
                                    "title": title,
                                    "snippet": snippet,
                                },
                            })
                        except Exception:
                            continue
            except Exception as e:
                print(f"[WARN] Google search error: {e}")

    return results


async def scrape_google_search_for_platform(brand_name: str, target_platform: str) -> list:
    """
    Search web engines specifically for a given platform as a fallback when direct media scrapers fail.
    """
    site_query = {
        "twitter": '(site:twitter.com OR site:x.com)',
        "instagram": 'site:instagram.com',
        "facebook": 'site:facebook.com',
        "linkedin": 'site:linkedin.com/company',
        "youtube": 'site:youtube.com',
        "google_play": 'site:play.google.com',
        "apple_store": 'site:apps.apple.com',
        "dark_web": '"dark web" OR "pastebin" OR "leak"',
    }.get(target_platform, "")

    query = f'{site_query} "{brand_name}"' if site_query else f'"{brand_name}"'
    results = []

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False) as client:
        try:
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

                        if url and url.startswith("http"):
                            results.append({
                                "platform": target_platform,
                                "item_name": title,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": title,
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "source": "web_crawler_fallback",
                                    "target_platform": target_platform,
                                    "title": title,
                                    "snippet": snippet,
                                },
                            })
        except Exception as e:
            print(f"[WARN] Web crawler fallback error for {target_platform}: {e}")

    return results


def _clean_ddg_url(raw_url: str) -> str:
    """Extract destination URL from DuckDuckGo redirect link."""
    if "uddg=" in raw_url:
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "uddg" in parsed:
            return parsed["uddg"][0]
    return raw_url


def _detect_platform(url: str) -> str:
    """Detect which social platform a URL belongs to."""
    url_lower = url.lower()
    if "twitter.com" in url_lower or "x.com" in url_lower:
        return "twitter"
    elif "instagram.com" in url_lower:
        return "instagram"
    elif "facebook.com" in url_lower:
        return "facebook"
    elif "youtube.com" in url_lower:
        return "youtube"
    elif "linkedin.com" in url_lower:
        return "linkedin"
    elif "play.google.com" in url_lower:
        return "google_play"
    elif "apps.apple.com" in url_lower:
        return "apple_store"
    return ""

