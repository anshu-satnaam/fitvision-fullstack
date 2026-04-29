"""
Routine routes — create, list, and retrieve routines with steps.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from app.dependencies import get_current_user
from app.models.user import User
from app.models.routine import Routine, RoutineStep
from app.schemas.routine import RoutineCreate, RoutineResponse

router = APIRouter(prefix="/routines", tags=["Routines"])


@router.post("", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_routine(
    data: RoutineCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new routine with its exercise steps."""
    steps = []
    for step_data in data.steps:
        step = RoutineStep(
            exercise_name=step_data.exercise_name,
            exercise_id=step_data.exercise_id,
            reps=step_data.reps,
            sets=step_data.sets,
            duration_seconds=step_data.duration_seconds,
            order_index=step_data.order_index,
            icon=step_data.icon,
            timing_type=step_data.timing_type,
            quantity=step_data.quantity,
            vision_complexity=step_data.vision_complexity,
        )
        steps.append(step)

    routine = Routine(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        complexity=data.complexity,
        vision_complexity=data.vision_complexity,
        type=data.type,
        steps=steps,
    )
    await routine.insert()

    return RoutineResponse.model_validate(routine)


@router.get("", response_model=list[RoutineResponse])
async def list_routines(
    current_user: User = Depends(get_current_user),
):
    """List all routines for the current user."""
    routines = await Routine.find(
        Routine.user_id == current_user.id
    ).sort(-Routine.created_at).to_list()

    return [RoutineResponse.model_validate(r) for r in routines]


@router.get("/{routine_id}", response_model=RoutineResponse)
async def get_routine(
    routine_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Get a single routine with its steps."""
    routine = await Routine.find_one(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    )

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    return RoutineResponse.model_validate(routine)
