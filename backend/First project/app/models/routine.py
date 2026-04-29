"""
Routine models — user-created exercise routines.
"""

from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

class RoutineStep(BaseModel):
    """A single exercise step within a routine."""
    exercise_name: str
    exercise_id: Optional[str] = None
    reps: int = 10
    sets: int = 3
    duration_seconds: Optional[int] = None
    order_index: int = 0
    icon: Optional[str] = None
    timing_type: Optional[str] = None
    quantity: Optional[int] = None
    vision_complexity: Optional[str] = None

class Routine(Document):
    """A named routine containing multiple ordered exercise steps."""
    user_id: Indexed(PydanticObjectId)
    name: str
    description: Optional[str] = None
    complexity: Optional[str] = None
    vision_complexity: Optional[str] = None
    type: str = "fitness"
    steps: List[RoutineStep] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "routines"

