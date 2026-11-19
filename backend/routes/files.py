import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import quote
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase
from database import get_database
from models import FileDetailsResponse, FileResponse
from ratelimit import limiter
from storage import delete_object, get_object_stream, upload_object

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

def _content_disposition(disposition: str, filename: str) -> str:
    safe_name = filename.replace('"', "").replace("\r", "").replace("\n", "")
    return f"{disposition}; filename=\"{safe_name}\"; filename*=UTF-8''{quote(filename)}"

async def _stream_response(file: dict, disposition: str) -> StreamingResponse:
    stream, storage_type, content_length = await get_object_stream(file["object_key"])
    media_type = storage_type or file.get("content_type") or "application/octet-stream"
    headers = {
        "Content-Disposition": _content_disposition(disposition, file["filename"]),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
    }
    if content_length is not None:
        headers["Content-Length"] = str(content_length)
    return StreamingResponse(stream, media_type=media_type, headers=headers)

async def _get_active_file(
    db: AsyncDatabase,
    file_uuid: str,
    not_found_detail: str = "File not found.",
    limit_status: int = 403,
) -> dict:
    file = await db.files.find_one({"uuid": file_uuid})
    if not file:
        raise HTTPException(status_code=404, detail=not_found_detail)
    if _has_expired(file, datetime.now(timezone.utc)):
        await _delete_file(db, file)
        raise HTTPException(status_code=404, detail="Link has been expired.")
    if _download_limit_reached(file):
        await _delete_file(db, file)
        raise HTTPException(status_code=limit_status, detail="Download limit reached.")
    return file

def _verify_password(file: dict, password: str | None) -> None:
    password_hash = file.get("password_hash")
    if not password_hash:
        return
    if not password:
        raise HTTPException(status_code=401, detail="Password required.")
    try:
        password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Incorrect password.")

@router.post("/api/files", response_model=FileResponse)
@limiter.limit("10/hour")
async def upload_file(
    request: Request,
    myFile: UploadFile = File(...),
    password: Annotated[str | None, Form(min_length=1, max_length=MAX_PASSWORD_LENGTH)] = None,
    expires_in: Annotated[int | None, Form(ge=1, le=MAX_EXPIRATION_MINUTES)] = None,
    max_downloads: Annotated[int | None, Form(ge=1, le=MAX_DOWNLOAD_COUNT)] = None,
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
    if file_size <= 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"The uploaded file exceeds the {MAX_FILE_SIZE_MB} MB limit.")
    now = datetime.now(timezone.utc)
    file_uuid = str(uuid.uuid4())
    document = {
        "uuid": file_uuid,
        "filename": original_name,
        "object_key": object_key,
        "size": file_size,
        "content_type": myFile.content_type,
        "created_at": now,
        "updated_at": now,
        "password_hash": password_hasher.hash(password) if password else None,
        "expires_at": now + timedelta(minutes=expires_in) if expires_in else None,
        "max_downloads": max_downloads,
        "download_count": 0,
    }
    await upload_object(myFile.file, object_key, myFile.content_type)
    try:
        await db.files.insert_one(document)
    except Exception:
        await delete_object(object_key)
        raise
    return {"file": f"{APP_BASE_URL}/files/{file_uuid}", "uuid": file_uuid}

@router.get("/files/{uuid}", response_model=FileDetailsResponse)
async def show_file(
    uuid: str,
    password: str | None = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await _get_active_file(db, uuid, not_found_detail="Link has been expired.", limit_status=404)
    is_protected = bool(file.get("password_hash"))
    if is_protected and password:
        _verify_password(file, password)
    return {
        "filename": None if (is_protected and not password) else file["filename"],
        "size": file["size"],
        "createdAt": file["created_at"],
        "downloadLink": f"{APP_BASE_URL}/files/download/{uuid}",
        "is_protected": is_protected,
    }

@router.get("/files/preview/{uuid}")
@limiter.limit("10/minute")
async def preview_file(
    request: Request,
    uuid: str,
    password: str | None = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await _get_active_file(db, uuid)
    _verify_password(file, password)
    return await _stream_response(file, "inline")

@router.get("/files/download/{uuid}")
@limiter.limit("10/minute")
async def download_file(
    request: Request,
    uuid: str,
    password: str | None = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await _get_active_file(db, uuid)
    _verify_password(file, password)
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
    max_downloads = updated_file.get("max_downloads")
    if max_downloads is not None and updated_file.get("download_count", 0) >= max_downloads:
        now = datetime.now(timezone.utc)
        await db.files.update_one(
            {"uuid": uuid},
            {"$set": {"cleanup_after": now + timedelta(minutes=5), "updated_at": now}},
        )
    return await _stream_response(file, "attachment")
