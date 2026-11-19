import os
from io import BytesIO
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient

from main import app
from database import get_database


load_dotenv()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def mongo_database():
    mongo_url = os.environ["MONGODB_URL"]
    database_name = os.environ["MONGODB_DATABASE"]
    client = AsyncMongoClient(mongo_url)
    database = client.get_database(database_name)
    return client, database


@pytest.fixture
async def client(mongo_database):
    client, database = mongo_database
    await database.files.delete_many({})

    app.dependency_overrides[get_database] = lambda: database

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=False,
    ) as http_client:
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

    with patch(
        "routes.files.upload_object",
        new=AsyncMock(),
    ):
        response = await http_client.post(
            "/api/files",
            files={"myFile": ("test.txt", BytesIO(b"Test file content"), "text/plain")},
        )

    assert response.status_code == 200
    assert "localhost" in response.json()["file"]
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
    from argon2 import PasswordHasher

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

    response = await http_client.get(
        "/files/download/protected-uuid",
        headers={"X-File-Password": "wrong-password"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_password_header_allows_download(client):
    http_client, database = client
    from argon2 import PasswordHasher

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

    with patch(
        "routes.files.create_download_url",
        new=AsyncMock(return_value="https://example.invalid/download"),
    ):
        response = await http_client.get(
            "/files/download/protected-uuid",
            headers={"X-File-Password": "mysecretpass"},
        )

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.invalid/download"


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

    with patch(
        "routes.files.create_download_url",
        new=AsyncMock(return_value="https://example.invalid/download"),
    ):
        first = await http_client.get("/files/download/limited-uuid")
        second = await http_client.get("/files/download/limited-uuid")

    assert first.status_code == 307
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

    with patch(
        "routes.files.create_download_url",
        new=AsyncMock(return_value="https://example.invalid/download"),
    ):
        response = await http_client.get("/files/download/grace-uuid")

    assert response.status_code == 307
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
        with patch(
            "cleanup.delete_object",
            new=AsyncMock(),
        ) as delete_object:
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
