"""
Social models — Friendship, ChatMessage, and ActivityFeed.
"""

from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Friendship(Document):
    """Friendship/connection between two users with status tracking."""
    requester_id: Indexed(PydanticObjectId)
    addressee_id: Indexed(PydanticObjectId)
    status: str = "pending"  # "none", "pending", "accepted", "rejected"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "friendships"


class ChatMessage(Document):
    """Direct message between two users."""
    sender_id: Indexed(PydanticObjectId)
    receiver_id: Indexed(PydanticObjectId)
    content: str
    is_read: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "chat_messages"


class ActivityFeed(Document):
    """User activity events for social feed."""
    user_id: Indexed(PydanticObjectId)
    activity_type: str
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "activity_feed"


class Clan(Document):
    """Clan for grouping users together."""
    name: Indexed(str, unique=True)
    description: Optional[str] = None
    leader_id: Indexed(PydanticObjectId)
    icon: Optional[str] = None
    total_xp: int = 0
    level: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clans"


class ClanMember(Document):
    """User membership within a clan."""
    clan_id: Indexed(PydanticObjectId)
    user_id: Indexed(PydanticObjectId)
    role: str = "member"  # "leader", "officer", "member"
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clan_members"


class ClanMessage(Document):
    """Message sent within a clan chat."""
    clan_id: Indexed(PydanticObjectId)
    user_id: Indexed(PydanticObjectId)
    username: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "clan_messages"
