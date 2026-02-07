# 🕐 Wymap Workforce

A modern workforce management system with **Kiosk Punch Terminals** and an **Admin Portal** for managing employees, sites, devices, timesheets, and more.

Built with **Next.js 16**, **Prisma**, **SQLite** (dev) / **PostgreSQL** (prod), and **Tailwind CSS**.

---

## 📑 Table of Contents

- [What Does This App Do?](#-what-does-this-app-do)
- [Quick Start (Local)](#-quick-start-local)
- [Local vs Vercel Setup](#-local-vs-vercel-setup)
- [Where Is the Data Stored?](#-where-is-the-data-stored)
- [Prisma Schema Strategy](#-prisma-schema-strategy)
- [Vercel + Neon Environment Variables](#-vercel--neon-environment-variables)
- [Demo Credentials & Sample Data](#-demo-credentials--sample-data)
- [How to Test It](#-how-to-test-it)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [CI Pipeline](#-ci-pipeline)
- [Scripts Reference](#-scripts-reference)

---

## 🎯 What Does This App Do?

### Kiosk Punch Terminal (`/kiosk`)

A touch-friendly interface for employees to clock in/out at work sites.

| Feature | Description |
|---------|-------------|
| **Punch In/Out** | Employees swipe their badge ID and select IN, OUT, BREAK START, or BREAK END |
| **Handshake** | When the kiosk loads, it performs a "handshake" with the server to verify the device is registered and fetch the employee cache |
| **Offline Support** | If the network is down, punches are saved to **IndexedDB** and automatically sync when connectivity returns |
| **Ready Screen** | `/kiosk/ready` shows a "Start Punch" button — useful for kiosk mode |

### Admin Portal (`/admin`)

A dashboard for managers and admins to oversee workforce operations.

| Page | Purpose |
|------|---------|
| **Dashboard** | Live stats: punches today, employees on-site, device status |
| **Employees** | Add, edit, activate/deactivate employees, rotate auth tokens |
| **Sites** | Manage work locations with timezone support |
| **Devices** | Register kiosk devices and assign them to sites |
| **Timesheets** | View all clock events, filter by date/employee/site |
| **Corrections** | Employees/admins can request timesheet corrections |
| **Reports** | Export data as CSV with date/site/employee filters |

---

## 🚀 Quick Start (Local)

### Prerequisites

- **Node.js 20+**
- **pnpm** (recommended) — `npm install -g pnpm`

### Step-by-step setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client (creates typed DB client)
pnpm prisma generate

# 3. Reset database and apply migrations (creates prisma/dev.db)
pnpm prisma migrate reset --force

# 4. Seed with demo data (500 employees, 2 sites, 2 devices)
pnpm prisma db seed

# 5. Start the dev server
pnpm dev
```

Then open:
- **Kiosk:** http://localhost:3000/kiosk
- **Admin:** http://localhost:3000/admin

### What each command does

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies from pnpm-lock.yaml |
| `pnpm prisma generate` | Generate the typed Prisma Client based on `prisma/schema.prisma` |
| `pnpm prisma migrate reset --force` | Drop the database, re-run all migrations, and run the seed script |
| `pnpm prisma db seed` | Run `prisma/seed.js` to populate demo data (only needed if you skipped reset) |
| `pnpm dev` | Start Next.js dev server on http://localhost:3000 |

---

## 🌐 Local vs Vercel Setup

### Local (SQLite)

- Uses `prisma/schema.prisma` with SQLite (`prisma/dev.db`).
- Preferred scripts:
  - `pnpm prisma generate`
  - `pnpm prisma migrate reset --force`
  - `pnpm prisma db seed`

### Vercel (Production / Preview)

- Uses `prisma/schema.postgres.prisma` and Neon Postgres.
- Vercel build runs `pnpm vercel-build` (generates Postgres client, pushes schema, seeds if empty, builds Next.js).
- **Do not** commit `.env.local` or `.vercel` outputs pulled by the CLI.

---

## 💾 Where Is the Data Stored?

### Server-side (Prisma + SQLite)

| Item | Location |
|------|----------|
| **Database file** | `prisma/dev.db` (SQLite, configured via `DATABASE_URL` in `.env`) |
| **Prisma schema** | `prisma/schema.prisma` |
| **Seed script** | `prisma/seed.js` |
| **Migrations** | `prisma/migrations/` |

To inspect the database:
```bash
pnpm prisma studio   # Opens a visual DB browser at http://localhost:5555
```

### Client-side (Kiosk Offline Data)

When the kiosk is offline, punches are queued in the browser's **IndexedDB**.

**To view IndexedDB:**
1. Open DevTools (F12)
2. Go to **Application** → **Storage** → **IndexedDB**
3. Look for the `wymap-offline` database

The queue syncs automatically when the device comes back online, or you can click **Sync Now**.

---

## 🧬 Prisma Schema Strategy

- `prisma/schema.prisma` → SQLite (local dev + tests).
- `prisma/schema.postgres.prisma` → Postgres (Vercel / production).
- Use:
  - `pnpm prisma:migrate:sqlite` for local migrations.
  - `pnpm prisma:migrate:postgres` for Postgres migrations.
  - `pnpm vercel-build` for Vercel deploys (db push + seed-if-empty).

---

## 🔐 Vercel + Neon Environment Variables

Required for production-like environments:

- `DATABASE_URL`
- `AUTH_SECRET`

Recommended:

- `DATABASE_URL_UNPOOLED` (Neon pooling)
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`
- `KIOSK_SITE_ID`
- `KIOSK_DEVICE_ID`

---

## 🔑 Demo Credentials & Sample Data

### Admin Login

| Field | Value |
|-------|-------|
| **Email** | `admin@wymap.local` |
| **Password** | `ChangeMe123!` |

> These defaults come from `.env` or `prisma/seed.js`. Override with `AUTH_ADMIN_EMAIL` and `AUTH_ADMIN_PASSWORD`.

### Seeded Devices

| Device ID | Name | Site |
|-----------|------|------|
| `device_alpha` | Kiosk Alpha | `site_hq` (HQ - Space Dock) |
| `device_beta` | Kiosk Beta | `site_west` (Launch Pad West) |

### Seeded Employees

The seed generates **500 employees** with realistic Aussie-ish names.

| Badge ID Range | Status |
|----------------|--------|
| `BADGE-1001` to `BADGE-1500` | Mixed |
| Every 20th badge (1020, 1040, 1060...) | **INACTIVE** |
| All others | **ACTIVE** |

**Quick test badges:**
- ✅ `BADGE-1001` — Liam Smith (Active)
- ✅ `BADGE-1050` — Kai Smith (Active)
- ❌ `BADGE-1020` — Elijah Smith (Inactive — tests rejection flow)

---

## 🧪 How to Test It

### Manual Testing

#### Kiosk Flow
1. Go to http://localhost:3000/kiosk
2. Verify status badges show: **HANDSHAKE OK**, **ONLINE**, **READY**
3. Enter `BADGE-1001`, select **IN**, click **SUBMIT PUNCH**
4. Confirm success message: "Liam Smith • IN saved"
5. Try `BADGE-1020` — should show "Employee not found" (inactive)

#### Offline Queue
1. Open DevTools → Network → check **Offline**
2. Submit a punch with `BADGE-1002`
3. Confirm "Saved offline" and queue count = 1
4. Uncheck Offline, click **Sync Now**
5. Queue should drain to 0

#### Admin Verification
1. Go to http://localhost:3000/admin, login
2. Check Dashboard shows today's punch
3. Browse Employees, Sites, Devices, Timesheets

### Automated Testing

```bash
# Lint (ESLint)
pnpm lint

# Type check (TypeScript)
pnpm typecheck

# Unit tests (Vitest)
pnpm test

# Production build
pnpm build

# End-to-end tests (Playwright)
pnpm test:e2e
```

---

## 🔧 Troubleshooting

### "Handshake failed, Device not registered"

**Cause:** The kiosk is sending `device_alpha` + `site_hq`, but those don't exist in your database.

**Fix:** Re-seed the database:
```bash
pnpm prisma migrate reset --force
```

Verify devices exist:
```bash
sqlite3 prisma/dev.db "SELECT id, siteId FROM Device;"
# Should show: device_alpha|site_hq
```

### `pnpm prisma db seed` does nothing

**Cause:** Missing `prisma.seed` config in `package.json`.

**Fix:** Ensure `package.json` contains:
```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

### Port 3000 already in use

**Fix:** Kill the existing process:
```bash
lsof -ti:3000 | xargs kill -9
pnpm dev
```

Or run on a different port:
```bash
pnpm dev --port 3001
```

### Turbopack panic / cache corruption

**Fix:** Clear build caches, then restart:
```bash
rm -rf .next node_modules/.cache
pnpm dev
```

### Playwright e2e server mode

**Note:** `pnpm test:e2e` runs `pnpm start` (production server) for stability. If dev mode flakes, prefer `pnpm dev:stable` for manual testing.

### Hydration mismatch errors

**Cause:** Server and client HTML don't match (often time-based rendering).

**Fix:** Wrap time-sensitive UI in `useEffect` or use `suppressHydrationWarning` on the element.

---

## 📁 Project Structure

```
wymap/
├── app/                    # Next.js App Router pages & API routes
│   ├── admin/              # Admin portal (login, dashboard, employees, etc.)
│   ├── api/                # API endpoints (kiosk, admin, auth)
│   └── kiosk/              # Kiosk punch terminal
├── components/             # Shared React components
├── lib/                    # Utilities, Prisma client, auth, validation
├── prisma/
│   ├── schema.prisma       # Database schema (SQLite)
│   ├── schema.postgres.prisma  # Alternative Postgres schema
│   ├── seed.js             # Demo data seeder
│   └── migrations/         # Database migrations
├── e2e/                    # Playwright E2E tests
├── tests/                  # Vitest unit tests
├── .github/workflows/      # CI pipeline
└── .env                    # Environment variables (not committed)
```

---

## 🔄 CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main` and `integrate/**` branches.

| Step | Purpose |
|------|---------|
| **Frozen lockfile** | `pnpm install --frozen-lockfile` ensures reproducible builds |
| **CSS corruption check** | Detects accidental script injection in `globals.css` |
| **Prisma generate** | Creates typed client |
| **Lint** | ESLint checks |
| **Type check** | TypeScript validation |
| **Unit tests** | Vitest test suite |
| **Build** | Production build verification |
| **E2E tests** | Playwright browser tests |

**Concurrency:** If a new commit is pushed while CI is running, the old run is cancelled (`cancel-in-progress: true`).

---

## 📜 Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Create production build |
| `start` | `next start` | Run production server |
| `lint` | `eslint` | Run ESLint |
| `typecheck` | `prisma generate && tsc --noEmit` | Type check |
| `test` | `vitest run` | Run unit tests |
| `test:e2e` | `playwright test` | Run E2E tests |
| `prisma:seed` | `node prisma/seed.js` | Seed database |
| `prisma:validate` | `prisma validate` | Validate schemas |

---

## 📄 License

MIT

---

Made with ☕ in Australia
