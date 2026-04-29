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
