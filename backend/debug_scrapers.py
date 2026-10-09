import asyncio
import httpx
import urllib.request
import json
import ssl

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

def test_urllib_apple():
    print("--- URLLIB APPLE STORE ---")
    url = "https://itunes.apple.com/search?term=Nike&entity=software&limit=5"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Urllib Apple Status: 200, count:", data.get("resultCount"))
            for item in data.get("results", [])[:3]:
                print("  -", item.get("trackName"), "by", item.get("sellerName"))
    except Exception as e:
        print("Urllib Apple Error:", e)

def test_urllib_ddg():
    print("--- URLLIB DDG ---")
    url = "https://html.duckduckgo.com/html/?q=Nike"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=10) as resp:
            html = resp.read().decode('utf-8')
            print("Urllib DDG Status: 200, html length:", len(html))
    except Exception as e:
        print("Urllib DDG Error:", e)

async def test_httpx_apple():
    print("--- HTTPX APPLE STORE ---")
    async with httpx.AsyncClient(verify=False, headers=HEADERS) as client:
        r = await client.get("https://itunes.apple.com/search?term=Nike&entity=software&limit=5")
        print("httpx Apple status:", r.status_code)

if __name__ == "__main__":
    test_urllib_apple()
    test_urllib_ddg()
    asyncio.run(test_httpx_apple())
