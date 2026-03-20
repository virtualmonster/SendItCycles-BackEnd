# SendIt Cycles — Backend API

Node.js/Express REST API for **SendIt Cycles**.

## Stop: Read This First

Most users should not clone/run this repo by itself.

Start with Infra first, then clone this repo into the exact folder expected by Docker Compose.

- Infra repo: https://github.com/virtualmonster/SendItCycles-Infra

Required local layout:

```text
C:\SendItCycles\infra\
  client\   <- SendItCycles-FrontEnd
  server\   <- this repository (SendItCycles-BackEnd)
```

### Fast Setup (PowerShell)

```powershell
mkdir C:\SendItCycles
cd C:\SendItCycles

git clone https://github.com/virtualmonster/SendItCycles-Infra.git infra
cd infra
git clone https://github.com/virtualmonster/SendItCycles-FrontEnd.git client
git clone https://github.com/virtualmonster/SendItCycles-BackEnd.git server

# Start app (SQLite default)
docker compose up --build
```

---

## Start Here (Recommended)

Use the Infra repo to start the full app (frontend + backend + database):

- Infra quick start: `README.md`

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
$env:USE_SQLITE="true"; node src/index.js

# Linux / macOS
USE_SQLITE=true node src/index.js
```

### PostgreSQL mode

```bash
npm install

# Windows (PowerShell)
$env:USE_SQLITE="false"
$env:DB_HOST="localhost"; $env:DB_PORT="5432"
$env:DB_NAME="senditcycles"; $env:DB_USER="sendit"; $env:DB_PASSWORD="yourpassword"
node src/index.js

# Linux / macOS
USE_SQLITE=false DB_HOST=localhost DB_PORT=5432 DB_NAME=senditcycles \
  DB_USER=sendit DB_PASSWORD=yourpassword node src/index.js
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
