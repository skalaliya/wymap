# Wymap Workplace Time & Attendance Platform — Agent Notes

**Last updated:** 2026-02-02  
**Status:** Production-grade foundations + Kiosk + Admin portal in place  
**Theme:** Space Dark (brand colours must be preserved)

---

## 0) What this system is

A workplace time & attendance platform with:

- **Kiosk** (punch terminal) under `/kiosk` with offline-first queue + reliable sync
- **Admin portal** under `/admin` for workforce management, approvals, timesheets, reporting
- **APIs** under `/app/api` with validation, request IDs, rate limiting, audit logging
- **UI system** under `/components/ui` shared by admin + kiosk

This repo is designed to be shippable and maintainable, not a demo.

---

## 1) Non-negotiables (do not break these)

### Space Dark theme + brand colours
- `--violet-1` `#6D00FF`
- `--blue-1` `#3715E0`
- `--purple-1` `#7658E7`
- Background stays "space dark", high contrast, kiosk-friendly sizing

### Audit-grade integrity rules
- **Clock events are append-only** (no destructive edits)
- Corrections must create **new records** that reference originals + reason
- Admin mutations must be **audited** (who, what, before/after where applicable)

### Offline sync rules
- Offline punches are queued client-side with **idempotencyKey**
- Server enforces **idempotency** on `ClockEvent.idempotencyKey`
- Sync must be safe on retries (no duplicates)

---

## 2) Architecture overview

### Kiosk
- Routes live under `/kiosk`
- Ready/attract screen: `/kiosk/ready`
- Terminal: `/kiosk`
- Offline queue: IndexedDB
- Sync behaviour:
  - queue while offline
  - auto sync when online
  - show queued count + last sync
  - idle timeout returns to ready screen

### Admin portal
- Routes live under `/admin`
- Protected shell layout: `app/admin/(protected)/layout.tsx`
- Table pages follow URL search params for:
  - pagination
  - filters
  - sorting
  - shareable views

### APIs
- All API routes live under `app/api`
- Common behaviours:
  - request ID per request (also returned in headers)
  - rate limiting
  - input validation
  - audit logging for admin actions

---

## 3) Data model summary (Prisma)

Core entities:

- `User` (ADMIN, MANAGER, SUPERVISOR) for admin auth and audit actors
- `Employee` with status and identifiers (token/badge/PIN depending on setup)
- `Site` and `Device` to register workplaces + kiosks (+ health metadata)
- `ClockEvent` append-only with:
  - `type`
  - `occurredAt`
  - `source` (KIOSK/OFFLINE_SYNC/ADMIN)
  - `idempotencyKey` (unique)
  - `siteId`, `deviceId`
- `Correction` references original event(s), includes reason and approval workflow
- `AuditLog` records admin mutations with context (actor, entity, before/after if applicable)

Data integrity expectations:
- Never delete ClockEvent rows
- Prefer soft delete for Users/Employees if needed
- Corrections are traceable and reversible by additional correction records (not edits)

---

## 4) Environment variables

### Required
- `DATABASE_URL`
- `AUTH_SECRET`

### Recommended / Optional
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`
- `POSTGRES_DATABASE_URL` (for production-like dev)
- `KIOSK_DEVICE_ID`
- `KIOSK_SITE_ID`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `APP_VERSION`
- `GIT_COMMIT`

Notes:
- `.env.example` is the reference template
- Missing required vars should fail fast and clearly

---

## 5) Local dev workflows

### A) SQLite local dev (fastest)
```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

### B) Postgres production-like dev (recommended before merging big changes)

```bash
docker compose up -d
# set POSTGRES_DATABASE_URL in .env
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Prisma Studio:

```bash
pnpm prisma studio
```

---

## 6) How to test functionality quickly (human checks)

### Kiosk

* `/kiosk/ready` loads and looks kiosk-friendly
* `/kiosk` allows punch flow
* Offline mode (DevTools Network: Offline):
  * queue punches
  * queued count increases
  * back online triggers sync and clears queue

### Admin

* `/admin/login` works
* `/admin/dashboard` loads without console errors
* Key pages load:
  * employees, sites, devices, timesheets, corrections, reports
* Core flows:
  * create employee, deactivate employee
  * create site/device
  * view timesheets
  * create/approve/reject correction
  * export CSV

---

## 7) Quality gates (must pass before PR)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm prisma validate
```

---

## 8) Repo conventions

* Keep commits small and purposeful
* Avoid "keep both" merges in code files (it creates duplicate blocks and breaks builds)
* Prefer one clean implementation per file
* If there's conflict in docs, keep both then tidy into one coherent section

---

## 9) Common gotchas + fixes

### Build fails with ENOTEMPTY in `.next`

```bash
rm -rf .next
pnpm build
```

### Prisma drift / schema mismatch

If dev DB is old/out of sync, prefer:

```bash
pnpm prisma migrate dev
```

Only use reset if you're happy to wipe local dev data:

```bash
pnpm prisma migrate reset --force
```

### "Invalid environment configuration"

Check `.env` has `DATABASE_URL` and `AUTH_SECRET`.

---

## 10) What's next (typical roadmap)

* UX polish and consistency across admin tables (loading, empty states, bulk actions)
* Timesheets workflow improvements (exceptions, better totals, export formats)
* Kiosk improvements (scanner ergonomics, more visible device/site status)
* Reporting depth (filters + formats)
* Operational readiness (deployment scripts + monitoring hooks)
