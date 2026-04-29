"""
Adapter router to provide FitVision Lite API compatibility using our robust backend's database models.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from beanie.operators import Or, And

from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

from app.models.user import User
from app.models.workout import Workout, WorkoutLog
from app.models.social import Friendship
from app.dependencies import get_current_user
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(tags=["FitVision Adapter"])

# --- Schemas ---
class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileUpdate(BaseModel):
    age: int | None = None
    height: float | None = None
    weight: float | None = None

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    age: int | None = None
    height: float | None = None
    weight: float | None = None
    total_reps: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class WorkoutCreate(BaseModel):
    exercise: str
    reps: int

class WorkoutOut(BaseModel):
    id: str
    user_id: str
    exercise: str
    reps: int
    created_at: datetime

    class Config:
        from_attributes = True

class LiveSessionCreate(BaseModel):
    exercise: str

class LiveSessionEnd(BaseModel):
    session_id: str
    reps: int

class FriendRequestCreate(BaseModel):
    receiver_id: str

class FriendRequestRespond(BaseModel):
    request_id: str
    action: str

# --- Endpoints ---

@router.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: UserSignup):
    user_exists = await User.find_one(Or(User.email == payload.email, User.username == payload.username))
    if user_exists:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    await user.insert()

    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}

def map_user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        age=user.age,
        height=user.height_cm,
        weight=user.weight_kg,
        total_reps=user.points, # Map total_reps to points for gamification tracking
        created_at=user.created_at
    )

@router.get("/auth/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return map_user_out(current_user)

@router.put("/auth/profile", response_model=UserOut)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    if payload.age is not None:
        current_user.age = payload.age
    if payload.height is not None:
        current_user.height_cm = payload.height
    if payload.weight is not None:
        current_user.weight_kg = payload.weight
    
    await current_user.save()
    return map_user_out(current_user)

@router.get("/leaderboard", response_model=list[UserOut])
async def get_leaderboard():
    # Sort by points descending
    users = await User.find().sort(-User.points).limit(10).to_list()
    return [map_user_out(u) for u in users]

@router.post("/workouts", response_model=WorkoutOut)
async def create_workout(
    payload: WorkoutCreate,
    current_user: User = Depends(get_current_user),
):
    workout = Workout(
        user_id=current_user.id,
        exercise=payload.exercise,
        reps=payload.reps,
    )
    await workout.insert()
    
    # Update user gamification points based on reps
    current_user.points += payload.reps
    await current_user.save()
    
    return WorkoutOut(
        id=str(workout.id),
        user_id=str(workout.user_id),
        exercise=workout.exercise,
        reps=workout.reps,
        created_at=workout.created_at,
    )

active_sessions: dict[str, dict] = {}

@router.post("/workouts/start")
async def start_live(
    payload: LiveSessionCreate, current_user: User = Depends(get_current_user)
):
    exercise = payload.exercise.strip().lower()
    normalized = {
        "squat": "squat",
        "squats": "squat",
        "pushup": "pushup",
        "pushups": "pushup",
        "push-up": "pushup",
    }.get(exercise)
    if not normalized:
        raise HTTPException(status_code=400, detail="Exercise must be squat or pushup")
    session_id = f"{current_user.id}-{uuid.uuid4()}"
    active_sessions[session_id] = {"user_id": str(current_user.id), "exercise": normalized}
    return {
        "session_id": session_id,
        "exercise": normalized,
    }

@router.post("/workouts/end")
async def end_live(
    payload: LiveSessionEnd,
    current_user: User = Depends(get_current_user),
):
    session = active_sessions.pop(payload.session_id, None)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Session does not belong to current user")

    reps = max(0, int(payload.reps))
    workout = Workout(user_id=current_user.id, exercise=session["exercise"], reps=reps)
    await workout.insert()
    
    current_user.points += reps
    await current_user.save()
    return {"exercise": workout.exercise, "reps": workout.reps}

@router.get("/workouts/me", response_model=list[WorkoutOut])
async def my_workouts(
    current_user: User = Depends(get_current_user)
):
    workouts = await Workout.find(Workout.user_id == current_user.id).sort(-Workout.created_at).to_list()
    return [
        WorkoutOut(
            id=str(w.id),
            user_id=str(w.user_id),
            exercise=w.exercise,
            reps=w.reps,
            created_at=w.created_at,
        )
        for w in workouts
    ]

# --- Social Endpoints ---
@router.post("/social/request")
async def send_request(
    payload: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        receiver_uuid = PydanticObjectId(payload.receiver_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid receiver ID")

    if current_user.id == receiver_uuid:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    
    # Check if request already exists
    existing = await Friendship.find_one(
        Friendship.requester_id == current_user.id,
        Friendship.addressee_id == receiver_uuid
    )
    if existing:
        raise HTTPException(status_code=400, detail="Request already sent")
        
    friendship = Friendship(requester_id=current_user.id, addressee_id=receiver_uuid, status="pending")
    await friendship.insert()
    return {"message": "Request sent"}

@router.post("/social/respond")
async def respond_request(
    payload: FriendRequestRespond,
    current_user: User = Depends(get_current_user),
):
    try:
        request_uuid = PydanticObjectId(payload.request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    friendship = await Friendship.get(request_uuid)
    
    if not friendship or friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if payload.action == "accept":
        friendship.status = "accepted"
        # Create reciprocal friendship
        reciprocal = Friendship(
            requester_id=current_user.id,
            addressee_id=friendship.requester_id,
            status="accepted"
        )
        await reciprocal.insert()
    else:
        friendship.status = "rejected"
        
    await friendship.save()
    return {"message": f"Request {payload.action}ed"}

@router.get("/social/requests")
async def get_requests(
    current_user: User = Depends(get_current_user)
):
    requests = await Friendship.find(
        Friendship.addressee_id == current_user.id, 
        Friendship.status == "pending"
    ).to_list()
    
    res = []
    for f in requests:
        user = await User.get(f.requester_id)
        if user:
            res.append({
                "id": str(f.id),
                "sender_id": str(f.requester_id),
                "sender_username": user.username,
                "status": f.status,
                "created_at": f.created_at,
            })
    return res

@router.get("/social/friends")
async def get_friends(
    current_user: User = Depends(get_current_user)
):
    # Assuming reciprocal entries exist for accepted friends
    friendships = await Friendship.find(
        Friendship.requester_id == current_user.id, 
        Friendship.status == "accepted"
    ).to_list()
    
    res = []
    for f in friendships:
        user = await User.get(f.addressee_id)
        if user:
            res.append({
                "id": str(user.id),
                "username": user.username,
                "total_reps": user.points,
            })
    return res
