"""
Workout plan routes — create and list scheduled workout plans.
"""

from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_user
from app.models.user import User
from app.models.workout_plan import WorkoutPlan
from app.schemas.workout_plan import WorkoutPlanCreate, WorkoutPlanResponse

router = APIRouter(prefix="/workout-plans", tags=["Workout Plans"])


@router.post("", response_model=WorkoutPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_workout_plan(
    data: WorkoutPlanCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a scheduled workout plan for a day of the week."""
    plan = WorkoutPlan(
        user_id=current_user.id,
        day_of_week=data.day_of_week,
        exercise=data.exercise,
        target_reps=data.target_reps,
        target_sets=data.target_sets,
    )
    await plan.insert()

    return WorkoutPlanResponse.model_validate(plan)


@router.get("", response_model=list[WorkoutPlanResponse])
async def get_workout_plans(
    current_user: User = Depends(get_current_user),
):
    """Get all workout plans for the current user."""
    plans = await WorkoutPlan.find(
        WorkoutPlan.user_id == current_user.id
    ).sort(WorkoutPlan.day_of_week, WorkoutPlan.created_at).to_list()

    return [WorkoutPlanResponse.model_validate(p) for p in plans]
