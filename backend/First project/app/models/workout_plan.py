"""
WorkoutPlan model — scheduled workouts by day of week.
"""

from datetime import datetime, timezone
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class WorkoutPlan(Document):
    """A scheduled workout plan entry for a specific day of the week."""
    user_id: Indexed(PydanticObjectId)
    day_of_week: str  # "monday", "tuesday", etc.
    exercise: str
    target_reps: int = 10
    target_sets: int = 3
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "workout_plans"
