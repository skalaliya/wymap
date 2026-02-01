# Wymap Workforce Platform

Production-grade workplace time & attendance platform with a kiosk terminal and admin portal.

## Quickstart (SQLite)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create environment file:

   ```bash
   cp .env.example .env
   ```

3. Run migrations and seed data:

   ```bash
   pnpm prisma:migrate:sqlite
   pnpm prisma:seed
   ```

4. Start the dev server:

   ```bash
   pnpm dev
   ```

Open http://localhost:3000.

### Key routes

- Kiosk terminal: `/kiosk`
- Admin portal: `/admin`
- Health check: `/api/health`

## Postgres (production-like) development

1. Start Postgres via Docker:

   ```bash
   docker compose up -d
   ```

2. Update `POSTGRES_DATABASE_URL` in `.env`:

   ```bash
   POSTGRES_DATABASE_URL="postgresql://wymap:wymap_password@localhost:5432/wymap_dev"
   ```

3. Generate the Postgres client and run migrations:

   ```bash
   pnpm prisma:generate:postgres
   pnpm prisma:migrate:postgres
   pnpm prisma:seed
   ```

## Admin credentials (seeded)

Default admin user created by `pnpm prisma:seed`:

- Email: `admin@wymap.local`
- Password: `ChangeMe123!`

Override with `AUTH_ADMIN_EMAIL` and `AUTH_ADMIN_PASSWORD` in `.env`.

## Environment variables

Required:

- `DATABASE_URL` — SQLite or Postgres connection string.
- `AUTH_SECRET` — session signing secret.

Optional (recommended):

- `AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD` — seed admin credentials.
- `POSTGRES_DATABASE_URL` — Postgres connection string for the Postgres schema.
- `KIOSK_DEVICE_ID` / `KIOSK_SITE_ID` — kiosk device registration enforcement.
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` — API rate limiter tuning.
- `APP_VERSION` / `GIT_COMMIT` — surfaced in `/api/health`.

## Scripts

- `pnpm lint`
- `pnpm typecheck`
- `pnpm prisma:validate`
- `pnpm build`
- `pnpm test`

## Running tests

```bash
pnpm test
```

## Dependencies added

- `next-auth` for secure admin authentication and session handling.
- `bcryptjs` for password and token hashing (portable, no native deps).
- `zod` for strict runtime validation of env and API payloads.
- `idb` for kiosk offline queue storage (IndexedDB wrapper).
- `vitest` for unit/integration/RBAC testing.
