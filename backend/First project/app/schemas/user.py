"""
User profile schemas — response and update.
"""

import uuid
from datetime import datetime
from typing import Optional
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
    total_reps: int = 0
    level: int = 1
    # Profile
    bio: Optional[str]   = None
    avatar_url: Optional[str]   = None
    profile_image: Optional[str]   = None
    # Physical stats
    age: Optional[int]   = None
    height_cm: Optional[float]   = None
    weight_kg: Optional[float]   = None
    # Fitness profile
    body_type: Optional[str]   = None
    diet_goal: Optional[str]   = None
    activity_level: Optional[str]   = None
    # Daily targets
    daily_sleep_goal: Optional[float]   = None
    daily_water_goal: Optional[float]   = None
    # Health
    injuries: Optional[str]   = None
    dietary_preferences: Optional[str]   = None
    # Auth
    is_totp_enabled: bool = False
    # Timestamps
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """All fields optional for partial updates."""
    username: str   = None
    email: EmailStr   = None
    bio: str   = None
    avatar_url: str   = None
    profile_image: str   = None
    age: int   = None
    height_cm: float   = None
    weight_kg: float   = None
    body_type: str   = None
    diet_goal: str   = None
    activity_level: str   = None
    daily_sleep_goal: float   = None
    daily_water_goal: float   = None
    injuries: str   = None
    dietary_preferences: str   = None


class AuthResponse(BaseModel):
    """Combined token + user data returned after login/register."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
