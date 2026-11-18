import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import RedirectResponse

from pymongo.asynchronous.database import AsyncDatabase
from pymongo import ReturnDocument
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from database import get_database
from models import FileDetailsResponse, FileResponse
from storage import delete_object, upload_object, create_download_url

router = APIRouter()
password_hasher = PasswordHasher()

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

@router.post("/api/files", response_model=FileResponse)
async def upload_file(
    myFile: UploadFile = File(...),
    password: Optional[str] = Form(None),
    expires_in: Optional[int] = Form(None),
    max_downloads: Optional[int] = Form(None),
    db: AsyncDatabase = Depends(get_database),
):
    original_name = os.path.basename(myFile.filename or "upload")
    object_key = f"{uuid.uuid4()}-{original_name}"

    myFile.file.seek(0, 2)
    file_size = myFile.file.tell()
    myFile.file.seek(0)

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

    expires_at = file.get("expires_at")
    if expires_at and now > _to_utc(expires_at):
        await delete_object(file["object_key"])
        await db.files.delete_one({"uuid": uuid})
        raise HTTPException(status_code=404, detail="Link has been expired.")

    max_downloads = file.get("max_downloads")
    download_count = file.get("download_count", 0)

    if max_downloads is not None and download_count >= max_downloads:
        raise HTTPException(status_code=404, detail="Download limit reached.")

    return {
        "filename": file["filename"],
        "size": file["size"],
        "createdAt": file["created_at"],
        "downloadLink": f"{APP_BASE_URL}/files/download/{uuid}",
        "is_protected": bool(file.get("password_hash")),
    }


@router.get("/files/preview/{uuid}")
async def preview_file(
    uuid: str,
    password: Optional[str] = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await db.files.find_one({"uuid": uuid})
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    now = datetime.now(timezone.utc)

    expires_at = file.get("expires_at")
    if expires_at and _to_utc(expires_at) < now:
        await delete_object(file["object_key"])
        await db.files.delete_one({"uuid": uuid})
        raise HTTPException(status_code=404, detail="Link has been expired.")

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
async def download_file(
    uuid: str,
    password: Optional[str] = Header(default=None, alias="X-File-Password"),
    db: AsyncDatabase = Depends(get_database),
):
    file = await db.files.find_one({"uuid": uuid})
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    now = datetime.now(timezone.utc)

    expires_at = file.get("expires_at")
    if expires_at and _to_utc(expires_at) < now:
        await delete_object(file["object_key"])
        await db.files.delete_one({"uuid": uuid})
        raise HTTPException(status_code=404, detail="Link has been expired.")

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
    return RedirectResponse(download_url, status_code=307)