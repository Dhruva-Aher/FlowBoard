📌 FlowBoard

A production-grade full-stack collaborative workspace platform for teams to manage projects, tasks, and documents in real time.

🚀 Overview

FlowBoard is a multi-tenant SaaS-style application that enables teams to:

create workspaces and manage members
organize projects with Kanban boards
collaborate through real-time updates
write and edit rich-text documents

The system is designed with a modern full-stack architecture using FastAPI, React, PostgreSQL, and Redis, with real-time synchronization and background processing.

✨ Features
🔐 Authentication & Authorization
JWT-based authentication with refresh tokens
Role-based access control (Owner / Admin / Member)
Secure multi-user workspace isolation
🏢 Workspaces & Projects
Multi-tenant workspace architecture
Project creation with default Kanban boards
Workspace member management and invitations
📋 Kanban Board
Drag-and-drop task management
Persistent task ordering and column structure
Real-time updates across multiple clients
📝 Documents
Rich-text editor powered by TipTap
Autosave with debounced updates
Structured JSON storage
Image embedding support
⚡ Real-Time Collaboration
WebSockets for live updates
Redis pub/sub for cross-client synchronization
Presence tracking across users
🔄 Background Processing
Celery workers with Redis broker
Async tasks for notifications and system events
🏗️ Tech Stack
Backend
FastAPI
Async SQLAlchemy
PostgreSQL
Redis
WebSockets
Celery
Frontend
React + TypeScript
Zustand (state management)
TanStack Query (data fetching + caching)
Tailwind CSS
TipTap (rich-text editor)
dnd-kit (drag-and-drop)
DevOps
Docker & Docker Compose
GitHub Actions (CI)
🧠 Architecture Highlights
Multi-tenant system design with workspace-level data isolation
RBAC enforcement across all workspace operations
Real-time event system using WebSockets + Redis pub/sub
Async backend design for scalable API handling
Structured document storage using ProseMirror JSON format
⚙️ Getting Started
1. Clone the repo
git clone https://github.com/Dhruva-Aher/flowboard.git
cd flowboard
2. Setup environment
cp .env.example .env
3. Run the app
docker compose up --build
🌐 Access
Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
🧪 Running Tests
cd backend
pytest
🛠️ Key Engineering Challenges Solved
Fixed API contract mismatches (JSON vs form-encoded auth flows)
Resolved database inconsistencies (table naming, datetime handling)
Debugged real-time connection issues across Docker networking
Implemented safe validation error handling to prevent 500 crashes
Designed consistent document schema for TipTap editor
📈 Future Improvements
File upload support for documents (S3 integration)
Notification system (in-app + email)
Advanced document collaboration (cursor presence, comments)
Production deployment with Kubernetes / cloud infra
👤 Author

Dhruva Aher

GitHub: https://github.com/Dhruva-Aher
LinkedIn: https://linkedin.com/in/dhruva-aher
