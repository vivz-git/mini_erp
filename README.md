# MiniERP

A modular Enterprise Resource Planning (ERP) learning application built from scratch to understand enterprise system architecture, data integrity, inventory management, order processing, and audit tracking.

## Technology Stack

- **Frontend**: React + TypeScript + Vite + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Docker container)
- **ORM**: Prisma ORM

## Architecture Overview

MiniERP is organized as a decoupled monorepo:

- `frontend/`: Single-page application containing UI views, dashboard layout, and API client.
- `backend/`: REST API exposing business logic, RBAC middleware, and transactional database services.
- `docker-compose.yml`: Local PostgreSQL container configuration.

## Getting Started (Milestone 1)

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (for PostgreSQL)

### 1. Start Database

```bash
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
