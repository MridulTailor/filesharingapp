import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv()

from routes import files
from contextlib import asynccontextmanager
from database import connect_to_mongodb, close_mongodb_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()

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
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-File-Password"],
)

app.include_router(files.router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
