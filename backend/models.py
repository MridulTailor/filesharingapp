from datetime import datetime
from pydantic import BaseModel

class FileResponse(BaseModel):
    file: str
class FileDetailsResponse(BaseModel):
    filename: str
    size: int
    createdAt: datetime
    downloadLink: str
    is_protected: bool = False