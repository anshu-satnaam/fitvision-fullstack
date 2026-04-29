"""
Water intake tracking model.
"""

from datetime import datetime, timezone
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class WaterLog(Document):
    """Individual water intake log entry. Supports negative values for removal."""
    user_id: Indexed(PydanticObjectId)
    amount_ml: float
    logged_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "water_intake"

