import asyncio
from motor.motor_asyncio import AsyncMongoClient
from beanie import init_beanie
from app.config import get_settings
from app.models.user import User

settings = get_settings()

async def test():
    client = AsyncMongoClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User])
    user = await User.find_one(User.username == "testuser")
    if user:
        print("Found:", user.username)
    else:
        print("Not found")

if __name__ == "__main__":
    asyncio.run(test())
