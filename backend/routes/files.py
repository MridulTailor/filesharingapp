import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse

from pymongo.asynchronous.database import AsyncDatabase
from pymongo import ReturnDocument
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from database import get_database
from models import FileDetailsResponse, FileResponse
from storage import delete_object, upload_object, create_download_url
from ratelimit import limiter

router = APIRouter()
password_hasher = PasswordHasher()

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_PASSWORD_LENGTH = 128
MAX_FILE_NAME_LENGTH = 255
MAX_EXPIRATION_MINUTES = 60 * 24 * 30
MAX_DOWNLOAD_COUNT = 1000


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def _delete_file(db: AsyncDatabase, file: dict) -> None:
    object_key = file.get("object_key")
    if object_key:
        await delete_object(object_key)
    await db.files.delete_one({"uuid": file["uuid"]})


def _has_expired(file: dict, now: datetime) -> bool:
    expires_at = file.get("expires_at")
    return bool(expires_at and now > _to_utc(expires_at))


def _download_limit_reached(file: dict) -> bool:
    max_downloads = file.get("max_downloads")
    if max_downloads is None:
        return False
    return file.get("download_count", 0) >= max_downloads

@router.post("/api/files", response_model=FileResponse)
@limiter.limit("10/hour")
async def upload_file(
    request: Request,
    myFile: UploadFile = File(...),
    password: Annotated[
        Optional[str],
        Form(min_length=1, max_length=MAX_PASSWORD_LENGTH),
    ] = None,
    expires_in: Annotated[
        Optional[int],
        Form(ge=1, le=MAX_EXPIRATION_MINUTES),
    ] = None,
    max_downloads: Annotated[
        Optional[int],
        Form(ge=1, le=MAX_DOWNLOAD_COUNT),
    ] = None,
    db: AsyncDatabase = Depends(get_database),
):
    original_name = os.path.basename(myFile.filename or "upload").strip()
    if not original_name:
        raise HTTPException(status_code=400, detail="A valid filename is required.")
    original_name = original_name[:MAX_FILE_NAME_LENGTH]
    object_key = f"{uuid.uuid4()}-{original_name}"

    file_size = myFile.size
    if file_size is None:
        myFile.file.seek(0, 2)
        file_size = myFile.file.tell()
        myFile.file.seek(0)

    max_file_size = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size <= 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if file_size > max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"The uploaded file exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in)

    password_hash = None
    if password:
        password_hash = password_hasher.hash(password)

    document = {
        "uuid": str(uuid.uuid4()),
        "filename": original_name,
        "object_key": object_key,
        "size": file_size,
        "content_type": myFile.content_type,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "password_hash": password_hash,
        "expires_at": expires_at,
        "max_downloads": max_downloads,
        "download_count": 0,
    }

    await upload_object(myFile.file, object_key, myFile.content_type)

    try:
        await db.files.insert_one(document)
    except Exception:
        await delete_object(object_key)
        raise

    return {"file": f"{APP_BASE_URL}/files/{document['uuid']}"}

@router.get("/files/{uuid}", response_model=FileDetailsResponse)
async def show_file(
    uuid: str,
    db: AsyncDatabase = Depends(get_database),
):
    file = await db.files.find_one({"uuid": uuid})
    if not file:
        raise HTTPException(status_code=404, detail="Link has been expired.")

    now = datetime.now(timezone.utc)

    if _has_expired(file, now):
        await _delete_file(db, file)
        raise HTTPException(status_code=404, detail="Link has been expired.")

    if _download_limit_reached(file):
        await _delete_file(db, file)
        raise HTTPException(status_code=404, detail="Download limit reached.")

    return {
        "filename": file["filename"],
        "size": file["size"],
        "createdAt": file["created_at"],
        "downloadLink": f"{APP_BASE_URL}/files/download/{uuid}",
        "is_protected": bool(file.get("password_hash")),
    }


@router.get("/files/preview/{uuid}")
@limiter.limit("10/minute")
async def preview_file(
    request: Request,
    uuid: str,
    password: Optional[str] = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await db.files.find_one({"uuid": uuid})
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    now = datetime.now(timezone.utc)

    if _has_expired(file, now):
        await _delete_file(db, file)
        raise HTTPException(status_code=404, detail="Link has been expired.")

    if _download_limit_reached(file):
        await _delete_file(db, file)
        raise HTTPException(status_code=403, detail="Download limit reached.")

    password_hash = file.get("password_hash")
    if password_hash:
        if not password:
            raise HTTPException(status_code=401, detail="Password required.")
        try:
            password_hasher.verify(password_hash, password)
        except VerifyMismatchError:
            raise HTTPException(status_code=401, detail="Incorrect password.")

    preview_url = await create_download_url(
        file["object_key"],
        expires_in=300,
    )
    return RedirectResponse(preview_url, status_code=307)

@router.get("/files/download/{uuid}")
@limiter.limit("10/minute")
async def download_file(
    request: Request,
    uuid: str,
    password: Optional[str] = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await db.files.find_one({"uuid": uuid})
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    now = datetime.now(timezone.utc)

    if _has_expired(file, now):
        await _delete_file(db, file)
        raise HTTPException(status_code=404, detail="Link has been expired.")

    if _download_limit_reached(file):
        await _delete_file(db, file)
        raise HTTPException(status_code=403, detail="Download limit reached.")

    password_hash = file.get("password_hash")
    if password_hash:
        if not password:
            raise HTTPException(status_code=401, detail="Password required.")
        try:
            password_hasher.verify(password_hash, password)
        except VerifyMismatchError:
            raise HTTPException(status_code=401, detail="Incorrect password.")

    query = {
        "uuid": uuid,
        "$or": [
            {"max_downloads": None},
            {"$expr": {"$lt": ["$download_count", "$max_downloads"]}},
        ],
    }

    updated_file = await db.files.find_one_and_update(
        query,
        {"$inc": {"download_count": 1}},
        return_document=ReturnDocument.AFTER,
    )

    if updated_file is None:
        raise HTTPException(status_code=403, detail="Download limit reached.")

    download_url = await create_download_url(file["object_key"], expires_in=300)

    max_downloads = updated_file.get("max_downloads")
    download_count = updated_file.get("download_count", 0)
    if max_downloads is not None and download_count >= max_downloads:
        await db.files.update_one(
            {"uuid": uuid},
            {
                "$set": {
                    "cleanup_after": datetime.now(timezone.utc) + timedelta(minutes=5),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    return RedirectResponse(download_url, status_code=307)