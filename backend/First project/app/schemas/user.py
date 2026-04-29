"""
User profile schemas — response and update.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from beanie import PydanticObjectId


class UserResponse(BaseModel):
    id: PydanticObjectId
    username: str
    email: EmailStr
    # Gamification
    streak: int = 0
    xp: int = 0
    points: int = 0
    level: int = 1
    # Profile
    bio: str | None = None
    avatar_url: str | None = None
    profile_image: str | None = None
    # Physical stats
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    # Fitness profile
    body_type: str | None = None
    diet_goal: str | None = None
    activity_level: str | None = None
    # Daily targets
    daily_sleep_goal: float | None = None
    daily_water_goal: float | None = None
    # Health
    injuries: str | None = None
    dietary_preferences: str | None = None
    # Auth
    is_totp_enabled: bool = False
    # Timestamps
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """All fields optional for partial updates."""
    username: str | None = None
    email: EmailStr | None = None
    bio: str | None = None
    avatar_url: str | None = None
    profile_image: str | None = None
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_type: str | None = None
    diet_goal: str | None = None
    activity_level: str | None = None
    daily_sleep_goal: float | None = None
    daily_water_goal: float | None = None
    injuries: str | None = None
    dietary_preferences: str | None = None


class AuthResponse(BaseModel):
    """Combined token + user data returned after login/register."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
