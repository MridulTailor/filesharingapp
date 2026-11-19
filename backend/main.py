import logging
import os
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import uvicorn
from database import close_mongodb_connection, connect_to_mongodb, get_database
from ratelimit import limiter
from routes import files

load_dotenv()

is_dev = os.getenv("ENVIRONMENT", "development").lower() == "development"
logging.basicConfig(
    level=logging.DEBUG if is_dev else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("droplink")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()

app = FastAPI(
    title="DropLink API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def add_security_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Request failed", extra={"request_id": request_id, "path": request.url.path})
        raise
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "no-referrer"
    logger.info(
        "Request completed",
        extra={"request_id": request_id, "method": request.method, "path": request.url.path, "status_code": response.status_code},
    )
    return response

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
        await get_database().command("ping")
        return {"status": "ready"}
    except (PyMongoError, RuntimeError):
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"status": "unavailable"})

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3000)),
        reload=is_dev,
        proxy_headers=True,
        forwarded_allow_ips=os.getenv("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
