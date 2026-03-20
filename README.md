# SendIt Cycles — Backend API

Node.js/Express REST API for **SendIt Cycles**. Supports two database backends: **SQLite** for zero-config local development and demos, or **PostgreSQL** for production deployments.

## What is SendIt Cycles?

SendIt Cycles is a full-stack mountain bike e-commerce platform. This API provides endpoints for product browsing, user authentication, cart and order management, and an admin interface. Full API documentation is served via Swagger UI at `/api-docs` when the server is running.

## Tech Stack

- **Node.js 18** + **Express 4**
- **SQLite** (via `better-sqlite3`) — default, no setup required
- **PostgreSQL 15** (via `pg`) — for production
- **JWT** authentication with **bcrypt** password hashing
- **Swagger / OpenAPI** docs at `/api-docs`

---

## Running Locally

### Option 1 — SQLite (recommended for local dev, no database needed)

```bash
npm install

# Windows (PowerShell)
$env:USE_SQLITE="true"; $env:JWT_SECRET="local-dev-secret"; node src/index.js

# Linux / macOS
USE_SQLITE=true JWT_SECRET=local-dev-secret node src/index.js
```

The database file is created automatically at `./data/senditcycles.db` (or wherever `SQLITE_PATH` points). The schema and seed data are applied on first start.

### Option 2 — PostgreSQL

Start a PostgreSQL instance, then:

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

Create the schema manually before first start:

```bash
psql -U sendit -d senditcycles -f database/init-postgres.sql
```

### Using a .env file (either backend)

Create a `.env` file in the repo root:

```env
# --- SQLite mode ---
USE_SQLITE=true
SQLITE_PATH=./data/senditcycles.db
JWT_SECRET=local-dev-secret
PORT=5000

# --- PostgreSQL mode (replace above with these) ---
# USE_SQLITE=false
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=senditcycles
# DB_USER=sendit
# DB_PASSWORD=yourpassword
# JWT_SECRET=your-secret
# PORT=5000
```

Then:

```bash
node src/index.js
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `USE_SQLITE` | `false` | Set to `true` to use SQLite |
| `SQLITE_PATH` | `/data/senditcycles.db` | Path to SQLite database file |
| `DB_HOST` | — | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | — | PostgreSQL database name |
| `DB_USER` | — | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `JWT_SECRET` | — | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | `24h` | Token expiry |

---

## Default Accounts (seed data)

On first start with SQLite (or after running `init.sql` on PostgreSQL), the following accounts are created:

| Email | Password | Role |
|-------|----------|------|
| `admin@senditcycles.com` | `admin123` | admin |

---

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Get JWT token |
| `GET` | `/api/categories` | — | List categories |
| `GET` | `/api/products` | — | List all products |
| `GET` | `/api/products/:id` | — | Product detail |
| `POST` | `/api/orders` | User | Place order |
| `GET` | `/api/orders` | User | My orders |
| `GET` | `/api-docs` | — | Swagger UI |

Full documentation available at **http://localhost:5000/api-docs**.

---

## Docker

```bash
# SQLite (no external database needed)
docker build -t senditcycles-backend .
docker run -p 5000:5000 -e USE_SQLITE=true -e JWT_SECRET=secret \
  -v senditcycles_data:/data senditcycles-backend

# PostgreSQL
docker run -p 5000:5000 \
  -e USE_SQLITE=false \
  -e DB_HOST=your-db-host \
  -e DB_NAME=senditcycles \
  -e DB_USER=sendit \
  -e DB_PASSWORD=yourpassword \
  -e JWT_SECRET=your-secret \
  senditcycles-backend
```
