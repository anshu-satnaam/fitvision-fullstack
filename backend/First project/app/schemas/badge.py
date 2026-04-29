"""
Badge schemas.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId


class BadgeResponse(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None = None
    icon_url: str | None = None
    xp_reward: int
    unlocked_at: datetime

    model_config = {"from_attributes": True}
