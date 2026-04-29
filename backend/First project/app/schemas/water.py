"""
Water tracking schemas.
"""

from pydantic import BaseModel, Field


class WaterLogCreate(BaseModel):
    """Log water intake. Negative values remove previously logged water."""
    amount_ml: float = Field(..., ge=-5000, le=5000)


class WaterTodayResponse(BaseModel):
    current: float
    goal: float
