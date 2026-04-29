"""
Badge and UserBadge models — gamification achievements.
"""

from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Badge(Document):
    """A badge/achievement that users can unlock."""
    name: Indexed(str, unique=True)
    description: Optional[str] = None
    icon_url: Optional[str] = None
    xp_reward: int = 0

    class Settings:
        name = "badges"


class UserBadge(Document):
    """Junction collection tracking which users have unlocked which badges."""
    user_id: Indexed(PydanticObjectId)
    badge_id: Indexed(PydanticObjectId)
    unlocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user_badges"

