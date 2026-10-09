"""
AI Threat Detector
Dual provider: Ollama (via OpenRouter) primary + Google Gemini fallback.
Uses OpenAI-compatible chat completion endpoints.
"""

import httpx
import json
import os
from ai.prompts import SYSTEM_PROMPT, VISION_PROMPT
from utils.lookalike import detect_lookalike

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://openrouter.ai/api/v1")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# OpenRouter model choices
OPENROUTER_MODEL = "meta-llama/llama-3.2-3b-instruct:free"
OPENROUTER_VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free"

# Gemini model
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"


async def analyze_threat(brand_data: dict, scraped_item: dict) -> dict:
    """
    Analyze a scraped item against the brand profile using AI.
    Primary: Ollama via OpenRouter
    Fallback: Google Gemini API
    Also runs local look-alike detection.
    """
    # 1. Run local look-alike detection first (instant, no API call)
    lookalike_result = _run_lookalike_check(brand_data, scraped_item)

    # 2. Try AI analysis
    ai_verdict = None

    # Try OpenRouter (Ollama cloud) first
    if OLLAMA_API_KEY:
        ai_verdict = await _analyze_with_openrouter(brand_data, scraped_item)

    # Fallback to Gemini if OpenRouter failed
    if not ai_verdict and GEMINI_API_KEY:
        ai_verdict = await _analyze_with_gemini(brand_data, scraped_item)

    # 3. Merge AI verdict with look-alike detection
    if ai_verdict:
        # Enhance AI verdict with look-alike results
        if lookalike_result["is_lookalike"] and not ai_verdict.get("lookalike_detected"):
            ai_verdict["lookalike_detected"] = True
            tricks = lookalike_result.get("tricks_detected", [])
            if tricks:
                trick_details = "; ".join([t["detail"] for t in tricks])
                ai_verdict["reason"] = f"{ai_verdict.get('reason', '')} [Look-alike detected: {trick_details}]"

        return ai_verdict

    # 4. If no AI available, use local analysis only
    return _local_analysis(brand_data, scraped_item, lookalike_result)


def _run_lookalike_check(brand_data: dict, scraped_item: dict) -> dict:
    """Run local look-alike name detection."""
    brand_name = brand_data.get("brand_name", "")
    item_name = scraped_item.get("item_name", "")
    item_developer = scraped_item.get("item_developer", "")

    # Check both name and developer
    name_check = detect_lookalike(brand_name, item_name)
    dev_check = detect_lookalike(
        brand_data.get("developer_name", brand_name),
        item_developer
    ) if item_developer else {"is_lookalike": False, "tricks_detected": [], "similarity_score": 0}

    # Merge results
    is_lookalike = name_check["is_lookalike"] or dev_check["is_lookalike"]
    all_tricks = name_check.get("tricks_detected", []) + dev_check.get("tricks_detected", [])
    max_similarity = max(name_check["similarity_score"], dev_check["similarity_score"])

    return {
        "is_lookalike": is_lookalike,
        "similarity_score": max_similarity,
        "tricks_detected": all_tricks,
    }


async def _analyze_with_openrouter(brand_data: dict, scraped_item: dict) -> dict:
    """Analyze using Ollama via OpenRouter (OpenAI-compatible endpoint)."""
    try:
        user_message = _build_user_message(brand_data, scraped_item)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OLLAMA_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://defence-in-depth.app",
                    "X-Title": "Defence in Depth",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                },
            )

            if response.status_code != 200:
                print(f"[WARN] OpenRouter returned status {response.status_code}: {response.text[:200]}")
                return None

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            return _parse_ai_response(content)

    except Exception as e:
        print(f"[WARN] OpenRouter analysis error: {e}")
        return None


async def _analyze_with_gemini(brand_data: dict, scraped_item: dict) -> dict:
    """Analyze using Google Gemini API."""
    try:
        user_message = _build_user_message(brand_data, scraped_item)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{SYSTEM_PROMPT}\n\n{user_message}"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "responseMimeType": "application/json",
                    },
                },
            )

            if response.status_code != 200:
                print(f"[WARN] Gemini returned status {response.status_code}")
                return None

            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"]

            return _parse_ai_response(content)

    except Exception as e:
        print(f"[WARN] Gemini analysis error: {e}")
        return None


def _build_user_message(brand_data: dict, scraped_item: dict) -> str:
    """Build the user message for AI analysis."""
    return f"""
OFFICIAL BRAND PROFILE (Ground Truth):
- Brand Name: {brand_data.get('brand_name', 'N/A')}
- Official Developer: {brand_data.get('developer_name', 'N/A')}
- Official Website: {brand_data.get('website_url', 'N/A')}
- Twitter: {brand_data.get('twitter_handle', 'N/A')}
- Instagram: {brand_data.get('instagram_handle', 'N/A')}
- YouTube: {brand_data.get('youtube_channel', 'N/A')}
- Facebook: {brand_data.get('facebook_page', 'N/A')}
- LinkedIn: {brand_data.get('linkedin_page', 'N/A')}
- Play Store: {brand_data.get('play_store_link', 'N/A')}
- App Store: {brand_data.get('app_store_link', 'N/A')}

SCRAPED ITEM (Suspect):
- Platform: {scraped_item.get('platform', 'N/A')}
- Name: {scraped_item.get('item_name', 'N/A')}
- URL: {scraped_item.get('item_url', 'N/A')}
- Developer/Publisher: {scraped_item.get('item_developer', 'N/A')}
- Description: {(scraped_item.get('item_description', '') or '')[:500]}

Analyze this scraped item against the brand profile. Return your verdict as JSON.
"""


