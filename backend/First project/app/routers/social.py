"""
Social routes — leaderboard, friends, friend requests, activity feed.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from beanie import PydanticObjectId
from beanie.operators import Or, And

from app.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.social import Friendship, ActivityFeed, Clan, ClanMember, ClanMessage
from app.schemas.social import (
    LeaderboardEntry,
    FriendResponse,
    ActivityFeedResponse,
    ClanCreate,
    ClanResponse,
    ClanMemberResponse,
    ClanMessageResponse,
)
from app.services.chat_service import manager

router = APIRouter(tags=["Social"])


# ── User Search ────────────────────────────────────────────────

@router.get("/users/search")
async def search_users(
    q: str = Query(min_length=2, max_length=30),
    current_user: User = Depends(get_current_user),
):
    """Search users by username (case-insensitive prefix match)."""
    users = await User.find({"username": {"$regex": q, "$options": "i"}}).to_list()
    
    # Filter out current user
    users = [u for u in users if u.id != current_user.id]

    results = []
    for u in users:
        if u.id == current_user.id:
            continue
        # Check friendship status
        friendship = await Friendship.find_one(
            Or(
                And(Friendship.requester_id == current_user.id, Friendship.addressee_id == u.id),
                And(Friendship.requester_id == u.id, Friendship.addressee_id == current_user.id),
            )
        )
        results.append({
            "user_id": str(u.id),
            "username": u.username,
            "avatar_url": u.avatar_url,
            "level": u.level,
            "streak": u.streak,
            "points": u.points,
            "friendship_status": friendship.status if friendship else "none",
            "friendship_direction": "sent" if friendship and friendship.requester_id == current_user.id else "received" if friendship else None,
        })
    return results


@router.get("/friends/suggestions")
async def get_suggested_friends(current_user: User = Depends(get_current_user)):
    """Suggest users to follow/friend (who aren't already friends or pending)."""
    # Get all current friendships/requests
    friendships = await Friendship.find(
        Or(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        )
    ).to_list()
    
    excluded_ids = {current_user.id}
    for f in friendships:
        excluded_ids.add(f.requester_id)
        excluded_ids.add(f.addressee_id)
    
    # Find users not in excluded list
    users = await User.find({"_id": {"$nin": list(excluded_ids)}}).limit(10).to_list()
    
    return [
        {
            "user_id": str(u.id),
            "username": u.username,
            "avatar_url": u.avatar_url,
            "level": u.level,
            "points": u.points,
        }
        for u in users
    ]

@router.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Get a public profile of any user."""
    from app.models.workout import Workout
    u = await User.get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    total_workouts = await Workout.find(Workout.user_id == u.id).count()
    total_reps = await Workout.find(Workout.user_id == u.id).sum(Workout.reps) or 0

    friendship = await Friendship.find_one(
        Or(
            And(Friendship.requester_id == current_user.id, Friendship.addressee_id == u.id),
            And(Friendship.requester_id == u.id, Friendship.addressee_id == current_user.id),
        )
    )

    return {
        "user_id": str(u.id),
        "username": u.username,
        "avatar_url": u.avatar_url,
        "bio": u.bio,
        "level": u.level,
        "xp": u.xp,
        "points": u.points,
        "streak": u.streak,
        "total_workouts": total_workouts,
        "total_reps": int(total_reps),
        "friendship_status": friendship.status if friendship else "none",
        "friendship_direction": "sent" if friendship and friendship.requester_id == current_user.id else "received" if friendship else None,
    }


# ── Leaderboard ───────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
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

@router.get("/my-rank")
async def get_my_rank(current_user: User = Depends(get_current_user)):
    """Calculate the current user's rank and stats."""
    # Count how many users have more points than the current user
    better_users = await User.find(User.points > current_user.points).count()
    rank = better_users + 1
    
    return {
        "rank": rank,
        "level": current_user.level,
        "points": current_user.points,
        "streak": current_user.streak
    }


@router.get("/leaderboard/me")
async def get_my_leaderboard_rank(current_user: User = Depends(get_current_user)):
    """Get the current user's global rank and stats."""
    # Rank is 1 + number of users with more points
    higher_ranked_count = await User.find(User.points > current_user.points).count()
    rank = higher_ranked_count + 1

    return {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "avatar_url": current_user.avatar_url,
        "points": current_user.points,
        "streak": current_user.streak,
        "level": current_user.level,
        "rank": rank,
    }


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


@router.post("/friends/{user_id}/reject")
async def reject_friend_request(
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Reject or cancel a pending friend request."""
    friendship = await Friendship.find_one(
        Or(
            And(Friendship.requester_id == user_id, Friendship.addressee_id == current_user.id),
            And(Friendship.requester_id == current_user.id, Friendship.addressee_id == user_id),
        ),
        Friendship.status == "pending",
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="No pending request found")
    await friendship.delete()
    return {"message": "Friend request rejected"}


@router.delete("/friends/{user_id}")
async def remove_friend(
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Remove an accepted friend."""
    friendship = await Friendship.find_one(
        Or(
            And(Friendship.requester_id == current_user.id, Friendship.addressee_id == user_id),
            And(Friendship.requester_id == user_id, Friendship.addressee_id == current_user.id),
        ),
        Friendship.status == "accepted",
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    await friendship.delete()
    return {"message": "Friend removed"}


@router.get("/friends/requests/pending")
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
):
    """Get all pending incoming friend requests."""
    pending = await Friendship.find(
        Friendship.addressee_id == current_user.id,
        Friendship.status == "pending",
    ).to_list()

    results = []
    for req in pending:
        requester = await User.get(req.requester_id)
        if requester:
            results.append({
                "request_id": str(req.id),
                "user_id": str(requester.id),
                "username": requester.username,
                "avatar_url": requester.avatar_url,
                "level": requester.level,
                "created_at": req.created_at.isoformat(),
            })
    return results


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

# ── Clans ─────────────────────────────────────────────────────

@router.post("/clans", response_model=ClanResponse, status_code=status.HTTP_201_CREATED)
async def create_clan(
    request: ClanCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new clan. The creator becomes the leader."""
    # Check if user is already in a clan
    existing_membership = await ClanMember.find_one(ClanMember.user_id == current_user.id)
    if existing_membership:
        raise HTTPException(status_code=400, detail="You are already in a clan")

    if await Clan.find_one(Clan.name == request.name):
        raise HTTPException(status_code=409, detail="Clan name already exists")

    clan = Clan(
        name=request.name,
        description=request.description,
        icon=request.icon,
        leader_id=current_user.id
    )
    await clan.insert()

    # Create membership for leader
    member = ClanMember(
        clan_id=clan.id,
        user_id=current_user.id,
        role="leader"
    )
    await member.insert()

    return ClanResponse(
        id=clan.id,
        name=clan.name,
        description=clan.description,
        icon=clan.icon,
        leader_id=clan.leader_id,
        total_xp=clan.total_xp,
        level=clan.level,
        created_at=clan.created_at,
        member_count=1
    )

@router.get("/clans", response_model=list[ClanResponse])
async def list_clans(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100)
):
    """List all clans sorted by level/XP."""
    offset = (page - 1) * size
    clans = await Clan.find_all().sort(-Clan.level, -Clan.total_xp).skip(offset).limit(size).to_list()
    
    results = []
    for clan in clans:
        members_count = await ClanMember.find(ClanMember.clan_id == clan.id).count()
        results.append(ClanResponse(
            id=clan.id,
            name=clan.name,
            description=clan.description,
            icon=clan.icon,
            leader_id=clan.leader_id,
            total_xp=clan.total_xp,
            level=clan.level,
            created_at=clan.created_at,
            member_count=members_count
        ))
    return results

@router.get("/clans/my", response_model=Optional[ClanResponse])
async def get_my_clan(current_user: User = Depends(get_current_user)):
    """Get the clan the current user belongs to."""
    membership = await ClanMember.find_one(ClanMember.user_id == current_user.id)
    if not membership:
        return None
    
    clan = await Clan.get(membership.clan_id)
    if not clan:
        return None
    
    members_count = await ClanMember.find(ClanMember.clan_id == clan.id).count()
    return ClanResponse(
        id=clan.id,
        name=clan.name,
        description=clan.description,
        icon=clan.icon,
        leader_id=clan.leader_id,
        total_xp=clan.total_xp,
        level=clan.level,
        created_at=clan.created_at,
        member_count=members_count
    )

@router.post("/clans/{clan_id}/leave")
async def leave_clan(
    clan_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Leave a clan."""
    membership = await ClanMember.find_one(
        ClanMember.clan_id == clan_id,
        ClanMember.user_id == current_user.id
    )
    if not membership:
        raise HTTPException(status_code=404, detail="You are not a member of this clan")
    
    await membership.delete()
    return {"detail": "Successfully left the clan"}

@router.post("/clans/{clan_id}/join")
async def join_clan(
    clan_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Join a clan."""
    # Check if already in a clan
    existing = await ClanMember.find_one(ClanMember.user_id == current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="You are already in a clan")
    
    clan = await Clan.get(clan_id)
    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")
    
    member = ClanMember(
        clan_id=clan.id,
        user_id=current_user.id,
        role="member"
    )
    await member.insert()
    return {"detail": f"Successfully joined {clan.name}"}

@router.get("/clans/{clan_id}/members", response_model=list[ClanMemberResponse])
async def get_clan_members(clan_id: PydanticObjectId):
    """Get members of a clan."""
    memberships = await ClanMember.find(ClanMember.clan_id == clan_id).to_list()
    results = []
    for m in memberships:
        user = await User.get(m.user_id)
        if user:
            results.append(ClanMemberResponse(
                user_id=user.id,
                username=user.username,
                avatar_url=user.avatar_url,
                role=m.role,
                joined_at=m.joined_at,
                level=user.level
            ))
    return results

@router.get("/clans/{clan_id}/chat", response_model=list[ClanMessageResponse])
async def get_clan_chat(
    clan_id: PydanticObjectId,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get recent chat messages for a clan."""
    # Verify membership
    membership = await ClanMember.find_one(ClanMember.clan_id == clan_id, ClanMember.user_id == current_user.id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this clan")
    
    messages = await ClanMessage.find(ClanMessage.clan_id == clan_id).sort(-ClanMessage.timestamp).limit(limit).to_list()
    # Reverse to show in chronological order
    return [ClanMessageResponse(**m.dict(), id=m.id) for m in reversed(messages)]

@router.post("/clans/{clan_id}/chat")
async def send_clan_message(
    clan_id: PydanticObjectId,
    msg: ChatMessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message to clan chat."""
    membership = await ClanMember.find_one(ClanMember.clan_id == clan_id, ClanMember.user_id == current_user.id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this clan")
    
    message = ClanMessage(
        clan_id=clan_id,
        user_id=current_user.id,
        username=current_user.username,
        content=msg.content
    )
    await message.insert()
    
    # Broadcast to real-time room
    await manager.broadcast_to_clan({
        "id": str(message.id),
        "user_id": str(current_user.id),
        "username": current_user.username,
        "content": message.content,
        "timestamp": message.timestamp.isoformat()
    }, str(clan_id))

    return {"detail": "Message sent"}

@router.websocket("/clans/{clan_id}/ws")
async def ws_clan_chat(websocket: WebSocket, clan_id: str):
    """WebSocket for real-time clan chat."""
    await websocket.accept()
    clan_id_str = str(clan_id)
    
    try:
        await manager.connect_to_clan(websocket, clan_id_str)
        while True:
            # We mostly use this for receiving, but keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_from_clan(websocket, clan_id_str)
    except Exception:
        manager.disconnect_from_clan(websocket, clan_id_str)
