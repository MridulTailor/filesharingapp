from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class File(SQLModel, table=True):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str
    path: str
    size: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # New features
    password_hash: Optional[str] = None
    expires_at: Optional[datetime] = None
    max_downloads: Optional[int] = None
    download_count: int = Field(default=0)

class FileResponse(SQLModel):
    file: str

class FileDetailsResponse(SQLModel):
    filename: str
    size: int
    createdAt: datetime
    downloadLink: str
    is_protected: bool = False
