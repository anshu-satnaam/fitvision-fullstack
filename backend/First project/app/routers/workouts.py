"""
Workout routes — log AI/vision workouts and manual workout logs.
"""

from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_current_user
from app.models.user import User
from app.models.workout import Workout, WorkoutLog
from app.models.social import ActivityFeed
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutLogCreate,
    WorkoutResponse,
    WorkoutLogResponse,
)
from app.services.gamification_service import award_xp, update_streak, check_and_award_badges

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.post("/ai", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def log_ai_workout(
    workout_data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
):
    """Log an AI/Vision-based workout."""
    workout = Workout(
        user_id=current_user.id,
        exercise=workout_data.exercise,
        reps=workout_data.reps,
        duration_seconds=workout_data.duration_seconds,
        avg_angle=workout_data.avg_angle,
        calories=workout_data.calories,
        posture_score=workout_data.posture_score,
        replay_data=workout_data.replay_data,
    )
    await workout.insert()

    # Gamification: award XP and update streak
    xp_earned = 25 + (workout_data.reps * 2)
    await award_xp(current_user, xp_earned, points_amount=10)
    await update_streak(current_user)
    await check_and_award_badges(current_user)

    # Activity feed
    activity = ActivityFeed(
        user_id=current_user.id,
        activity_type="workout",
        details=f"Completed {workout_data.exercise} — {workout_data.reps} reps",
    )
    await activity.insert()

    response = WorkoutResponse.model_validate(workout)
    response.type = "ai"
    return response


@router.post("/manual", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def log_manual_workout(
    workout_data: WorkoutLogCreate,
    current_user: User = Depends(get_current_user),
):
    """Log a manual workout entry."""
    workout_log = WorkoutLog(
        user_id=current_user.id,
        exercise_name=workout_data.exercise_name,
        reps=workout_data.reps,
        sets=workout_data.sets,
        duration_seconds=workout_data.duration_seconds,
        calories_burned=workout_data.calories_burned,
    )
    await workout_log.insert()

    # Gamification
    xp_earned = 20 + (workout_data.reps * workout_data.sets)
    await award_xp(current_user, xp_earned, points_amount=10)
    await update_streak(current_user)
    await check_and_award_badges(current_user)

    # Activity feed
    activity = ActivityFeed(
        user_id=current_user.id,
        activity_type="workout",
        details=f"Logged {workout_data.exercise_name} — {workout_data.sets}x{workout_data.reps}",
    )
    await activity.insert()

    response = WorkoutLogResponse.model_validate(workout_log)
    response.type = "manual"
    return response


@router.get("")
async def get_workouts(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """
    Get combined workout history (both AI and manual).
    Results are sorted by creation date descending, paginated.
    """
    offset = (page - 1) * size

    # Fetch AI workouts
    ai_workouts = await Workout.find(
        Workout.user_id == current_user.id
    ).sort(-Workout.created_at).to_list()

    # Fetch manual workouts
    manual_workouts = await WorkoutLog.find(
        WorkoutLog.user_id == current_user.id
    ).sort(-WorkoutLog.created_at).to_list()

    # Combine and sort
    all_workouts = []
    for w in ai_workouts:
        resp = WorkoutResponse.model_validate(w)
        resp.type = "ai"
        all_workouts.append(resp)
    for w in manual_workouts:
        resp = WorkoutLogResponse.model_validate(w)
        resp.type = "manual"
        all_workouts.append(resp)

    # Sort by created_at descending
    all_workouts.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    paginated = all_workouts[offset : offset + size]

    return {
        "items": paginated,
        "total": len(all_workouts),
        "page": page,
        "size": size,
    }
