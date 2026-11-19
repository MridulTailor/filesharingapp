import os
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from dotenv import load_dotenv

load_dotenv()
_client: AsyncMongoClient | None = None
_database: AsyncDatabase | None = None

async def connect_to_mongodb() -> None:
    global _client, _database

    mongo_url = os.environ["MONGODB_URL"]
    database_name = os.environ["MONGODB_DATABASE"]

    _client = AsyncMongoClient(mongo_url)
    await _client.admin.command("ping")
    _database = _client.get_database(database_name)

    await _database.files.create_index("uuid", unique=True)
    await _database.files.create_index("expires_at", expireAfterSeconds=0)
    await _database.files.create_index("cleanup_after", expireAfterSeconds=0)

async def close_mongodb_connection() -> None:
    global _client, _database

    if _client is not None:
        await _client.close()

    _client = None
    _database = None

def get_database() -> AsyncDatabase:
    if _database is None:
        raise RuntimeError("MongoDB has not been initialized")

    return _database