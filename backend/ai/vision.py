"""
Vision AI Module
Logo comparison using Gemini Vision or Ollama LLaVA via OpenRouter.
"""

import httpx
import base64
import json
import os
from ai.prompts import VISION_PROMPT

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://openrouter.ai/api/v1")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free"
GEMINI_VISION_MODEL = "gemini-2.0-flash"


async def compare_logos(official_logo_path: str, scraped_icon_url: str) -> dict:
    """
    Compare official brand logo with a scraped icon using vision AI.
    """
    try:
        # Load official logo
        logo_base64 = None
        if official_logo_path and os.path.exists(official_logo_path.lstrip("/")):
            with open(official_logo_path.lstrip("/"), "rb") as f:
                logo_base64 = base64.b64encode(f.read()).decode("utf-8")

        # Download scraped icon
        icon_base64 = None
        if scraped_icon_url:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(scraped_icon_url)
                if response.status_code == 200:
                    icon_base64 = base64.b64encode(response.content).decode("utf-8")

        if not logo_base64 or not icon_base64:
            return {
                "threat_level": "UNKNOWN",
                "confidence_score": 0,
                "reason": "Could not load one or both images for comparison",
            }

        # Try OpenRouter vision model
        if OLLAMA_API_KEY:
            result = await _compare_with_openrouter(logo_base64, icon_base64)
            if result:
                return result

        # Try Gemini vision
        if GEMINI_API_KEY:
            result = await _compare_with_gemini(logo_base64, icon_base64)
            if result:
                return result

        return {
            "threat_level": "UNKNOWN",
            "confidence_score": 0,
            "reason": "No vision AI provider available",
        }

    except Exception as e:
        print(f"[WARN] Logo comparison error: {e}")
        return {
            "threat_level": "UNKNOWN",
            "confidence_score": 0,
            "reason": f"Logo comparison failed: {str(e)}",
        }


async def _compare_with_openrouter(logo_b64: str, icon_b64: str) -> dict:
    """Compare logos using OpenRouter vision model."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OLLAMA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": VISION_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": VISION_PROMPT},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{logo_b64}"},
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{icon_b64}"},
                                },
                            ],
                        }
                    ],
                    "temperature": 0.1,
                },
            )

            if response.status_code != 200:
                return None

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            try:
                verdict = json.loads(content)
            except json.JSONDecodeError:
                start = content.index("{")
                end = content.rindex("}") + 1
                verdict = json.loads(content[start:end])

            return {
                "threat_level": verdict.get("threat_level", "UNKNOWN"),
                "confidence_score": verdict.get("confidence_score", 0),
                "reason": verdict.get("reason", ""),
            }

    except Exception:
        return None


async def _compare_with_gemini(logo_b64: str, icon_b64: str) -> dict:
    """Compare logos using Gemini Vision."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_VISION_MODEL}:generateContent?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": VISION_PROMPT},
                                {
                                    "inline_data": {
                                        "mime_type": "image/png",
                                        "data": logo_b64,
                                    }
                                },
                                {
                                    "inline_data": {
                                        "mime_type": "image/png",
                                        "data": icon_b64,
                                    }
                                },
                            ]
                        }
                    ],
                    "generationConfig": {"temperature": 0.1},
                },
            )

            if response.status_code != 200:
                return None

            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"]

            try:
                verdict = json.loads(content)
            except json.JSONDecodeError:
                start = content.index("{")
                end = content.rindex("}") + 1
                verdict = json.loads(content[start:end])

            return {
                "threat_level": verdict.get("threat_level", "UNKNOWN"),
                "confidence_score": verdict.get("confidence_score", 0),
                "reason": verdict.get("reason", ""),
            }

    except Exception:
        return None
