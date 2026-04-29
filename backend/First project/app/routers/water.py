"""
Water tracking routes.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_user
from app.models.user import User
from app.models.water import WaterLog
from app.schemas.water import WaterLogCreate, WaterTodayResponse

router = APIRouter(prefix="/water", tags=["Water Tracking"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def log_water(
    data: WaterLogCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Log water intake in milliliters.
    Supports negative values to remove previously logged water.
    """
    entry = WaterLog(
        user_id=current_user.id,
        amount_ml=data.amount_ml,
    )
    await entry.insert()

    return {"message": f"Logged {data.amount_ml}ml of water"}


@router.get("/today", response_model=WaterTodayResponse)
async def get_water_today(
    current_user: User = Depends(get_current_user),
):
    """Get today's water intake vs goal."""
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    water_logs = await WaterLog.find(
        WaterLog.user_id == current_user.id,
        WaterLog.logged_at >= today_start,
        WaterLog.logged_at < today_end
    ).to_list()
    
    current = sum(w.amount_ml for w in water_logs)
    goal = current_user.daily_water_goal or 2000.0

    return WaterTodayResponse(current=float(current), goal=float(goal))
