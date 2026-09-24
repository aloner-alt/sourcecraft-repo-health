# Integration audit: main + frontend

## Branch

- Base: `origin/main` at `c2ac35a`.
- Integration branch: `integration/main-frontend-v2`.
- Frontend branch used for comparison: `origin/frontend`.

## Merge policy applied

Preserved from `main` without content changes:

- `frontend/Dockerfile`;
- `frontend/lib/api.ts`;
- `frontend/lib/client-api.ts`;
- `frontend/app/auth/callback/page.tsx`;
- `frontend/components/auth-status.tsx`;
- `frontend/components/my-repositories-workspace.tsx`;
- `frontend/components/ranking-client.tsx`;
- backend analysis queue/runner, SourceCraft client, reports, and Yandex ID integration.

Transferred from `frontend`:

- refreshed global and dashboard styling;
- animated icon components and cursor;
- visual assets;
- API-backed shell integration in the layout and navigation;
- methodology v2 scoring validation and category-capped Potential Score;
- Security `NO_DATA` behavior without a confirmed AppSec result;
- methodology v2 documentation and migration.

Demo-only frontend routes and preview data were not copied into the integration branch. The active screens continue to call the existing API client.

## Verification

Backend:

- Prisma generate: passed.
- Prisma validate: passed.
- Jest: 20 suites, 64 tests passed.
- Nest build: passed.

Frontend:

- Next production build: passed.
- TypeScript: passed.
- ESLint: passed.
- Routes are API-backed: `/`, `/ranking`, `/repositories/[slug]`, `/analyses/[analysisId]`, `/my-repositories`, `/auth/callback`.

Protected-file comparison:

```text
git diff origin/main..HEAD -- frontend/Dockerfile frontend/lib/api.ts frontend/lib/client-api.ts frontend/app/auth/callback/page.tsx frontend/components/auth-status.tsx frontend/components/my-repositories-workspace.tsx frontend/components/ranking-client.tsx
```

Result: no differences.

## Full scenario status

The code-level scenario is verified through tests and production builds. Docker Compose and a live SourceCraft repository require the local Docker daemon, a valid `SOURCECRAFT_TOKEN`, database/Redis services, and Yandex credentials for the private-repository path. Those external credentials/services were not present in this environment, so a live end-to-end analysis and report download remain pending.

## Remaining TЗ gaps

1. Confirmed SourceCraft AppSec/SAST/SCA result endpoint and real findings.
2. Git history endpoints for meaningful commits, active days, contributors, MR and releases.
3. Raw file-content endpoint for README sections and TODO/FIXME age.
4. Explicit issue-tracker availability flag to distinguish disabled issues from an empty response.
5. Docker Compose run against a live daemon.
6. Live public-repository analysis with a valid SourceCraft token.
7. Yandex ID callback verification with configured client credentials.
