# SourceCraft Repo Health Frontend

Next.js 16 interface for the real Repo Health API. Ranking, repository
dashboard, category evidence, recommendations, analysis status, score history,
Yandex ID workspace, badge and report downloads are backed by the NestJS
service rather than fixtures.

## Getting Started

From the repository root, run the complete stack:

```bash
docker compose -p repo-health up -d --build
```

Open [http://localhost:3001](http://localhost:3001). The backend API and Swagger
remain available on ports `3000` and `/docs` respectively.

For a standalone development server, copy `.env.example` to `.env.local` and
run `npm run dev -- --port 3001` while the backend is available on port 3000.

## Main routes

- `/ranking` — public repository ranking;
- `/repositories/[id]` — score, categories, evidence, recommendations and history;
- `/my-repositories` — authenticated import and analysis workspace;
- `/analyses/[id]` — live analysis progress and report downloads.
