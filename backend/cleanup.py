import asyncio
from datetime import datetime, timezone

from database import close_mongodb_connection, connect_to_mongodb, get_database
from storage import delete_object


async def cleanup_expired_files() -> int:
    db = get_database()
    deleted_count = 0
    expired_files = db.files.find(
        {"expires_at": {"$lt": datetime.now(timezone.utc)}}
    )

    async for file in expired_files:
        object_key = file.get("object_key")
        try:
            if object_key:
                await delete_object(object_key)
            await db.files.delete_one({"uuid": file["uuid"]})
            deleted_count += 1
        except Exception as exc:
            print(f"Error deleting file {file.get('filename', file['uuid'])}: {exc}")

    return deleted_count


async def cleanup_loop(interval_seconds: int = 60) -> None:
    await connect_to_mongodb()
    try:
        while True:
            deleted_count = await cleanup_expired_files()
            print(f"Cleanup complete: deleted {deleted_count} expired files")
            await asyncio.sleep(interval_seconds)
    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(cleanup_loop())
