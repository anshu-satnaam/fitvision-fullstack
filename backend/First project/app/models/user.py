"""
User model — core identity, auth, gamification, profile, and physical stats.
"""

from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field

class User(Document):
    # ── Identity ──────────────────────────────────────────────
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    hashed_password: str

    # ── Gamification ──────────────────────────────────────────
    streak: int = 0
    xp: int = 0
    points: int = 0
    total_reps: int = 0
    level: int = 1
    last_login_date: Optional[datetime] = None

    # ── Appearance / Profile ──────────────────────────────────
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None

    # ── Physical Stats ────────────────────────────────────────
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None

    # ── Fitness Profile ───────────────────────────────────────
    body_type: Optional[str] = None
    diet_goal: Optional[str] = None
    activity_level: Optional[str] = None

    # ── Daily Targets ─────────────────────────────────────────
    daily_sleep_goal: Optional[float] = None
    daily_water_goal: Optional[float] = 2000.0

    # ── Health Info ───────────────────────────────────────────
    injuries: Optional[str] = None
    dietary_preferences: Optional[str] = None

    # ── Auth / 2FA ────────────────────────────────────────────
    is_totp_enabled: bool = False
    totp_secret: Optional[str] = None

    # ── Password Reset ────────────────────────────────────────
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

    # ── Timestamps ────────────────────────────────────────────
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
