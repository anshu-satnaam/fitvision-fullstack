"""
Social schemas — leaderboard, friends, chat, activity feed.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from beanie import PydanticObjectId


class LeaderboardEntry(BaseModel):
    user_id: PydanticObjectId
    username: str
    avatar_url: Optional[str] = None
    points: int
    streak: int
    level: int
    rank: int
    friendship_status: str = "none"  # "none", "pending", "accepted"

    model_config = {"from_attributes": True}


class FriendResponse(BaseModel):
    user_id: PydanticObjectId
    username: str
    avatar_url: Optional[str] = None
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
    username: str   = None
    activity_type: str
    details: str   = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ClanCreate(BaseModel):
    name: str
    description: Optional[str]   = None
    icon: Optional[str]   = None

class ClanResponse(BaseModel):
    id: PydanticObjectId
    name: str
    description: Optional[str]   = None
    icon: Optional[str]   = None
    leader_id: PydanticObjectId
    total_xp: int
    level: int
    created_at: datetime
    member_count: int = 1

    model_config = {"from_attributes": True}


class ClanMemberResponse(BaseModel):
    user_id: PydanticObjectId
    username: str
    avatar_url: Optional[str] = None
    role: str
    joined_at: datetime
    level: int = 1

    model_config = {"from_attributes": True}


class ClanMessageResponse(BaseModel):
    id: PydanticObjectId
    user_id: PydanticObjectId
    username: str
    content: str
    timestamp: datetime

    model_config = {"from_attributes": True}
