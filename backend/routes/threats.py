"""
Threats API Routes
Query, filter, and manage threat detection results.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database import get_db, row_to_dict, rows_to_list

router = APIRouter()


@router.get("/")
async def list_threats(
    brand_id: Optional[int] = None,
    platform: Optional[str] = None,
    threat_level: Optional[str] = None,
    scan_type: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    """List threat results with optional filters."""
    db = await get_db()
    try:
        conditions = []
        params = []

        if brand_id:
            conditions.append("brand_id = ?")
            params.append(brand_id)
        if platform:
            conditions.append("platform = ?")
            params.append(platform)
        if threat_level:
            conditions.append("threat_level = ?")
            params.append(threat_level)
        if scan_type:
            conditions.append("scan_type = ?")
            params.append(scan_type)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Get total count
        cursor = await db.execute(
            f"SELECT COUNT(*) as total FROM scan_results {where_clause}", params
        )
        total = (await cursor.fetchone())["total"]

        # Get paginated results
        cursor = await db.execute(
            f"SELECT * FROM scan_results {where_clause} ORDER BY scanned_at DESC LIMIT ? OFFSET ?",
            params + [limit, offset],
        )
        rows = await cursor.fetchall()

        return {
            "threats": await rows_to_list(rows),
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    finally:
        await db.close()


@router.get("/stats")
async def threat_stats(brand_id: Optional[int] = None):
    """Get threat statistics summary."""
    db = await get_db()
    try:
        brand_filter = "WHERE brand_id = ?" if brand_id else ""
        params = [brand_id] if brand_id else []

        # Total threats (excluding SAFE)
        cursor = await db.execute(
            f"SELECT COUNT(*) as total FROM scan_results {brand_filter}",
            params,
        )
        total = (await cursor.fetchone())["total"]

        # Count by threat level
        cursor = await db.execute(
            f"""SELECT threat_level, COUNT(*) as count 
            FROM scan_results {brand_filter} 
            GROUP BY threat_level""",
            params,
        )
        by_level = {row["threat_level"]: row["count"] for row in await cursor.fetchall()}

        # Count by platform
        cursor = await db.execute(
            f"""SELECT platform, COUNT(*) as count 
            FROM scan_results {brand_filter} 
            GROUP BY platform""",
            params,
        )
        by_platform = {row["platform"]: row["count"] for row in await cursor.fetchall()}

        # Count by scan type
        cursor = await db.execute(
            f"""SELECT scan_type, COUNT(*) as count 
            FROM scan_results {brand_filter} 
            GROUP BY scan_type""",
            params,
        )
        by_type = {row["scan_type"]: row["count"] for row in await cursor.fetchall()}

        # Recent high-risk threats
        high_risk_filter = f"WHERE threat_level = 'HIGH_RISK'" + (f" AND brand_id = ?" if brand_id else "")
        cursor = await db.execute(
            f"SELECT * FROM scan_results {high_risk_filter} ORDER BY scanned_at DESC LIMIT 5",
            params,
        )
        recent_high_risk = await rows_to_list(await cursor.fetchall())

        return {
            "total": total,
            "by_level": by_level,
            "by_platform": by_platform,
            "by_type": by_type,
            "recent_high_risk": recent_high_risk,
        }
    finally:
        await db.close()


@router.get("/{threat_id}")
async def get_threat(threat_id: int):
    """Get detailed information about a specific threat."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM scan_results WHERE id = ?", (threat_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Threat not found")
        return {"threat": await row_to_dict(row)}
    finally:
        await db.close()


@router.put("/{threat_id}/action")
async def update_threat_action(threat_id: int, action: str):
    """Update the recommended action for a threat."""
    valid_actions = ["IGNORE", "REVIEW", "TAKEDOWN_REQUEST"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")

    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM scan_results WHERE id = ?", (threat_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Threat not found")

        await db.execute(
            "UPDATE scan_results SET recommended_action = ? WHERE id = ?",
            (action, threat_id),
        )
        await db.commit()
        return {"message": f"Action updated to {action}"}
    finally:
        await db.close()
