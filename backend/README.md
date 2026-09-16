# SourceCraft Repo Health Backend

NestJS backend for collecting SourceCraft repository data, calculating an explainable Repo Health Score, generating recommendations, and serving the public ranking.

## Requirements

- Node.js 22+
- pnpm
- Docker Desktop

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and Redis from the repository root:

   ```bash
   docker compose up -d postgres redis
   ```

3. Install dependencies and prepare Prisma:

   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

4. Run the API:

   ```bash
   pnpm start:dev
   ```

The API is available at `http://localhost:3000/api`, Swagger at `http://localhost:3000/docs`, and the health endpoint at `http://localhost:3000/api/health`.

## Planned modules

- Yandex ID authentication
- SourceCraft API and CLI integration
- Repository data collection
- Metrics and Repo Health Score
- Recommendations and potential score
- Public repository ranking
- Background analysis jobs
- Markdown and PDF reports
