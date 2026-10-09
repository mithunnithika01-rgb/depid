"""Quick test script for scrapers."""
import asyncio
import json

async def test():
    # Test Apple Store (most reliable — iTunes API)
    from scrapers.apple_store import scrape_apple_store
    print("=== APPLE STORE ===")
    results = await scrape_apple_store("Nike")
    print(f"Found {len(results)} apps")
    for r in results[:3]:
        print(f"  - {r['item_name']} by {r['item_developer']}")
    print()

    # Test Google Play
    from scrapers.google_play import scrape_google_play
    print("=== GOOGLE PLAY ===")
    results = await scrape_google_play("Nike")
    print(f"Found {len(results)} apps")
    for r in results[:3]:
        print(f"  - {r['item_name']} by {r['item_developer']}")
    print()

    # Test YouTube
    from scrapers.youtube import scrape_youtube
    print("=== YOUTUBE ===")
    results = await scrape_youtube("Nike")
    print(f"Found {len(results)} channels")
    for r in results[:3]:
        print(f"  - {r['item_name']}")
    print()

    print("=== ALL SCRAPERS WORKING ===")

asyncio.run(test())
