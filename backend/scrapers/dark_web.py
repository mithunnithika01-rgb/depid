"""
Dark Web Monitor
Uses Ahmia.fi (Tor hidden service search engine) via their clearnet API.
Also checks paste sites for brand mentions.
"""

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

# Ahmia.fi is a clearnet search engine that indexes .onion sites
AHMIA_SEARCH_URL = "https://ahmia.fi/search/"

# IntelX paste search (free tier)
PASTE_SEARCH_URLS = [
    "https://psbdmp.ws/api/v3/search/{query}",
]


async def scrape_dark_web(brand_name: str) -> list:
    """
    Search dark web sources for brand-related data.
    Uses Ahmia.fi (clearnet Tor search) and paste site monitoring.
    """
    results = []

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, verify=False) as client:
        # 1. Search Ahmia.fi
        ahmia_results = await _search_ahmia(client, brand_name)
        results.extend(ahmia_results)

        # 2. Search paste sites
        paste_results = await _search_pastes(client, brand_name)
        results.extend(paste_results)

    return results


async def _search_ahmia(client: httpx.AsyncClient, query: str) -> list:
    """Search Ahmia.fi for dark web mentions."""
    results = []

    try:
        response = await client.get(
            AHMIA_SEARCH_URL,
            params={"q": query},
            headers=HEADERS,
        )

        if response.status_code != 200:
            return results

        soup = BeautifulSoup(response.text, "lxml")

        # Parse Ahmia search results
        for result in soup.select("li.result, div.result"):
            try:
                title_el = result.select_one("h4 a, .title a, a")
                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                url = title_el.get("href", "")

                desc_el = result.select_one("p, .description, .snippet")
                description = desc_el.get_text(strip=True) if desc_el else ""

                if title or url:
                    results.append({
                        "platform": "dark_web",
                        "item_name": title or "Dark Web Mention",
                        "item_url": url,
                        "item_icon_url": "",
                        "item_developer": "Dark Web Source",
                        "item_description": description[:300],
                        "raw_data": {
                            "source": "ahmia.fi",
                            "title": title,
                            "url": url,
                            "snippet": description,
                        },
                    })
            except Exception:
                continue

    except Exception as e:
        print(f"[WARN] Ahmia search error: {e}")

    return results[:10]  # Limit results


async def _search_pastes(client: httpx.AsyncClient, query: str) -> list:
    """Search paste sites for brand data leaks."""
    results = []

    try:
        # Try psbdmp.ws API (Pastebin dump search)
        response = await client.get(
            f"https://psbdmp.ws/api/v3/search/{query}",
            headers=HEADERS,
        )

        if response.status_code == 200:
            try:
                data = response.json()
                for paste in (data if isinstance(data, list) else data.get("data", []))[:5]:
                    paste_id = paste.get("id", "")
                    results.append({
                        "platform": "dark_web",
                        "item_name": f"Paste: {paste.get('title', paste_id)}",
                        "item_url": f"https://pastebin.com/{paste_id}" if paste_id else "",
                        "item_icon_url": "",
                        "item_developer": "Paste Site",
                        "item_description": paste.get("content", "")[:300] if paste.get("content") else f"Brand mention found in paste {paste_id}",
                        "raw_data": {
                            "source": "psbdmp.ws",
                            "paste_id": paste_id,
                            "tags": paste.get("tags", []),
                        },
                    })
            except Exception:
                pass

    except Exception as e:
        print(f"[WARN] Paste search error: {e}")

    return results
