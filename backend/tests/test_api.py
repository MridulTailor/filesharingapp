import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
import os
import tempfile
from io import BytesIO

from main import app
from database import get_session
from models import File as FileModel


# Test database setup
@pytest.fixture(name="session")
def session_fixture():
    """Create a fresh database for each test"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with test database"""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# Test 1: Health check / Root endpoint
def test_read_root(client: TestClient):
    """Test that the API is running"""
    response = client.get("/")
    assert response.status_code in [200, 404]  # May not have root endpoint


# Test 2: File upload without options
def test_upload_file_simple(client: TestClient):
    """Test basic file upload"""
    file_content = b"Test file content"
    files = {"myFile": ("test.txt", BytesIO(file_content), "text/plain")}
    
    response = client.post("/api/files", files=files)
    assert response.status_code == 200
    
    data = response.json()
    assert "file" in data
    assert "localhost" in data["file"]


# Test 3: File upload with password
def test_upload_file_with_password(client: TestClient):
    """Test file upload with password protection"""
    file_content = b"Secret file content"
    files = {"myFile": ("secret.txt", BytesIO(file_content), "text/plain")}
    data = {"password": "mysecretpass"}
    
    response = client.post("/api/files", files=files, data=data)
    assert response.status_code == 200
    
    result = response.json()
    assert "file" in result


# Test 4: File upload with expiration
def test_upload_file_with_expiration(client: TestClient):
    """Test file upload with expiration time"""
    file_content = b"Temporary file"
    files = {"myFile": ("temp.txt", BytesIO(file_content), "text/plain")}
    data = {"expires_in": "60"}  # 60 minutes
    
    response = client.post("/api/files", files=files, data=data)
    assert response.status_code == 200


# Test 5: File upload with download limit
def test_upload_file_with_max_downloads(client: TestClient):
    """Test file upload with download limit"""
    file_content = b"Limited downloads"
    files = {"myFile": ("limited.txt", BytesIO(file_content), "text/plain")}
    data = {"max_downloads": "5"}
    
    response = client.post("/api/files", files=files, data=data)
    assert response.status_code == 200


# Test 6: Get file metadata
def test_get_file_metadata(client: TestClient, session: Session):
    """Test retrieving file metadata"""
    # Create a test file in database
    test_file = FileModel(
        uuid="test-uuid-123",
        filename="test.txt",
        path="uploads/test.txt",
        size=1024,
    )
    session.add(test_file)
    session.commit()
    
    response = client.get("/files/test-uuid-123")
    assert response.status_code == 200
    
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["size"] == 1024
    assert "downloadLink" in data


# Test 7: Get non-existent file
def test_get_nonexistent_file(client: TestClient):
    """Test retrieving file that doesn't exist"""
    response = client.get("/files/nonexistent-uuid")
    assert response.status_code == 404


# Test 8: Download without password when required
def test_download_protected_file_without_password(client: TestClient, session: Session):
    """Test downloading password-protected file without password"""
    # Create a password-protected file
    test_file = FileModel(
        uuid="protected-uuid",
        filename="protected.txt",
        path="uploads/protected.txt",
        size=1024,
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$somehash"  # Dummy hash
    )
    session.add(test_file)
    session.commit()
    
    response = client.get("/files/download/protected-uuid")
    assert response.status_code == 401


# Test 9: File metadata shows protection status
def test_file_metadata_shows_protection(client: TestClient, session: Session):
    """Test that metadata indicates if file is password-protected"""
    test_file = FileModel(
        uuid="protected-meta-uuid",
        filename="protected.txt",
        path="uploads/protected.txt",
        size=2048,
        password_hash="$argon2id$v=19$m=65536,t=3,p=4$somehash"
    )
    session.add(test_file)
    session.commit()
    
    response = client.get("/files/protected-meta-uuid")
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_protected"] is True


# Test 10: Upload without file
def test_upload_without_file(client: TestClient):
    """Test upload endpoint without providing a file"""
    response = client.post("/api/files")
    assert response.status_code == 422  # Validation error
