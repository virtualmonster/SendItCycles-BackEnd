# SendIt Cycles — Backend API

Node.js/Express REST API for **SendIt Cycles**.

## Start Here (Recommended)

Most users should start the full app through the Infra repo, not by running this backend repo directly.

- Infra repo: https://github.com/virtualmonster/SendItCycles-Infra
- Infra quick start: `README.md`
- Infra deployment script: `scripts/deploy.sh`

SendIt Cycles is a 3-repo setup:

1. `SendItCycles-FrontEnd`
2. `SendItCycles-BackEnd` (this repo)
3. `SendItCycles-Infra` (entry point for Compose/scripts)

If you just want to run the platform, use Infra first.

## API Docs

When the stack is running, API docs are at:

- `http://localhost:5000/api-docs`

## Default Admin Account

Seeded account:

- Email: `admin@senditcycles.com`
- Password: `admin123`

## Local Backend-Only Dev (Optional)

Use this only when you are developing backend code in isolation.

### SQLite mode

```bash
npm install

# Windows (PowerShell)
$env:USE_SQLITE="true"; $env:JWT_SECRET="local-dev-secret"; node src/index.js

# Linux / macOS
USE_SQLITE=true JWT_SECRET=local-dev-secret node src/index.js
```

### PostgreSQL mode

```bash
npm install

# Windows (PowerShell)
$env:USE_SQLITE="false"
$env:DB_HOST="localhost"; $env:DB_PORT="5432"
$env:DB_NAME="senditcycles"; $env:DB_USER="sendit"; $env:DB_PASSWORD="yourpassword"
$env:JWT_SECRET="your-secret"
node src/index.js

# Linux / macOS
USE_SQLITE=false DB_HOST=localhost DB_PORT=5432 DB_NAME=senditcycles \
  DB_USER=sendit DB_PASSWORD=yourpassword JWT_SECRET=your-secret node src/index.js
```

Create schema/seed for PostgreSQL first:

```bash
psql -U sendit -d senditcycles -f database/init-postgres.sql
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `USE_SQLITE` | `false` | Set to `true` to use SQLite |
| `SQLITE_PATH` | `/data/senditcycles.db` | SQLite database file |
| `DB_HOST` | — | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | — | PostgreSQL database name |
| `DB_USER` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiry |
