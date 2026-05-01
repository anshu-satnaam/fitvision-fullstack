"""
Workout schemas — AI/Vision workouts and manual workout logs.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

class WorkoutCreate(BaseModel):
    """AI/Vision workout entry."""
    exercise: str
    reps: int = Field(default=0, ge=0, le=1000)
    duration_seconds: int = Field(default=0, ge=0, le=36000)
    avg_angle: float   = Field(default=None, ge=0, le=360)
    calories: float   = None
    posture_score: float   = Field(default=None, ge=0, le=100)
    replay_data: dict   = None


class WorkoutLogCreate(BaseModel):
    """Manual workout log entry."""
    exercise_name: str
    reps: int = Field(default=0, ge=0)
    sets: int = Field(default=1, ge=1)
    duration_seconds: int   = Field(default=None, ge=0)
    calories_burned: float   = Field(default=None, ge=0)


class WorkoutResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    exercise: str
    reps: int
    duration_seconds: int
    avg_angle: float   = None
    calories: float   = None
    posture_score: float   = None
    replay_data: dict   = None
    created_at: datetime
    type: str = "ai"  # discriminator

    model_config = {"from_attributes": True}


class WorkoutLogResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    exercise_name: str
    reps: int
    sets: int
    duration_seconds: int   = None
    calories_burned: float   = None
    created_at: datetime
    type: str = "manual"  # discriminator

    model_config = {"from_attributes": True}
