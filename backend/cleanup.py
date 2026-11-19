import asyncio
import logging
from datetime import datetime, timezone

from database import close_mongodb_connection, connect_to_mongodb, get_database
from storage import delete_object


logger = logging.getLogger("droplink.cleanup")


async def cleanup_expired_files() -> int:
    db = get_database()
    deleted_count = 0
    now = datetime.now(timezone.utc)
    expired_files = db.files.find({
        "$or": [
            {"expires_at": {"$lt": now}},
            {"cleanup_after": {"$lt": now}},
        ]
    })

    async for file in expired_files:
        object_key = file.get("object_key")
        try:
            if object_key:
                await delete_object(object_key)
            await db.files.delete_one({"uuid": file["uuid"]})
            deleted_count += 1
        except Exception as exc:
            logger.exception(
                "Expired file cleanup failed",
                extra={
                    "uuid": file["uuid"],
                    "filename": file.get("filename"),
                    "object_key": object_key,
                },
            )

    return deleted_count


async def cleanup_loop(interval_seconds: int = 60) -> None:
    await connect_to_mongodb()
    try:
        while True:
            deleted_count = await cleanup_expired_files()
            logger.info(
                "Cleanup complete",
                extra={"deleted_count": deleted_count},
            )
            await asyncio.sleep(interval_seconds)
    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(cleanup_loop())
