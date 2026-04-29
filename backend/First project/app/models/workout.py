"""
Workout models — AI/Vision workouts and manual workout logs.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Workout(Document):
    """AI/Vision-based workout tracking with posture analysis."""
    user_id: Indexed(PydanticObjectId)
    exercise: str
    reps: int = 0
    duration_seconds: int = 0
    avg_angle: Optional[float] = None
    calories: Optional[float] = None
    posture_score: Optional[float] = None
    replay_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "workouts"


class WorkoutLog(Document):
    """Manual workout log entries."""
    user_id: Indexed(PydanticObjectId)
    exercise_name: str
    reps: int = 0
    sets: int = 1
    duration_seconds: Optional[int] = None
    calories_burned: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "workout_logs"
