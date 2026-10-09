import asyncio
import json

async def test_single_scraper(mod_name, func_name, brand_name):
    try:
        mod = __import__(f"scrapers.{mod_name}", fromlist=[func_name])
        func = getattr(mod, func_name)
        res = await asyncio.wait_for(func(brand_name), timeout=8.0)
        count = len(res) if isinstance(res, list) else 0
        sample = res[0] if count > 0 else None
        return {
            "status": "WORKING" if count > 0 else "NO_RESULTS",
            "count": count,
            "sample_title": sample.get("item_name") if sample else None,
            "error": None
        }
    except asyncio.TimeoutError:
        return {
            "status": "TIMEOUT",
            "count": 0,
            "sample_title": None,
            "error": "Request timed out after 8s"
        }
    except Exception as e:
        return {
            "status": "FAILED",
            "count": 0,
            "sample_title": None,
            "error": f"{type(e).__name__}: {str(e)}"
        }

scraper_list = [
    ("Apple Store", "apple_store", "scrape_apple_store"),
    ("Google Play", "google_play", "scrape_google_play"),
    ("YouTube", "youtube", "scrape_youtube"),
    ("Twitter", "twitter", "scrape_twitter"),
    ("Instagram", "instagram", "scrape_instagram"),
    ("Facebook", "facebook", "scrape_facebook"),
    ("LinkedIn", "linkedin", "scrape_linkedin"),
    ("Google Search", "google_search", "scrape_google_search"),
    ("Dark Web", "dark_web", "scrape_dark_web"),
]

async def main():
    results = {}
    print("=== TESTING ALL 9 SCRAPERS WITH 8s TIMEOUT ===")
    for display_name, mod_name, func_name in scraper_list:
        print(f"Testing {display_name}...")
        res = await test_single_scraper(mod_name, func_name, "Nike")
        results[display_name] = res
        print(f"  Result: {res['status']} | Count: {res['count']} | Error: {res['error']}")
    
    with open("scraper_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("RESULTS_SAVED_SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(main())
