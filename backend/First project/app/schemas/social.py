"""
Social schemas — leaderboard, friends, chat, activity feed.
"""

from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId


class LeaderboardEntry(BaseModel):
    user_id: PydanticObjectId
    username: str
    avatar_url: str | None = None
    points: int
    streak: int
    level: int
    rank: int
    friendship_status: str = "none"  # "none", "pending", "accepted"

    model_config = {"from_attributes": True}


class FriendResponse(BaseModel):
    user_id: PydanticObjectId
    username: str
    avatar_url: str | None = None
    level: int
    streak: int
    is_online: bool = False

    model_config = {"from_attributes": True}


class FriendRequestCreate(BaseModel):
    """Send a friend request — body is empty, user_id comes from path."""
    pass


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: PydanticObjectId
    sender_id: PydanticObjectId
    receiver_id: PydanticObjectId
    content: str
    is_read: bool
    timestamp: datetime

    model_config = {"from_attributes": True}


class ActivityFeedResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    username: str | None = None
    activity_type: str
    details: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
