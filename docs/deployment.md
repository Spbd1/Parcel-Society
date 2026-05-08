# Deployment

## Local Development

Install dependencies and run the development server:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The web app runs on <http://localhost:3000> by default.

## Docker Compose

Docker Compose starts PostgreSQL and the production Next.js web app:

```bash
docker compose up --build
```

PostgreSQL is exposed on port 5432 and the web app is exposed on port 3000.

## Production Placeholder

Production deployment guidance will be expanded after authentication, migrations, data export, and admin workflows are implemented. Production deployments should use managed secrets, persistent PostgreSQL storage, HTTPS, backups, and documented migration procedures.
