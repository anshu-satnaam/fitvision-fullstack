"""
Badge routes — list user's unlocked badges.
"""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.models.badge import Badge, UserBadge
from app.schemas.badge import BadgeResponse

router = APIRouter(prefix="/badges", tags=["Badges"])


@router.get("", response_model=list[BadgeResponse])
async def get_user_badges(
    current_user: User = Depends(get_current_user),
):
    """List all badges unlocked by the current user."""
    user_badges = await UserBadge.find(
        UserBadge.user_id == current_user.id
    ).sort(-UserBadge.unlocked_at).to_list()

    badges = []
    for ub in user_badges:
        badge = await Badge.get(ub.badge_id)
        if badge:
            badge_resp = BadgeResponse(
                id=badge.id,
                name=badge.name,
                description=badge.description,
                icon_url=badge.icon_url,
                xp_reward=badge.xp_reward,
                unlocked_at=ub.unlocked_at,
            )
            badges.append(badge_resp)

    return badges
