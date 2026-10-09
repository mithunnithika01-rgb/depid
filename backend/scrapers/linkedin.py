"""
LinkedIn Scraper
Uses DuckDuckGo and Google search (site:linkedin.com/company) to find LinkedIn company pages.
"""

import httpx
from bs4 import BeautifulSoup
import urllib.parse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


async def scrape_linkedin(brand_name: str) -> list:
    """
    Search for LinkedIn company pages matching the brand name.
    Uses DuckDuckGo and Google search with site:linkedin.com/company.
    """
    results = []

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, verify=False) as client:
        query = f'site:linkedin.com/company "{brand_name}"'

        # 1. Try DuckDuckGo HTML
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

                        if url and "linkedin.com/company" in url:
                            company_name = title.replace(" | LinkedIn", "").replace(" - LinkedIn", "").strip()
                            results.append({
                                "platform": "linkedin",
                                "item_name": company_name,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": company_name,
                                "item_description": snippet,
                                "raw_data": {
                                    "title": title,
                                    "snippet": snippet,
                                    "linkedin_url": url,
                                },
                            })
        except Exception as e:
            print(f"[WARN] LinkedIn DDG search error: {e}")

        # 2. Try Google Search fallback if DDG returned no results
        if not results:
            try:
                response = await client.get(
                    "https://www.google.com/search",
                    params={"q": query, "num": 10},
                    headers=HEADERS,
                )

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    for result in soup.select("div.g, div[data-sokoban-container]"):
                        try:
                            link_el = result.select_one("a[href*='linkedin.com/company']")
                            if not link_el:
                                continue

                            url = link_el.get("href", "")
                            if not url or "linkedin.com/company" not in url:
                                continue

                            title_el = result.select_one("h3")
                            title = title_el.get_text(strip=True) if title_el else ""

                            snippet_el = result.select_one("div.VwiC3b, span.aCOpRe")
                            snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                            company_name = title.replace(" | LinkedIn", "").replace(" - LinkedIn", "").strip()

                            results.append({
                                "platform": "linkedin",
                                "item_name": company_name,
                                "item_url": url,
                                "item_icon_url": "",
                                "item_developer": company_name,
                                "item_description": snippet,
                                "raw_data": {
                                    "title": title,
                                    "snippet": snippet,
                                    "linkedin_url": url,
                                },
                            })
                        except Exception:
                            continue
            except Exception as e:
                print(f"[WARN] LinkedIn Google search error: {e}")

    return results


def _clean_ddg_url(raw_url: str) -> str:
    """Extract destination URL from DuckDuckGo redirect link."""
    if "uddg=" in raw_url:
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "uddg" in parsed:
            return parsed["uddg"][0]
    return raw_url
