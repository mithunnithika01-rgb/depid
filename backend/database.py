"""
Defence in Depth — Database Module
SQLite database with async support via aiosqlite.
"""

import aiosqlite
import os
import json
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "./did.db")


async def get_db():
    """Get an async database connection optimized for high performance."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA synchronous=NORMAL")
    await db.execute("PRAGMA temp_store=MEMORY")
    await db.execute("PRAGMA cache_size=-64000")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Initialize all database tables."""
    db = await get_db()
    try:
        await db.executescript("""
            -- Users & Roles Table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'ADMIN',
                permissions TEXT DEFAULT 'ALL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Brand Profile (Ground Truth)
            CREATE TABLE IF NOT EXISTS brand_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_name TEXT NOT NULL,
                developer_name TEXT,
                website_url TEXT,
                twitter_handle TEXT,
                instagram_handle TEXT,
                youtube_channel TEXT,
                facebook_page TEXT,
                linkedin_page TEXT,
                play_store_link TEXT,
                app_store_link TEXT,
                logo_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Scan Results
            CREATE TABLE IF NOT EXISTS scan_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER REFERENCES brand_profiles(id) ON DELETE CASCADE,
                scan_job_id INTEGER REFERENCES scan_jobs(id) ON DELETE SET NULL,
                scan_type TEXT NOT NULL,
                platform TEXT NOT NULL,
                item_name TEXT,
                item_url TEXT,
                item_icon_url TEXT,
                item_developer TEXT,
                item_description TEXT,
                threat_level TEXT DEFAULT 'UNKNOWN',
                confidence_score INTEGER DEFAULT 0,
                ai_reason TEXT,
                lookalike_detected BOOLEAN DEFAULT 0,
                recommended_action TEXT DEFAULT 'REVIEW',
                is_official BOOLEAN DEFAULT 0,
                raw_data TEXT,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Scan Jobs (for tracking async scans)
            CREATE TABLE IF NOT EXISTS scan_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER REFERENCES brand_profiles(id) ON DELETE CASCADE,
                status TEXT DEFAULT 'pending',
                platforms_total INTEGER DEFAULT 0,
                platforms_completed INTEGER DEFAULT 0,
                current_platform TEXT,
                results_count INTEGER DEFAULT 0,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                error_message TEXT
            );

            -- Public Reports (from the public scam checker portal)
            CREATE TABLE IF NOT EXISTS public_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reported_url TEXT NOT NULL,
                description TEXT,
                verdict TEXT,
                confidence_score INTEGER,
                ai_explanation TEXT,
                reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for fast lookups
            CREATE INDEX IF NOT EXISTS idx_scan_results_brand ON scan_results(brand_id);
            CREATE INDEX IF NOT EXISTS idx_scan_results_platform ON scan_results(platform);
            CREATE INDEX IF NOT EXISTS idx_scan_results_threat ON scan_results(threat_level);
            CREATE INDEX IF NOT EXISTS idx_scan_jobs_brand ON scan_jobs(brand_id);
            CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
        """)

        # Seed 4 distinct users with different authentication and authorization roles
        import hashlib
        users_to_seed = [
            ("mithun", "mithun@defence.ai", "mithun123", "ADMIN", "ALL,TAKEDOWN,SCAN,MANAGE_USERS,SYSTEM_CONFIG"),
            ("sarah_analyst", "sarah.analyst@defence.ai", "analyst123", "ANALYST", "SCAN,TAKEDOWN_REQUEST,REVIEW_THREATS"),
            ("alex_investigator", "alex.investigator@defence.ai", "investigator123", "INVESTIGATOR", "SCAN,DARKWEB_MONITOR,ITEM_INSPECT"),
            ("david_auditor", "david.auditor@defence.ai", "auditor123", "AUDITOR", "READ_ONLY,VIEW_REPORTS,EXPORT_METRICS"),
        ]

        for uname, uemail, upass, urole, uperms in users_to_seed:
            cursor = await db.execute("SELECT id FROM users WHERE username = ?", (uname,))
            if not await cursor.fetchone():
                pw_hash = hashlib.sha256(upass.encode()).hexdigest()
                await db.execute(
                    "INSERT INTO users (username, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)",
                    (uname, uemail, pw_hash, urole, uperms),
                )
                print(f"[OK] Seeded user '{uname}' ({urole})")

        # Seed default brand profile if not present
        cursor = await db.execute("SELECT COUNT(*) as count FROM brand_profiles")
        row = await cursor.fetchone()
        if row["count"] == 0:
            await db.execute(
                """INSERT INTO brand_profiles (brand_name, developer_name, website_url, twitter_handle, instagram_handle)
                   VALUES (?, ?, ?, ?, ?)""",
                ("Nike", "Nike, Inc.", "https://www.nike.com", "@Nike", "@nike")
            )
            print("[OK] Created default brand profile 'Nike'")

        await db.commit()
        print("[OK] Database initialized successfully")
    finally:
        await db.close()


# ─── Helper Functions ─────────────────────────────────────────

async def row_to_dict(row):
    """Convert an aiosqlite Row to a dictionary."""
    if row is None:
        return None
    return dict(row)


async def rows_to_list(rows):
    """Convert a list of aiosqlite Rows to a list of dicts."""
    return [dict(row) for row in rows]
