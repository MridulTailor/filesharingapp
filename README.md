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
- **SQLModel** - SQL database ORM with Pydantic validation
- **SQLite** - Lightweight database for development
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
- Pipenv

### Backend Setup
```bash
cd backend

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
pipenv install

# Run development server
pipenv run uvicorn main:app --port 3001 --reload
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
pipenv run pytest
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
│   ├── database.py          # SQLModel configuration
│   ├── models.py            # Database models
│   ├── routes/
│   │   └── files.py         # File endpoints
│   ├── tests/               # Backend tests
│   └── uploads/             # File storage
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
- **Input Validation** - SQLModel/Pydantic validation on all inputs

## 🌍 Environment Variables

The backend requires configuration via environment variables. Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

**Required Variables:**
- `APP_BASE_URL` - Base URL for the application (default: `http://localhost:3001`)
- `PORT` - Port for the backend server (default: `3001`)

**Optional Variables:**
- `MONGO_CONNECTION_URL` - MongoDB connection string (if using MongoDB)
- `DATABASE_URL` - SQLite database path (default: `sqlite:///./database.db`)
- `UPLOAD_DIR` - Directory for uploaded files (default: `./uploads`)
- `MAX_FILE_SIZE_MB` - Maximum file size in MB (default: `100`)
- `CORS_ORIGINS` - Allowed CORS origins (default: `http://localhost:5173`)
