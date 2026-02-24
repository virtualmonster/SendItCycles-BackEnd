# CycleShop Backend

Node.js REST API backend for the CycleShop e-commerce platform.

## Technology Stack
- Node.js 18
- Express
- SQLite / PostgreSQL
- JWT Authentication
- Swagger API Documentation

## Development

```bash
npm install
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `USE_SQLITE` - Use SQLite instead of PostgreSQL (default: false)
- `SQLITE_PATH` - Path to SQLite database file
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret

## Docker

```bash
docker build -t cycleshop-backend .
docker run -p 3001:3001 -e USE_SQLITE=true cycleshop-backend
```
