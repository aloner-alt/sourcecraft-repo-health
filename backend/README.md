# SourceCraft Repo Health Backend

NestJS backend for collecting SourceCraft repository data, calculating an explainable Repo Health Score, generating recommendations, and serving the public ranking.

## Requirements

- Node.js 22+
- pnpm
- Docker Desktop

## Local development

1. Copy `.env.example` to `.env` and fill it using
   [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md). The backend validates the
   configuration at startup and never needs secrets committed to Git.
2. Start PostgreSQL and Redis from the repository root:

   ```bash
   docker compose up -d postgres redis
   ```

3. Install dependencies and prepare Prisma:

   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm prisma:deploy
   ```

4. Run the API:

   ```bash
   pnpm start:dev
   ```

The API is available at `http://localhost:3000/api`, Swagger at
`http://localhost:3000/docs`, liveness at `http://localhost:3000/api/health`,
and database readiness at `http://localhost:3000/api/health/ready`.
The secret-safe configuration check is available at
`http://localhost:3000/api/health/config`.

For local schema development use `pnpm prisma:migrate`; committed migrations
are applied with `pnpm prisma:deploy`. Docker Compose applies them automatically
before starting the backend.

## Analysis flow

1. Sync a SourceCraft repository:

   ```http
   POST /api/repositories/sourcecraft/:organizationSlug/:repositorySlug/sync
   ```

2. Create and queue an analysis:

   ```http
   POST /api/repositories/:repositoryId/analyses
   Content-Type: application/json

   {"trigger":"MANUAL"}
   ```

The response contains the analysis ID and BullMQ job ID. A Redis worker runs
all collectors asynchronously. Jobs use three attempts with exponential
backoff. A temporary failure in one collector is stored as `COLLECTION_ERROR`
for that category instead of discarding the other results.

3. For local debugging only, run a queued analysis synchronously:

   ```http
   ```

4. Read the score, metrics, and evidence:

   ```http
   GET /api/analyses/:analysisId
   ```

For a complete local sync-and-analyze smoke test without a browser session:

```bash
pnpm analyze:repo <organization> <repository>
```

The command uses the configured SourceCraft token, queues the analysis through
BullMQ, waits up to five minutes, and prints a secret-free result summary.

## Frontend API

- `GET /api/repositories/:id` — dashboard repository and latest analysis
- `GET /api/repositories/:id/health` — latest score and category breakdown
- `GET /api/repositories/:id/metrics` — detailed metrics and evidence
- `GET /api/repositories/:id/recommendations` — prioritized improvement actions
- `GET /api/repositories/:id/history?limit=30` — chronological score history
- `GET /api/repositories/:id/badge.svg` — public README health badge
- `GET /api/ranking` — public ranking with the same filters as repositories
- `GET /api/analyses/:id/reports/report.md` — downloadable Markdown report
- `GET /api/analyses/:id/reports/report.pdf` — downloadable PDF report

## Authentication

Register a Yandex OAuth application and set `YANDEX_CLIENT_ID`,
`YANDEX_CLIENT_SECRET`, `YANDEX_CALLBACK_URL`, and a random 32+ character
`AUTH_JWT_SECRET`. The browser flow is:

1. `GET /api/auth/yandex/login`
2. Yandex redirects to `/api/auth/yandex/callback`
3. The backend stores its own seven-day JWT in an httpOnly cookie
4. `GET /api/auth/me` returns the current user; `POST /api/auth/logout` clears it

OAuth state is compared in constant time. Repository synchronization and
analysis mutations require the session cookie; reports, dashboards, and ranking
remain public.

The first import adds a public repository to the current user's workspace.
Only workspace members can start its manual analysis. Private/internal imports
are rejected until the deployment has a verifiable per-user SourceCraft account
link; the service PAT is never treated as proof of a user's access.

## Periodic analysis

`SOURCECRAFT_ORGANIZATIONS` is a comma-separated discovery scope. At startup,
BullMQ registers a repeatable sweep controlled by `SCHEDULE_ENABLED` and
`ANALYSIS_INTERVAL_HOURS`. Each sweep refreshes public repositories from the
configured organizations and queues repositories that do not already have an
active analysis.

The documentation collector checks the repository tree for README, license,
contributing guide, and CODEOWNERS files. The issues collector measures the
resolution rate, freshness of open issues, and description coverage. The score
reports 30% data coverage when both categories contain data and 15% when the
issue tracker is empty.

The analysis also creates prioritized recommendations for missing baseline
documentation, stale issues, and incomplete issue descriptions. Each item has
an explainable expected score increase, and their combined effect is stored as
the analysis `potentialScore`.

The activity collector uses the documented SourceCraft repository
`last_updated` timestamp. It deliberately measures only repository recency;
commit frequency and contributor activity remain unavailable until a verified
commit-history data source is connected.

The CI/CD collector uses SourceCraft run history to measure pipeline presence,
terminal-run success rate, and freshness of the latest successful run. When
reliability is low, the analysis recommends stabilizing the pipeline. With all
currently implemented categories available, data coverage is 60%.

The security category currently measures repository security hygiene only:
security policy, dependency manifest, lock file, and automated dependency
updates. It does not claim to detect vulnerabilities because the published
SourceCraft REST API does not expose AppSec findings. With this category,
maximum verified data coverage is 80%.

The code-health category detects automated tests, static-analysis configuration,
formatting rules, and typed-project configuration. Missing practices generate
prioritized recommendations. Documentation, security, and code-health collectors
share one paginated repository-tree request through a short-lived cache. The
implemented methodology now covers all six categories and can reach 100% data
coverage when SourceCraft returns issue data.

## Next modules

- SourceCraft webhooks for automatic re-analysis
- Persistent user/team roles beyond the current OAuth session
