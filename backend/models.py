from datetime import datetime
from pydantic import BaseModel

class FileResponse(BaseModel):
    file: str
    uuid: str

class FileDetailsResponse(BaseModel):
    filename: str | None = None
    size: int
    createdAt: datetime
    downloadLink: str
    is_protected: bool = False
