"""
Workout plan schemas — scheduled workouts by day.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

class WorkoutPlanCreate(BaseModel):
    day_of_week: str = Field(..., pattern="^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$")
    exercise: str
    target_reps: int = Field(default=10, ge=1)
    target_sets: int = Field(default=3, ge=1)


class WorkoutPlanResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    day_of_week: str
    exercise: str
    target_reps: int
    target_sets: int
    created_at: datetime

    model_config = {"from_attributes": True}
