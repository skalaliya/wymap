# Agent Notes

Last updated: 2025-02-14

## Architecture overview

- **Kiosk app** lives under `/kiosk` and is optimized for punch terminal workflows.
- **Admin portal** lives under `/admin` with role-protected routes for workforce management.
- **API routes** live under `/app/api`, use request IDs, rate limiting, validation, and audit logging.

## Data model summary

- `User` (ADMIN, MANAGER, SUPERVISOR) handles admin auth and audits.
- `Employee` stores status, badge ID, PIN/token hashes, and clock events.
- `Site` and `Device` register workplaces and kiosks with health metadata.
- `ClockEvent` is append-only with idempotency keys and source attribution.
- `Correction` references original + correction clock events with approval workflow.
- `AuditLog` records every admin mutation with before/after snapshots.

## Environment variables

Required:

- `DATABASE_URL`
- `AUTH_SECRET`

Recommended:

- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`
- `POSTGRES_DATABASE_URL`
- `KIOSK_DEVICE_ID`
- `KIOSK_SITE_ID`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `APP_VERSION`
- `GIT_COMMIT`

## Offline sync design (kiosk)

- Offline punches are queued in IndexedDB with `idempotencyKey`.
- When online, the kiosk syncs queued events and removes them after success.
- The server enforces idempotency on `ClockEvent.idempotencyKey`.

## Security design notes

- Auth uses `next-auth` Credentials provider with hashed passwords.
- RBAC guards all admin routes and API mutations.
- Admin mutations require CSRF tokens (`/api/csrf`) and are audit logged.
- API routes include IP-based rate limiting and request IDs.
- Clock events are append-only; corrections create new events referencing originals.
