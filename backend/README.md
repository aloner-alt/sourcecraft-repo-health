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

## Analysis flow

1. Sync a SourceCraft repository:

   ```http
   POST /api/repositories/sourcecraft/:organizationSlug/:repositorySlug/sync
   ```

2. Create an analysis:

   ```http
   POST /api/repositories/:repositoryId/analyses
   Content-Type: application/json

   {"trigger":"MANUAL"}
   ```

3. Run the currently available collectors:

   ```http
   POST /api/analyses/:analysisId/run
   ```

4. Read the score, metrics, and evidence:

   ```http
   GET /api/analyses/:analysisId
   ```

The documentation collector checks the repository tree for README, license,
contributing guide, and CODEOWNERS files. The issues collector measures the
resolution rate, freshness of open issues, and description coverage. The score
reports 30% data coverage when both categories contain data and 15% when the
issue tracker is empty.

The analysis also creates prioritized recommendations for missing baseline
documentation, stale issues, and incomplete issue descriptions. Each item has
an explainable expected score increase, and their combined effect is stored as
the analysis `potentialScore`.

## Next modules

- Yandex ID authentication
- Additional SourceCraft repository collectors
- Security, activity, CI/CD, issues, and code-health metrics
- Recommendations and potential score
- Public repository ranking
- Background analysis jobs
- Markdown and PDF reports
