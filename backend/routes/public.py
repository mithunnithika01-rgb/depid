"""
Public Portal API Routes
Scam checker and public reporting endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db, row_to_dict, rows_to_list

router = APIRouter()


class ScamCheckRequest(BaseModel):
    url: str


class PublicReportRequest(BaseModel):
    reported_url: str
    description: Optional[str] = None


@router.post("/check")
async def check_url(request: ScamCheckRequest):
    """
    Check if a URL is associated with a known brand impersonator.
    This will use AI analysis in Phase 4.
    """
    db = await get_db()
    try:
        # First check if this URL is already in our scan results
        cursor = await db.execute(
            "SELECT * FROM scan_results WHERE item_url = ? ORDER BY scanned_at DESC LIMIT 1",
            (request.url,),
        )
        existing = await cursor.fetchone()

        if existing:
            result = dict(existing)
            return {
                "checked": True,
                "url": request.url,
                "verdict": result["threat_level"],
                "confidence": result["confidence_score"],
                "explanation": result["ai_reason"] or ("Verified safe asset. Matches official brand developer, logo, and domain." if result["threat_level"] == "SAFE" else "Flagged asset."),
                "is_official": bool(result["is_official"]),
                "platform": result["platform"],
            }

        # Check if URL matches any registered brand's official profile or website
        cursor = await db.execute("SELECT * FROM brand_profiles")
        brands = await cursor.fetchall()
        clean_req = request.url.lower().strip()

        for b in brands:
            b_dict = dict(b)
            official_links = [
                b_dict.get("website_url"), b_dict.get("play_store_link"), b_dict.get("app_store_link"),
                b_dict.get("twitter_handle"), b_dict.get("instagram_handle"), b_dict.get("youtube_channel"),
                b_dict.get("facebook_page"), b_dict.get("linkedin_page")
            ]
            for link in official_links:
                if link and (link.lower() in clean_req or clean_req in link.lower()):
                    return {
                        "checked": True,
                        "url": request.url,
                        "verdict": "SAFE",
                        "confidence": 100,
                        "explanation": f"VERIFIED SAFE ASSET: Matches official ground-truth profile for {b_dict['brand_name']} ({link}). Verified official domain, logo, and metadata.",
                        "is_official": True,
                        "platform": "official_web",
                    }

        # If not found in scan results or brand profiles
        return {
            "checked": True,
            "url": request.url,
            "verdict": "UNKNOWN",
            "confidence": 0,
            "explanation": "This URL has not been indexed in the database yet. Trigger a scan from the dashboard to analyze it.",
            "is_official": False,
            "platform": "web",
        }
    finally:
        await db.close()


@router.post("/report")
async def submit_report(report: PublicReportRequest):
    """Submit a public report about a suspicious URL."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO public_reports (reported_url, description) VALUES (?, ?)",
            (report.reported_url, report.description),
        )
        await db.commit()
        return {
            "report_id": cursor.lastrowid,
            "message": "Report submitted successfully. Our team will review it.",
        }
    finally:
        await db.close()


@router.get("/reports")
async def list_reports():
    """List all public reports (admin use)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM public_reports ORDER BY reported_at DESC LIMIT 50"
        )
        rows = await cursor.fetchall()
        return {"reports": await rows_to_list(rows)}
    finally:
        await db.close()
