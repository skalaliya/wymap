# Wymap Logistics Kiosk MVP (Phase 1)

Minimal scaffolding for the logistics kiosk system.

## Prerequisites

- Node.js 18+ (recommend 20+)
- pnpm

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Run the initial database migration and seed data:

   ```bash
   pnpm prisma migrate dev --name init
   pnpm prisma db seed
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

Open http://localhost:3000 in your browser.

## Environment variables

The following variables are expected:

- `DATABASE_URL` (required) — use `file:./dev.db` for local development.
- `SITE_ID` (required) — provided by the environment.
- `DEVICE_ID` (required) — provided by the environment.

## Notes

- This phase only scaffolds the app and database schema.
- UI and authentication are intentionally omitted.
