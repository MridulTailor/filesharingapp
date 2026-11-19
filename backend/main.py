import uvicorn
import logging
import uuid
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
from dotenv import load_dotenv
load_dotenv()

from routes import files
from contextlib import asynccontextmanager
from database import connect_to_mongodb, close_mongodb_connection
from ratelimit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from pymongo.errors import PyMongoError


logging.basicConfig(
    level=logging.DEBUG
    if os.getenv("ENVIRONMENT", "development").lower() == "development"
    else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("droplink")


class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "Request failed",
                extra={"request_id": request_id, "path": request.url.path},
            )
            raise

        response.headers["X-Request-ID"] = request_id
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
            },
        )
        return response


def validate_required_environment() -> None:
    required = [
        "MONGODB_URL",
        "MONGODB_DATABASE",
        "APP_BASE_URL",
        "R2_ENDPOINT",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
    ]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_environment()
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
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT", "development") == "development" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(RequestTracingMiddleware)

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


@app.get("/health/live")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
async def readiness():
    try:
        from database import get_database

        await get_database().command("ping")
        return {"status": "ready"}
    except (PyMongoError, RuntimeError):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable"},
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        proxy_headers=True,
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
