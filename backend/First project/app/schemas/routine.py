"""
Routine schemas — create and response with nested steps.
"""

from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId


class RoutineStepCreate(BaseModel):
    exercise_name: str
    exercise_id: str | None = None
    reps: int = 10
    sets: int = 3
    duration_seconds: int | None = None
    order_index: int = 0
    icon: str | None = None
    timing_type: str | None = None
    quantity: int | None = None
    vision_complexity: str | None = None


class RoutineCreate(BaseModel):
    name: str
    description: str | None = None
    complexity: str | None = None
    vision_complexity: str | None = None
    type: str = "fitness"
    steps: list[RoutineStepCreate] = []


class RoutineStepResponse(BaseModel):
    exercise_name: str
    exercise_id: str | None = None
    reps: int
    sets: int
    duration_seconds: int | None = None
    order_index: int
    icon: str | None = None
    timing_type: str | None = None
    quantity: int | None = None
    vision_complexity: str | None = None

    model_config = {"from_attributes": True}


class RoutineResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    name: str
    description: str | None = None
    complexity: str | None = None
    vision_complexity: str | None = None
    type: str
    created_at: datetime
    steps: list[RoutineStepResponse] = []

    model_config = {"from_attributes": True}
