# SourceCraft Repo Health

Hackathon service for analyzing SourceCraft repositories and calculating an explainable Repo Health Score.

## Applications

- `backend/` - NestJS and TypeScript API, background analysis, scoring, recommendations, and reports.
- `frontend/` - React application (to be added by the frontend team).

## Current status

The repository contains an initial runnable NestJS backend, Prisma schema, and Docker Compose services for PostgreSQL and Redis.

## Quick start

```bash
cd backend
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev
```

Alternatively, `docker compose up --build` starts PostgreSQL, Redis, applies the
committed database migration, and launches the backend on port 3000.
