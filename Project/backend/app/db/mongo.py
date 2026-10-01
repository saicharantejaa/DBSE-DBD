"""
app/db/mongo.py
Motor async MongoDB client for the course_assets and doubt_attachments collections.
Collection structure mirrors db/mongo-schemas.js.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URL)
    return _client


def get_mongo_db() -> AsyncIOMotorDatabase:
    return get_mongo_client()[settings.MONGO_DB_NAME]


# Collection accessors ---------------------------------------------------------

def course_assets_col():
    return get_mongo_db()["course_assets"]


def doubt_attachments_col():
    return get_mongo_db()["doubt_attachments"]


async def close_mongo() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
