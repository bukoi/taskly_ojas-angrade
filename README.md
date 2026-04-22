# 🚀 Task Management & Admin Dashboard

A robust, full-stack Task Management application featuring a high-performance FastAPI backend, a modern React (Vite) frontend, and a comprehensive Administrative Dashboard for platform oversight.

---

## ✨ Features

- **Standard User Flow**: Create, search, filter, and track personal tasks with a premium UI.
- **Admin Dashboard**: 
    - **Global Feed**: Monitor all platform activity in real-time.
    - **User Management**: Inspect specific users, update roles, and soft-delete accounts.
    - **Direct Assignment**: Admins can assign tasks directly to any active user.
- **Security**: 
    - Cookie-based authentication with JWT.
    - **Token Versioning**: Instant session invalidation on role changes or password resets.
    - **Soft-Delete Integrity**: Deleted users and their data are filtered out system-wide.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy (PostgreSQL), Alembic (Migrations), Redis (Caching/Sessions).
- **Frontend**: React 18, Vite, Lucide Icons, Tailwind CSS (Glassmorphism & Premium Dark Mode).
- **Orchestration**: Docker & Docker Compose.

---

## 🚀 One-Command Setup

Run the entire stack (Database, Redis, Backend, Frontend) with a single command:

```bash
docker-compose up --build
```

*The application will be available at:*
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive API Docs**: `http://localhost:8000/docs`

---

## ⚙️ Manual Configuration

If you prefer to set up environment variables manually:

### 1. Backend Setup (`/BACKEND/.env`)
```env
DATABASE_URL=postgresql://postgres:test123@localhost:5432/app_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=1
```

### 2. Database Migrations
If you make changes to the models, apply them inside the container:
```bash
docker exec project-backend-1 alembic upgrade head
```

---

## 🔑 Administrative Access

To gain Administrative privileges:
1. Register a new user.
2. Use the special admin trigger password **`Ojas@108`** during registration to automatically receive Administrative privileges.
3. Access the **Manage Users** section via the sidebar.

---

## 📖 API Documentation

The backend features automatically generated documentation. Once the server is running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🐳 Docker Services

- **backend**: FastAPI service on port 8000.
- **frontend**: Vite dev server on port 5173.
- **db**: PostgreSQL 15 on port 5432.
- **redis**: Redis 7 on port 6379.