def _parse_ai_response(content: str) -> dict:
    """Parse the AI response into a structured verdict."""
    try:
        # Try to parse as JSON directly
        verdict = json.loads(content)
    except json.JSONDecodeError:
        # Try to extract JSON from the response text
        try:
            start = content.index("{")
            end = content.rindex("}") + 1
            verdict = json.loads(content[start:end])
        except (ValueError, json.JSONDecodeError):
            return None

    # Normalize the verdict fields
    return {
        "threat_level": verdict.get("threat_level", "UNKNOWN").upper(),
        "confidence_score": min(100, max(0, int(verdict.get("confidence_score", 0)))),
        "reason": verdict.get("reason", ""),
        "lookalike_detected": bool(verdict.get("lookalike_detected", False)),
        "recommended_action": verdict.get("recommended_action", "REVIEW").upper(),
    }


def _local_analysis(brand_data: dict, scraped_item: dict, lookalike_result: dict) -> dict:
    """
    Fallback local analysis when no AI provider is available.
    Uses heuristic rules instead of AI.
    """
    brand_name = brand_data.get("brand_name", "").lower()
    developer_name = brand_data.get("developer_name", "").lower()
    item_name = (scraped_item.get("item_name", "") or "").lower()
    item_developer = (scraped_item.get("item_developer", "") or "").lower()
    item_description = (scraped_item.get("item_description", "") or "").lower()
    platform = scraped_item.get("platform", "")

    threat_level = "SAFE"
    confidence = 50
    evidence = []
    safe_reasons = []

    # Rule 1: Developer name mismatch
    if developer_name and item_developer:
        if item_developer != developer_name and brand_name in item_name:
            threat_level = "HIGH_RISK"
            confidence = 85
            evidence.append(
                f"The publisher '{scraped_item.get('item_developer', '')}' does not match the official "
                f"developer '{brand_data.get('developer_name', '')}', yet the listing uses the brand name '{brand_data.get('brand_name', '')}'. "
                "This is a strong indicator of impersonation."
            )
        elif item_developer == developer_name:
            safe_reasons.append(f"Publisher matches the official developer '{brand_data.get('developer_name', '')}'")

    # Rule 2: Look-alike detected
    if lookalike_result["is_lookalike"]:
        score = lookalike_result["similarity_score"]
        threat_level = "HIGH_RISK" if score > 70 else "MEDIUM"
        confidence = max(confidence, score)
        tricks = lookalike_result.get("tricks_detected", [])
        if tricks:
            trick_details = "; ".join([t["detail"] for t in tricks])
            evidence.append(
                f"Look-alike name tricks detected (similarity score: {score:.0f}/100): {trick_details}. "
                "This pattern is commonly used by impersonators to deceive users."
            )
        else:
            evidence.append(
                f"The name '{scraped_item.get('item_name', '')}' closely resembles the official brand "
                f"'{brand_data.get('brand_name', '')}' (similarity: {score:.0f}/100)."
            )

    # Rule 3: Suspicious keywords
    suspicious_keywords = [
        "free", "giveaway", "win", "prize", "official support",
        "customer service", "discount", "sale", "crypto", "airdrop",
        "hack", "mod", "unlimited", "cheat",
    ]
    found_keywords = [kw for kw in suspicious_keywords if kw in item_name or kw in item_description]
    if found_keywords and brand_name in item_name:
        if threat_level == "SAFE":
            threat_level = "MEDIUM"
        confidence = max(confidence, 65)
        evidence.append(
            f"The listing contains suspicious promotional keywords: {', '.join(f'\"{kw}\"' for kw in found_keywords)}. "
            "Legitimate brand listings do not typically use such terms, suggesting this may be a scam or phishing attempt."
        )

    # Rule 4: Suspicious shortened links
    suspicious_link_patterns = ["bit.ly", "tinyurl", "t.co", "goo.gl", "shorturl", "ow.ly"]
    found_links = [p for p in suspicious_link_patterns if p in item_description]
    if found_links:
        threat_level = "HIGH_RISK"
        confidence = max(confidence, 80)
        evidence.append(
            f"The description contains suspicious shortened URLs: {', '.join(found_links)}. "
            "These are commonly used to hide malicious redirect destinations."
        )

    # Rule 5: Dark web platform — always at least medium risk
    if platform == "dark_web" and threat_level == "SAFE":
        threat_level = "MEDIUM"
        confidence = max(confidence, 60)
        evidence.append(
            f"This item was found on the dark web, which warrants monitoring regardless of its content. "
            "Dark web mentions of a brand can indicate data leaks, credential dumps, or planned fraud."
        )

    # Safe verdict — provide explanation
    if threat_level == "SAFE":
        if safe_reasons:
            reason = f"No impersonation indicators detected. {'; '.join(safe_reasons)}. This listing appears to be an official or legitimate asset."
        else:
            reason = (
                f"Heuristic analysis found no impersonation signals for this listing on {platform.replace('_', ' ')}. "
                f"No developer mismatch, look-alike patterns, suspicious keywords, or malicious links were detected. "
                "This item appears safe, but a full AI scan is recommended for confirmation."
            )
    else:
        reason = " ".join(evidence) if evidence else f"Flagged as {threat_level} based on platform and name analysis."

    # Determine action
    action = "IGNORE" if threat_level == "SAFE" else "REVIEW" if threat_level == "MEDIUM" else "TAKEDOWN_REQUEST"

    return {
        "threat_level": threat_level,
        "confidence_score": confidence,
        "reason": reason,
        "lookalike_detected": lookalike_result["is_lookalike"],
        "recommended_action": action,
    }

