"""
Routine schemas — create and response with nested steps.
"""

from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId


class RoutineStepCreate(BaseModel):
    exercise_name: str
    exercise_id: str   = None
    reps: int = 10
    sets: int = 3
    duration_seconds: int   = None
    order_index: int = 0
    icon: str   = None
    timing_type: str   = None
    quantity: int   = None
    vision_complexity: str   = None


class RoutineCreate(BaseModel):
    name: str
    description: str   = None
    complexity: str   = None
    vision_complexity: str   = None
    type: str = "fitness"
    steps: list[RoutineStepCreate] = []


class RoutineStepResponse(BaseModel):
    exercise_name: str
    exercise_id: str   = None
    reps: int
    sets: int
    duration_seconds: int   = None
    order_index: int
    icon: str   = None
    timing_type: str   = None
    quantity: int   = None
    vision_complexity: str   = None

    model_config = {"from_attributes": True}


class RoutineResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    name: str
    description: str   = None
    complexity: str   = None
    vision_complexity: str   = None
    type: str
    created_at: datetime
    steps: list[RoutineStepResponse] = []

    model_config = {"from_attributes": True}
