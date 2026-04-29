"""
Social routes — leaderboard, friends, friend requests, activity feed.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from beanie import PydanticObjectId
from beanie.operators import Or, And

from app.dependencies import get_current_user
from app.models.user import User
from app.models.social import Friendship, ActivityFeed
from app.schemas.social import (
    LeaderboardEntry,
    FriendResponse,
    ActivityFeedResponse,
)
from app.services.chat_service import manager

router = APIRouter(tags=["Social"])


# ── Leaderboard ───────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get the global leaderboard ranked by points."""
    offset = (page - 1) * size

    users = await User.find_all().sort(-User.points).skip(offset).limit(size).to_list()

    entries = []
    for rank, user in enumerate(users, start=offset + 1):
        # Determine friendship status with current user
        friendship_status = "none"
        if user.id != current_user.id:
            friendship = await Friendship.find_one(
                Or(
                    And(
                        Friendship.requester_id == current_user.id,
                        Friendship.addressee_id == user.id,
                    ),
                    And(
                        Friendship.requester_id == user.id,
                        Friendship.addressee_id == current_user.id,
                    ),
                )
            )
            if friendship:
                friendship_status = friendship.status

        entries.append(
            LeaderboardEntry(
                user_id=user.id,
                username=user.username,
                avatar_url=user.avatar_url,
                points=user.points,
                streak=user.streak,
                level=user.level,
                rank=rank,
                friendship_status=friendship_status,
            )
        )

    return entries


# ── Friends ───────────────────────────────────────────────────

@router.get("/friends", response_model=list[FriendResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's accepted friends with online status."""
    # Find all accepted friendships
    friendships = await Friendship.find(
        Friendship.status == "accepted",
        Or(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        ),
    ).to_list()

    # Get friend user IDs
    friend_ids = set()
    for f in friendships:
        if f.requester_id == current_user.id:
            friend_ids.add(f.addressee_id)
        else:
            friend_ids.add(f.requester_id)

    if not friend_ids:
        return []

    # Fetch friend user objects
    friends = await User.find({"_id": {"$in": list(friend_ids)}}).to_list()

    online_users = manager.get_online_user_ids()

    return [
        FriendResponse(
            user_id=f.id,
            username=f.username,
            avatar_url=f.avatar_url,
            level=f.level,
            streak=f.streak,
            is_online=str(f.id) in online_users,
        )
        for f in friends
    ]


@router.post("/friends/{user_id}/request", status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Send a friend request to another user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a friend request to yourself",
        )

    # Check target user exists
    target_user = await User.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check for existing friendship
    existing = await Friendship.find_one(
        Or(
            And(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == user_id,
            ),
            And(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == current_user.id,
            ),
        )
    )

    if existing:
        if existing.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already friends",
            )
        elif existing.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already pending",
            )

    friendship = Friendship(
        requester_id=current_user.id,
        addressee_id=user_id,
        status="pending",
    )
    await friendship.insert()

    return {"message": "Friend request sent"}


@router.post("/friends/{user_id}/accept")
async def accept_friend_request(
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Accept a pending friend request."""
    friendship = await Friendship.find_one(
        Friendship.requester_id == user_id,
        Friendship.addressee_id == current_user.id,
        Friendship.status == "pending",
    )

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending friend request from this user",
        )

    friendship.status = "accepted"
    await friendship.save()

    # Activity feed for both users
    for uid in [current_user.id, user_id]:
        activity = ActivityFeed(
            user_id=uid,
            activity_type="friendship",
            details="Became friends with a new user",
        )
        await activity.insert()

    return {"message": "Friend request accepted"}


# ── Activity Feed ─────────────────────────────────────────────

@router.get("/friends/activity", response_model=list[ActivityFeedResponse])
async def get_friends_activity(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get the activity feed from the current user's friends."""
    offset = (page - 1) * size

    # Get friend IDs
    friendships = await Friendship.find(
        Friendship.status == "accepted",
        Or(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        ),
    ).to_list()

    friend_ids = set()
    for f in friendships:
        if f.requester_id == current_user.id:
            friend_ids.add(f.addressee_id)
        else:
            friend_ids.add(f.requester_id)

    if not friend_ids:
        return []

    # Fetch activity feed from friends
    activities = await ActivityFeed.find(
        {"user_id": {"$in": list(friend_ids)}}
    ).sort(-ActivityFeed.created_at).skip(offset).limit(size).to_list()

    # Fetch usernames for friends
    friends = await User.find({"_id": {"$in": list(friend_ids)}}).to_list()
    username_map = {f.id: f.username for f in friends}

    return [
        ActivityFeedResponse(
            id=activity.id,
            user_id=activity.user_id,
            username=username_map.get(activity.user_id, "Unknown User"),
            activity_type=activity.activity_type,
            details=activity.details,
            created_at=activity.created_at,
        )
        for activity in activities
    ]
