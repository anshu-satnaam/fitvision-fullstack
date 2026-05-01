"""
MongoDB asynchronous database engine and initialization using Beanie.
"""

from pymongo import AsyncMongoClient
from beanie import init_beanie

from app.config import get_settings

# Import all models here so Beanie can register them
from app.models.user import User
from app.models.workout import Workout, WorkoutLog
from app.models.social import Friendship, ChatMessage, ActivityFeed, Clan, ClanMember
from app.models.water import WaterLog
from app.models.routine import Routine
from app.models.badge import Badge, UserBadge
from app.models.workout_plan import WorkoutPlan

settings = get_settings()

async def init_db():
    """
    Initialize MongoDB connection and register Beanie Document models.
    """
    client = AsyncMongoClient(settings.MONGODB_URL)
    database = client.get_default_database()
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            Workout,
            WorkoutLog,
            Friendship,
            ChatMessage,
            ActivityFeed,
            WaterLog,
            Routine,
            Badge,
            UserBadge,
            WorkoutPlan,
            Clan,
            ClanMember
        ],
    )
