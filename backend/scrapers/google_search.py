"""
Web Search & Crawler Engine
Universal search scraper powered by Bing & DuckDuckGo with SSL verify=False.
Crawls web mentions, app store profiles, social media handles, and dark web leaks.
"""

import httpx
from bs4 import BeautifulSoup
import urllib.parse
import base64

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def _clean_bing_url(url_str: str) -> str:
    """Decode Bing redirect URLs (base64 parameter 'u')."""
    try:
        if "bing.com/ck/a" in url_str and "&u=" in url_str:
            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url_str).query)
            u_val = parsed.get("u", [""])[0]
            if u_val.startswith("a1"):
                b64 = u_val[2:] + "=" * (-len(u_val[2:]) % 4)
                return base64.b64decode(b64).decode("utf-8", errors="ignore")
    except Exception:
        pass
    return url_str


async def scrape_google_search(brand_name: str) -> list:
    """Search for brand mentions across web engines."""
    return await scrape_google_search_for_platform(brand_name, "google_search")


async def scrape_google_search_for_platform(brand_name: str, target_platform: str) -> list:
    """
    Web search & crawler for any platform (twitter, instagram, facebook, linkedin, youtube, apple_store, dark_web, etc.).
    """
    site_query = {
        "twitter": f'"{brand_name}" (site:twitter.com OR site:x.com OR "Twitter" OR "X.com")',
        "instagram": f'"{brand_name}" (site:instagram.com OR "Instagram")',
        "facebook": f'"{brand_name}" (site:facebook.com OR "Facebook")',
        "linkedin": f'"{brand_name}" (site:linkedin.com/company OR site:linkedin.com OR "LinkedIn")',
        "youtube": f'"{brand_name}" (site:youtube.com OR "YouTube")',
        "google_play": f'"{brand_name}" (site:play.google.com OR "Play Store")',
        "apple_store": f'"{brand_name}" (site:apps.apple.com OR "App Store")',
        "dark_web": f'"{brand_name}" ("dark web" OR "pastebin" OR "leak" OR "credential dump" OR "breach")',
    }.get(target_platform, f'"{brand_name}" official')

    results = []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False, headers=HEADERS) as client:
            response = await client.get("https://www.bing.com/search", params={"q": site_query})

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "lxml")
                for item in soup.select("li.b_algo"):
                    title_el = item.select_one("h2 a")
                    snippet_el = item.select_one(".b_caption p, .b_algoSlug")
                    if title_el:
                        title = title_el.get_text(strip=True)
                        raw_url = title_el.get("href", "")
                        url = _clean_bing_url(raw_url)
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                        if url and url.startswith("http"):
                            dev_name = title.split("-")[0].split("|")[0].strip()
                            results.append({
                                "platform": target_platform,
                                "item_name": title,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": dev_name or brand_name,
                                "item_description": snippet[:300],
                                "raw_data": {
                                    "source": "bing_crawler",
                                    "target_platform": target_platform,
                                    "title": title,
                                    "snippet": snippet,
                                },
                            })
    except Exception as e:
        print(f"[WARN] Web crawler error for {target_platform}: {e}")

    return results
