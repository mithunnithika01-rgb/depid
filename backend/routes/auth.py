"""
Auth API Routes
User login, signup, roles, and session management stored in SQLite.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import hashlib
from database import get_db, row_to_dict, rows_to_list

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "USER"
    permissions: Optional[str] = "READ,SCAN"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login")
async def login(req: LoginRequest):
    """Log in a user against SQLite users table."""
    db = await get_db()
    try:
        pw_hash = hash_password(req.password)
        cursor = await db.execute(
            "SELECT id, username, email, role, permissions, created_at FROM users WHERE username = ? AND password_hash = ?",
            (req.username, pw_hash),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        user = dict(row)
        return {
            "status": "success",
            "message": "Login successful",
            "user": user,
            "token": f"token_{user['id']}_{user['username']}",
        }
    finally:
        await db.close()


@router.post("/signup")
async def signup(req: SignupRequest):
    """Register a new user into SQLite users table."""
    db = await get_db()
    try:
        # Check if username or email exists
        cursor = await db.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (req.username, req.email),
        )
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already exists")

        pw_hash = hash_password(req.password)
        cursor = await db.execute(
            "INSERT INTO users (username, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)",
            (req.username, req.email, pw_hash, req.role.upper(), req.permissions),
        )
        await db.commit()
        user_id = cursor.lastrowid

        cursor = await db.execute(
            "SELECT id, username, email, role, permissions, created_at FROM users WHERE id = ?",
            (user_id,),
        )
        user = dict(await cursor.fetchone())

        return {
            "status": "success",
            "message": "User registered successfully",
            "user": user,
            "token": f"token_{user['id']}_{user['username']}",
        }
    finally:
        await db.close()


@router.get("/me")
async def get_current_user(username: Optional[str] = "mithun"):
    """Get profile of current user or default user mithun."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, username, email, role, permissions, created_at FROM users WHERE username = ?",
            (username,),
        )
        row = await cursor.fetchone()
        if not row:
            # Fallback to first user
            cursor = await db.execute("SELECT id, username, email, role, permissions, created_at FROM users LIMIT 1")
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="No user found")

        return {"user": dict(row)}
    finally:
        await db.close()


@router.get("/users")
async def list_users():
    """List all registered users from SQLite."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, username, email, role, permissions, created_at FROM users ORDER BY id ASC")
        rows = await cursor.fetchall()
        return {"users": await rows_to_list(rows)}
    finally:
        await db.close()
