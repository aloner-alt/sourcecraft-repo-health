# Environment configuration

Create a local file from the template in PowerShell:

```powershell
Copy-Item .env.example .env
```

Keep `.env` only on your computer. It is already ignored by Git. Do not send
tokens or client secrets to teammates in chat; each deployment should receive
them through its secret storage.

## Ready-to-use local values

The repository's `compose.yaml` creates PostgreSQL and Redis with the defaults
below, so these values do not need to be requested from an external service:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://repo_health:repo_health@localhost:5432/repo_health?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:3001
SOURCECRAFT_API_BASE_URL=https://api.sourcecraft.tech
SOURCECRAFT_CATALOG_MAX_PAGES=100
SCHEDULE_ENABLED=true
ANALYSIS_INTERVAL_HOURS=24
YANDEX_CALLBACK_URL=http://localhost:3000/api/auth/yandex/callback
```

Change `FRONTEND_URL` if the frontend runs on another origin. It must exactly
match the browser origin, including the protocol and port.

## AUTH_JWT_SECRET

Generate this value once per environment. From the `backend` directory run:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copy only the printed value after `AUTH_JWT_SECRET=` in `.env`. The validator
requires at least 32 characters and rejects the example placeholder.

## Yandex ID values

1. Open the Yandex OAuth application form:
   <https://oauth.yandex.ru/client/new/id/>.
2. Select an application for user authorization and the web-services platform.
3. Add this exact local redirect URI:
   `http://localhost:3000/api/auth/yandex/callback`.
4. Request only the profile fields the application uses: login, name, and
   email.
5. After saving, copy the displayed Client ID and Client secret into:

```dotenv
YANDEX_CLIENT_ID=your-client-id
YANDEX_CLIENT_SECRET=your-client-secret
```

For production, add the public HTTPS callback to the Yandex application and set
the same address as `YANDEX_CALLBACK_URL` on the server. Redirect URI protocol,
host, port, and path must match the registered value.

The backend can start without the two Yandex client values, but Yandex login is
then unavailable. If one is set, both are required.

## SOURCECRAFT_TOKEN

The SourceCraft REST API accepts a personal access token (PAT) in the Bearer
authorization header. In SourceCraft, open **Home → Access → Personal access
tokens**, click **Generate new token**, select only the required repositories
and read permissions, and copy the token immediately. SourceCraft does not show
the token value again. Put it only in the backend environment:

```dotenv
SOURCECRAFT_TOKEN=your-personal-access-token
```

The CLI command `src auth login` can authenticate the local SourceCraft CLI,
but the running backend still needs its own `SOURCECRAFT_TOKEN` environment
variable.

## SOURCECRAFT_CLI_PATH and AppSec

SourceCraft exposes AppSec findings through its current CLI. Install or update
the CLI, authenticate it with `src auth login`, and verify that the following
command is available:

```bash
src appsec defect list -R organization/repository --json
```

Then set the absolute executable path for the backend process, for example:

```dotenv
SOURCECRAFT_CLI_PATH=C:\Users\you\AppData\Local\Programs\src\src.exe
```

The CLI identity must have access to every analyzed repository. The supplied
Dockerfile installs a checksum-verified CLI `0.0.105`, and Compose sets its
container path automatically; the CLI reads `SOURCECRAFT_TOKEN` from the
backend environment. Do not put an access token in command-line arguments. Without this variable, Security is
`NO_DATA` and excluded from the score; the application never invents an AppSec
result from repository files. A custom container deployment must provide the
same CLI or leave the integration intentionally disabled.

## Final check

The completed `.env` has this shape:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://repo_health:repo_health@localhost:5432/repo_health?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:3001
AUTH_JWT_SECRET=<generated locally>
SOURCECRAFT_API_BASE_URL=https://api.sourcecraft.tech
SOURCECRAFT_TOKEN=<SourceCraft PAT>
SOURCECRAFT_CLI_PATH=<optional absolute path to recent src CLI>
SOURCECRAFT_CATALOG_MAX_PAGES=100
SCHEDULE_ENABLED=true
ANALYSIS_INTERVAL_HOURS=24
YANDEX_CLIENT_ID=<Yandex application Client ID>
YANDEX_CLIENT_SECRET=<Yandex application Client secret>
YANDEX_CALLBACK_URL=http://localhost:3000/api/auth/yandex/callback
```

Then start dependencies and the API:

```powershell
pnpm db:up
pnpm prisma:deploy
pnpm start:dev
```

Open `http://localhost:3000/api/health` for liveness and
`http://localhost:3000/api/health/ready` to check PostgreSQL and Redis.
`http://localhost:3000/api/health/config` shows whether SourceCraft and Yandex
credentials are configured, but never returns their values.
