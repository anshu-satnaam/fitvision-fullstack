import asyncio
import motor.motor_asyncio

async def test():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb+srv://pranjalvyas004_db_user:flOEWxU2COR4ums3@cluster0.c6pfmpp.mongodb.net/fitness_db?appName=Cluster0")
        info = await client.server_info()
        print("SUCCESS:", info.get("version"))
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(test())
