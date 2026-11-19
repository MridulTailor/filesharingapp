import os
from datetime import datetime, timedelta, timezone
from io import BytesIO
from unittest.mock import AsyncMock, patch
import pytest
from argon2 import PasswordHasher
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient
from database import get_database
from main import app

load_dotenv()

def _mock_stream(content: bytes = b"file-bytes", content_type: str = "text/plain"):
    return AsyncMock(return_value=(iter([content]), content_type, len(content)))

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
def mongo_database():
    client = AsyncMongoClient(os.environ["MONGODB_URL"])
    database = client.get_database(os.environ["MONGODB_DATABASE"])
    return client, database

@pytest.fixture
async def client(mongo_database):
    client, database = mongo_database
    await database.files.delete_many({})
    app.dependency_overrides[get_database] = lambda: database
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as http_client:
        yield http_client, database
    app.dependency_overrides.clear()
    await database.files.delete_many({})
    await client.close()

@pytest.mark.anyio
async def test_read_root(client):
    http_client, _ = client
    response = await http_client.get("/")
    assert response.status_code in [200, 404]

@pytest.mark.anyio
async def test_liveness(client):
    http_client, _ = client
    response = await http_client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-request-id"]

@pytest.mark.anyio
async def test_upload_file_simple(client):
    http_client, database = client
    with patch("routes.files.upload_object", new=AsyncMock()):
        response = await http_client.post(
            "/api/files",
            files={"myFile": ("test.txt", BytesIO(b"Test file content"), "text/plain")},
        )
    assert response.status_code == 200
    body = response.json()
    assert "localhost" in body["file"]
    assert body["uuid"]
    assert await database.files.count_documents({}) == 1

@pytest.mark.anyio
async def test_upload_file_with_password(client):
    http_client, database = client
    with patch("routes.files.upload_object", new=AsyncMock()):
        response = await http_client.post(
            "/api/files",
            files={"myFile": ("secret.txt", BytesIO(b"Secret file content"), "text/plain")},
            data={"password": "mysecretpass"},
        )
    assert response.status_code == 200
    document = await database.files.find_one({})
    assert document["password_hash"]

@pytest.mark.anyio
async def test_file_metadata(client):
    http_client, database = client
    await database.files.insert_one({
        "uuid": "test-uuid-123",
        "filename": "test.txt",
        "object_key": "test-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": None,
        "expires_at": None,
        "max_downloads": None,
        "download_count": 0,
    })
    response = await http_client.get("/files/test-uuid-123")
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["size"] == 1024
    assert "downloadLink" in data

@pytest.mark.anyio
async def test_nonexistent_file(client):
    http_client, _ = client
    response = await http_client.get("/files/nonexistent-uuid")
    assert response.status_code == 404

@pytest.mark.anyio
async def test_password_required_for_download(client):
    http_client, database = client
    password_hash = PasswordHasher().hash("mysecretpass")
    await database.files.insert_one({
        "uuid": "protected-uuid",
        "filename": "protected.txt",
        "object_key": "protected-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": password_hash,
        "expires_at": None,
        "max_downloads": None,
        "download_count": 0,
    })
    response = await http_client.get("/files/download/protected-uuid", headers={"X-File-Password": "wrong-password"})
    assert response.status_code == 401

@pytest.mark.anyio
async def test_password_header_allows_download(client):
    http_client, database = client
    password_hash = PasswordHasher().hash("mysecretpass")
    await database.files.insert_one({
        "uuid": "protected-uuid",
        "filename": "protected.txt",
        "object_key": "protected-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": password_hash,
        "expires_at": None,
        "max_downloads": None,
        "download_count": 0,
    })
    with patch("routes.files.get_object_stream", new=_mock_stream(b"secret")):
        response = await http_client.get("/files/download/protected-uuid", headers={"X-File-Password": "mysecretpass"})
    assert response.status_code == 200
    assert response.content == b"secret"
    assert response.headers["content-disposition"].startswith("attachment;")

@pytest.mark.anyio
async def test_download_limit_is_enforced(client):
    http_client, database = client
    await database.files.insert_one({
        "uuid": "limited-uuid",
        "filename": "limited.txt",
        "object_key": "limited-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": None,
        "expires_at": None,
        "max_downloads": 1,
        "download_count": 0,
    })
    with patch("routes.files.get_object_stream", new=_mock_stream()):
        first = await http_client.get("/files/download/limited-uuid")
        second = await http_client.get("/files/download/limited-uuid")
    assert first.status_code == 200
    assert second.status_code == 403

@pytest.mark.anyio
async def test_expired_file(client):
    http_client, database = client
    await database.files.insert_one({
        "uuid": "expired-uuid",
        "filename": "expired.txt",
        "object_key": "expired-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": None,
        "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1),
        "max_downloads": None,
        "download_count": 0,
    })
    with patch("routes.files.delete_object", new=AsyncMock()):
        response = await http_client.get("/files/expired-uuid")
    assert response.status_code == 404
    assert await database.files.find_one({"uuid": "expired-uuid"}) is None

@pytest.mark.anyio
async def test_download_limit_sets_cleanup_grace(client):
    http_client, database = client
    await database.files.insert_one({
        "uuid": "grace-uuid",
        "filename": "grace.txt",
        "object_key": "grace-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": None,
        "expires_at": None,
        "max_downloads": 1,
        "download_count": 0,
    })
    with patch("routes.files.get_object_stream", new=_mock_stream()):
        response = await http_client.get("/files/download/grace-uuid")
    assert response.status_code == 200
    document = await database.files.find_one({"uuid": "grace-uuid"})
    assert document["download_count"] == 1
    assert document["cleanup_after"] is not None

@pytest.mark.anyio
async def test_cleanup_expired_file(client):
    _, database = client
    await database.files.insert_one({
        "uuid": "cleanup-uuid",
        "filename": "cleanup.txt",
        "object_key": "cleanup-object",
        "size": 1024,
        "created_at": datetime.now(timezone.utc),
        "password_hash": None,
        "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1),
        "max_downloads": None,
        "download_count": 0,
    })
    with patch("cleanup.get_database", return_value=database):
        with patch("cleanup.delete_object", new=AsyncMock()) as delete_object:
            from cleanup import cleanup_expired_files
            deleted_count = await cleanup_expired_files()
    assert deleted_count == 1
    delete_object.assert_awaited_once_with("cleanup-object")
    assert await database.files.find_one({"uuid": "cleanup-uuid"}) is None

@pytest.mark.anyio
async def test_upload_without_file(client):
    http_client, _ = client
    response = await http_client.post("/api/files")
    assert response.status_code == 422

@pytest.mark.anyio
async def test_upload_rejects_invalid_expiration(client):
    http_client, _ = client
    response = await http_client.post(
        "/api/files",
        files={"myFile": ("test.txt", BytesIO(b"Test file"), "text/plain")},
        data={"expires_in": "0"},
    )
    assert response.status_code == 422

@pytest.mark.anyio
async def test_upload_rejects_expiration_over_30_days(client):
    http_client, _ = client
    response = await http_client.post(
        "/api/files",
        files={"myFile": ("test.txt", BytesIO(b"Test file"), "text/plain")},
        data={"expires_in": str(60 * 24 * 30 + 1)},
    )
    assert response.status_code == 422

@pytest.mark.anyio
async def test_upload_rejects_invalid_download_limit(client):
    http_client, _ = client
    response = await http_client.post(
        "/api/files",
        files={"myFile": ("test.txt", BytesIO(b"Test file"), "text/plain")},
        data={"max_downloads": "0"},
    )
    assert response.status_code == 422
