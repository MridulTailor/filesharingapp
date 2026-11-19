# DropLink - Secure File Sharing

[![Backend CI](https://github.com/MridulTailor/filesharingapp/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/MridulTailor/filesharingapp/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/MridulTailor/filesharingapp/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/MridulTailor/filesharingapp/actions/workflows/frontend-ci.yml)

A full-stack file sharing application with password protection, expiration controls, download limits, and QR code generation.

## Features

- **Drag & Drop Upload** - File upload interface with progress tracking
- **Password Protection** - Optional password hashing with Argon2
- **Auto-Expiration** - Files automatically delete after a set time
- **Download Limits** - Control maximum download counts per transfer
- **QR Code Sharing** - Mobile sharing via generated QR codes
- **File Preview** - In-browser preview for images and PDFs
- **Dark/Light Mode** - Theme toggle with persisted preferences

## Tech Stack

### Backend
- **FastAPI** - Async Python web framework
- **MongoDB / PyMongo** - Async document database for file metadata
- **Cloudflare R2** - S3-compatible object storage for uploaded files
- **Pydantic** - Request and response validation
- **Argon2** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload component
- **QRCode.react** - QR code generation

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- uv

### Backend Setup
```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn main:app --port 3001 --reload
```

API will be available at `http://localhost:3001` (`http://localhost:3001/docs` in development).

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files` | Upload file with optional protection |
| `GET` | `/files/{uuid}` | Get file metadata (hides filename when locked) |
| `GET` | `/files/download/{uuid}` | Stream file download |
| `GET` | `/files/preview/{uuid}` | Stream image/PDF preview |
| `GET` | `/health/live` | Liveness check |
| `GET` | `/health/ready` | Readiness check (MongoDB ping) |

## Testing

### Backend Tests
```bash
cd backend
uv run pytest
```

### Frontend Checks
```bash
cd frontend
npm run lint
npm run build
```

## Project Structure

```
filesharingapp/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # MongoDB lifecycle
│   ├── models.py            # Pydantic response models
│   ├── storage.py           # Cloudflare R2 storage
│   ├── ratelimit.py         # Rate limiter configuration
│   ├── cleanup.py           # Expired-file cleanup
│   ├── routes/
│   │   └── files.py         # File endpoints
│   └── tests/               # Backend tests
└── frontend/
    ├── src/
    │   ├── pages/           # Home page
    │   ├── components/      # Upload, download, navbar, background
    │   └── context/         # Theme context
    └── vercel.json          # SPA rewrite rules
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the required values:

- `MONGODB_URL` - MongoDB connection string
- `MONGODB_DATABASE` - MongoDB database name
- `APP_BASE_URL` - Base URL for the application (default: `http://localhost:3001`)
- `PORT` - Port for the backend server (default: `3001`)
- `R2_ENDPOINT` - Cloudflare R2 S3-compatible endpoint
- `R2_ACCESS_KEY_ID` - R2 API access key ID
- `R2_SECRET_ACCESS_KEY` - R2 API secret access key
- `R2_BUCKET` - R2 bucket name
- `R2_REGION` - R2 signing region (default: `auto`)
- `CORS_ORIGINS` - Allowed CORS origins (default: `http://localhost:5173`)

## Production Deployment

**Backend**

```env
ENVIRONMENT=production
MONGODB_URL=mongodb+srv://...
MONGODB_DATABASE=filesharing
APP_BASE_URL=https://api.example.com
PORT=3001
FORWARDED_ALLOW_IPS=*
CORS_ORIGINS=https://app.example.com
MAX_FILE_SIZE_MB=100
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_REGION=auto
```

Start the backend with:

```bash
uv --directory backend run --locked --no-dev uvicorn main:app --host 0.0.0.0 --port 3001 --proxy-headers --forwarded-allow-ips '*'
```

**Frontend**

```env
VITE_API_URL=https://api.example.com
```
