"""
Brand Profile API Routes
CRUD operations for managing the brand's official identity.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, field_validator
from typing import Optional
from database import get_db, row_to_dict, rows_to_list
import os
import shutil
from datetime import datetime

router = APIRouter()


# ─── Pydantic Models ──────────────────────────────────────────

class BrandProfileCreate(BaseModel):
    brand_name: str
    developer_name: Optional[str] = None
    website_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    facebook_page: Optional[str] = None
    linkedin_page: Optional[str] = None
    play_store_link: Optional[str] = None
    app_store_link: Optional[str] = None

    @field_validator("brand_name")
    @classmethod
    def brand_name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Brand name cannot be empty")
        return v.strip()

    @field_validator("twitter_handle", "instagram_handle")
    @classmethod
    def validate_handle(cls, v):
        if v and not v.startswith("@"):
            return f"@{v}"
        return v

    @field_validator("website_url", "play_store_link", "app_store_link")
    @classmethod
    def validate_url(cls, v):
        if v and not v.startswith(("http://", "https://")):
            return f"https://{v}"
        return v


class BrandProfileUpdate(BrandProfileCreate):
    brand_name: Optional[str] = None


# ─── Routes ───────────────────────────────────────────────────

@router.get("/")
async def list_brands():
    """List all brand profiles."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM brand_profiles ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return {"brands": await rows_to_list(rows)}
    finally:
        await db.close()


@router.get("/{brand_id}")
async def get_brand(brand_id: int):
    """Get a specific brand profile."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Brand profile not found")
        return {"brand": await row_to_dict(row)}
    finally:
        await db.close()


@router.post("/")
async def create_brand(profile: BrandProfileCreate):
    """Create a new brand profile."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO brand_profiles 
            (brand_name, developer_name, website_url, twitter_handle, instagram_handle,
             youtube_channel, facebook_page, linkedin_page, play_store_link, app_store_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                profile.brand_name, profile.developer_name, profile.website_url,
                profile.twitter_handle, profile.instagram_handle, profile.youtube_channel,
                profile.facebook_page, profile.linkedin_page, profile.play_store_link,
                profile.app_store_link,
            ),
        )
        await db.commit()
        brand_id = cursor.lastrowid

        # Fetch the created record
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        row = await cursor.fetchone()
        return {"brand": await row_to_dict(row), "message": "Brand profile created successfully"}
    finally:
        await db.close()


@router.put("/{brand_id}")
async def update_brand(brand_id: int, profile: BrandProfileUpdate):
    """Update an existing brand profile."""
    db = await get_db()
    try:
        # Check if profile exists
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Brand profile not found")

        # Build update query dynamically (only update provided fields)
        updates = {}
        data = profile.model_dump(exclude_unset=True)
        for key, value in data.items():
            if value is not None:
                updates[key] = value

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates["updated_at"] = datetime.now().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [brand_id]

        await db.execute(
            f"UPDATE brand_profiles SET {set_clause} WHERE id = ?",
            values,
        )
        await db.commit()

        # Fetch updated record
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        row = await cursor.fetchone()
        return {"brand": await row_to_dict(row), "message": "Brand profile updated successfully"}
    finally:
        await db.close()


@router.delete("/{brand_id}")
async def delete_brand(brand_id: int):
    """Delete a brand profile."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Brand profile not found")

        await db.execute("DELETE FROM brand_profiles WHERE id = ?", (brand_id,))
        await db.commit()
        return {"message": "Brand profile deleted successfully"}
    finally:
        await db.close()


@router.post("/{brand_id}/logo")
async def upload_logo(brand_id: int, logo: UploadFile = File(...)):
    """Upload a brand logo image."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM brand_profiles WHERE id = ?", (brand_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Brand profile not found")

        # Validate file type
        allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
        if logo.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_types}")

        # Save file
        ext = logo.filename.split(".")[-1] if "." in logo.filename else "png"
        filename = f"brand_{brand_id}_logo.{ext}"
        filepath = os.path.join("uploads", filename)

        with open(filepath, "wb") as f:
            shutil.copyfileobj(logo.file, f)

        # Update database
        await db.execute(
            "UPDATE brand_profiles SET logo_path = ?, updated_at = ? WHERE id = ?",
            (f"/uploads/{filename}", datetime.now().isoformat(), brand_id),
        )
        await db.commit()

        return {"message": "Logo uploaded successfully", "logo_path": f"/uploads/{filename}"}
    finally:
        await db.close()
