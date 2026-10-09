"""Test the full pipeline: scrape + AI analysis."""
import asyncio
import os
import json

# Set env vars
os.environ["OLLAMA_API_KEY"] = "2f7852bb1a3e4ecd9e03b243629276ec.So1RWV6RXEh1wmF3lvSZg5Zz"
os.environ["OLLAMA_BASE_URL"] = "https://openrouter.ai/api/v1"

async def test():
    # Brand profile
    brand = {
        "brand_name": "Nike",
        "developer_name": "Nike, Inc.",
        "website_url": "https://www.nike.com",
        "twitter_handle": "@Nike",
        "instagram_handle": "@nike",
        "youtube_channel": "youtube.com/@nike",
        "facebook_page": "facebook.com/nike",
        "play_store_link": "https://play.google.com/store/apps/details?id=com.nike.omega",
        "app_store_link": "https://apps.apple.com/us/app/nike/id1095459556",
    }

    # 1. Get real scraped data from Apple Store
    from scrapers.apple_store import scrape_apple_store
    print("Scraping Apple Store...")
    apps = await scrape_apple_store("Nike")
    print(f"Found {len(apps)} apps\n")

    # 2. Test AI analysis on first 3 results
    from ai.detector import analyze_threat
    for app in apps[:3]:
        print(f"Analyzing: {app['item_name']} by {app['item_developer']}")
        verdict = await analyze_threat(brand, app)
        print(f"  Threat Level: {verdict['threat_level']}")
        print(f"  Confidence:   {verdict['confidence_score']}%")
        print(f"  Reason:       {verdict['reason']}")
        print(f"  Lookalike:    {verdict['lookalike_detected']}")
        print(f"  Action:       {verdict['recommended_action']}")
        print()

    # 3. Test with a fake impersonator
    print("=== Testing with FAKE impersonator ===")
    fake_app = {
        "platform": "google_play",
        "item_name": "Nik3 Sports Runner",
        "item_url": "https://play.google.com/store/apps/details?id=com.nik3.runner",
        "item_developer": "Nik3 Inc.",
        "item_description": "Get free Nike shoes! Download now for exclusive deals. Visit bit.ly/nikefree",
    }
    verdict = await analyze_threat(brand, fake_app)
    print(f"  Threat Level: {verdict['threat_level']}")
    print(f"  Confidence:   {verdict['confidence_score']}%")
    print(f"  Reason:       {verdict['reason']}")
    print(f"  Lookalike:    {verdict['lookalike_detected']}")
    print(f"  Action:       {verdict['recommended_action']}")

asyncio.run(test())
