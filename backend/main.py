import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import files
import os
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from database import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="DropLink API",
    description="""
## Secure File Sharing API

DropLink provides a simple yet powerful API for secure file sharing with advanced features.

### Features

* **File Upload** - Upload files with drag & drop support
* **Password Protection** - Optional password encryption with Argon2
* **Auto-Expiration** - Set custom expiration times
* **Download Limits** - Control maximum download counts
* **File Preview** - Preview images and PDFs in-browser
* **QR Code** - Generate QR codes for easy mobile sharing

### Security

All passwords are hashed using Argon2, and files can be automatically deleted after expiration or download limits are reached.
    """,
    version="1.0.0",
    contact={
        "name": "Mridul Tailor",
        "url": "https://github.com/mridultailor",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
