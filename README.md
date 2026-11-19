# 🚀 DropLink - Secure File Sharing

A modern, full-stack file sharing application with password protection, expiration controls, and QR code generation.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

![Backend CI](https://github.com/MridulTailor/filesharingapp/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/MridulTailor/filesharingapp/workflows/Frontend%20CI/badge.svg)

## ✨ Features

- 📤 **Drag & Drop Upload** - Intuitive file upload interface
- 🔒 **Password Protection** - Optional password encryption with Argon2
- ⏱️ **Auto-Expiration** - Files automatically delete after set time
- 📊 **Download Limits** - Control maximum download counts
- 📱 **QR Code Sharing** - Instant mobile sharing via QR codes
- 👁️ **File Preview** - In-browser preview for images and PDFs
- 🌓 **Dark/Light Mode** - Theme toggle with persistent preferences
- 🎨 **Modern UI** - Responsive design with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance async Python web framework
- **MongoDB** - Document database for file metadata
- **PyMongo** - Async MongoDB database driver
- **Cloudflare R2** - S3-compatible object storage for uploaded files
- **Pydantic** - Request and response validation
- **Argon2** - Secure password hashing
- **Passlib** - Password context management

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload component
- **QRCode.react** - QR code generation

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- uv

### Backend Setup
```bash
cd backend

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
uv sync

# Run development server
uv run uvicorn main:app --port 3001 --reload
```

API will be available at `http://localhost:3001`
- **Swagger Docs**: `http://localhost:3001/docs`
- **ReDoc**: `http://localhost:3001/redoc`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📚 API Documentation

Interactive API documentation is auto-generated and available at:
- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files` | Upload file with optional protection |
| `GET` | `/files/{uuid}` | Get file metadata |
| `GET` | `/files/download/{uuid}` | Download file |
| `GET` | `/files/preview/{uuid}` | Preview image/PDF |

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
uv run pytest
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
filesharingapp/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # MongoDB lifecycle
│   ├── models.py            # Pydantic response models
│   ├── storage.py           # Cloudflare R2 storage
│   ├── cleanup.py           # Expired-file cleanup
│   ├── routes/
│   │   └── files.py         # File endpoints
│   └── tests/               # Backend tests
└── frontend/
    ├── src/
    │   ├── pages/           # Page components
    │   ├── components/      # Reusable components
    │   ├── context/         # React contexts
    │   └── routes/          # Route definitions
    └── public/              # Static assets
```

## 🔐 Security Features

- **Argon2 Password Hashing** - Industry-standard password security
- **Password-Protected Downloads** - Optional file encryption
- **Auto-Expiration** - Files automatically deleted after timeout
- **Download Limits** - Restrict number of downloads per file
- **Input Validation** - Pydantic validation on API responses and inputs

## 🌍 Environment Variables

The backend requires configuration via environment variables. Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

**Required Variables:**
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

## Production deployment

Set these variables in your hosting platform's environment or secret settings.

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
