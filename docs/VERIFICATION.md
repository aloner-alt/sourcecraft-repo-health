# Verification record

Date: 2026-09-23

## Backend

Command:

```powershell
cd backend
pnpm exec prisma generate
.\node_modules\.bin\jest.CMD --runInBand
.\node_modules\.bin\nest.CMD build
```

Observed result:

- Jest: 20 suites passed, 64 tests passed.
- Nest build: exit status 0.

## Frontend

Command:

```powershell
cd frontend
npm install --no-audit --no-fund --cache .npm-cache
npm run build
npm run lint
```

Observed result:

- Next.js production build completed successfully.
- TypeScript compilation completed successfully.
- 7 application routes generated.
- ESLint completed successfully.

## Methodology verification

- Score aggregation uses only available categories.
- Security without real AppSec data is `NO_DATA` and does not affect the denominator.
- Score inputs are validated to `0..100`.
- Potential Score is capped by each category's remaining contribution.
- Existing analysis records retain their methodology version; new records default to `v2` after migration `20260923150000_methodology_v2`.

## Environment limitations

- Docker CLI is not installed in the execution environment, so `docker compose up` was not run.
- No live SourceCraft token was available, so real API collection against public repositories was not executed.
- AppSec/SAST/SCA results remain an external SourceCraft API dependency and are intentionally not simulated.
