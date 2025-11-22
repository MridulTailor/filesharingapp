import os
import shutil
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Query
from fastapi.responses import FileResponse as FastAPIFileResponse, JSONResponse
from sqlmodel import Session, select
from passlib.context import CryptContext

from database import get_session
from models import File as FileModel, FileResponse, FileDetailsResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")

@router.post("/api/files", response_model=FileResponse)
async def upload_file(
    myFile: UploadFile = File(...),
    password: Optional[str] = Form(None),
    expires_in: Optional[int] = Form(None), # in minutes
    max_downloads: Optional[int] = Form(None),
    session: Session = Depends(get_session)
):
    if not myFile:
        raise HTTPException(status_code=400, detail="No file received")

    # Generate unique filename
    filename = f"{int(datetime.now().timestamp() * 1000)}-{myFile.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(myFile.file, buffer)

    # Calculate expiration
    expires_at = None
    if expires_in:
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in)

    # Hash password if provided
    password_hash = None
    if password:
        password_hash = pwd_context.hash(password)

    file_size = os.path.getsize(file_path)
    
    db_file = FileModel(
        filename=filename,
        path=file_path,
        size=file_size,
        password_hash=password_hash,
        expires_at=expires_at,
        max_downloads=max_downloads
    )
    
    session.add(db_file)
    session.commit()
    session.refresh(db_file)

    return {"file": f"{APP_BASE_URL}/files/{db_file.uuid}"}

@router.get("/files/{uuid}", response_model=FileDetailsResponse)
async def show_file(uuid: str, session: Session = Depends(get_session)):
    file = session.get(FileModel, uuid)
    if not file:
        raise HTTPException(status_code=404, detail="Link has been expired.")

    # Check expiration
    if file.expires_at and datetime.utcnow() > file.expires_at:
        raise HTTPException(status_code=404, detail="Link has been expired.")
        
    # Check download limit
    if file.max_downloads and file.download_count >= file.max_downloads:
        raise HTTPException(status_code=404, detail="Download limit reached.")

    return {
        "filename": file.filename,
        "size": file.size,
        "createdAt": file.created_at,
        "downloadLink": f"{APP_BASE_URL}/files/download/{uuid}",
        "is_protected": bool(file.password_hash)
    }


@router.get("/files/preview/{uuid}")
async def preview_file(
    uuid: str,
    password: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    """Preview endpoint for images and PDFs"""
    file = session.get(FileModel, uuid)
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    # Check expiration
    if file.expires_at and file.expires_at < datetime.utcnow():
        if os.path.exists(file.path):
            os.remove(file.path)
        session.delete(file)
        session.commit()
        raise HTTPException(status_code=404, detail="Link has been expired.")

    # Verify password for preview
    if file.password_hash:
        if not password:
            raise HTTPException(status_code=401, detail="Password required.")
        if not pwd_context.verify(password, file.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect password.")

    # Check if file exists
    if not os.path.exists(file.path):
        session.delete(file)
        session.commit()
        raise HTTPException(status_code=404, detail="File not found on server.")

    # Determine content type based on file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    content_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
    }
    
    content_type = content_type_map.get(file_ext, 'application/octet-stream')
    
    return FastAPIFileResponse(
        file.path,
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename={file.filename}"}
    )

@router.get("/files/download/{uuid}")
async def download_file(
    uuid: str, 
    password: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    file = session.get(FileModel, uuid)
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")

    # Check expiration
    if file.expires_at and file.expires_at < datetime.utcnow():
        # File expired, delete it
        if os.path.exists(file.path):
            os.remove(file.path)
        session.delete(file)
        session.commit()
        raise HTTPException(status_code=404, detail="Link has been expired.")

    # Check download limit
    if file.max_downloads is not None and file.download_count >= file.max_downloads:
        raise HTTPException(status_code=403, detail="Download limit reached.")

    # Verify password
    if file.password_hash:
        if not password:
             raise HTTPException(status_code=401, detail="Password required.")
        if not pwd_context.verify(password, file.password_hash):
             raise HTTPException(status_code=401, detail="Incorrect password.")

    # Check if file exists on disk
    if not os.path.exists(file.path):
        session.delete(file)
        session.commit()
        raise HTTPException(status_code=404, detail="File not found on server.")

    # Increment download count
    file.download_count += 1
    session.add(file)
    session.commit()
         
    return FastAPIFileResponse(file.path, filename=file.filename)
