---
description: End-to-end browser verification for kiosk and admin flows
---

# /e2e — Wymap E2E Verification

Goal: Run a repeatable pre-flight checklist that catches dumb breakages before PR.
This workflow is now automated via Playwright and `pnpm test:e2e`.

---

## Phase 0: Confirm the app can run

// turbo
1. Check `.env` exists and has required vars (`DATABASE_URL`, `AUTH_SECRET`)
2. Run:
```bash
pnpm install
pnpm prisma validate
pnpm prisma generate
```

3. Start dev server if not running (Playwright runs this automatically):
```bash
pnpm dev
```

4. Wait for server to be ready, then verify:
```bash
curl -s http://localhost:3000/api/health | head -20
```
Expected: JSON with `status: "ok"`

---

## Phase 1: Kiosk Flow Tests (browser automation)

### 1.1 Ready screen
- Navigate to `http://localhost:3000/kiosk/ready`
- Expected:
  - ✅ Space dark theme visible
  - ✅ Large "Ready" or "Tap to Start" messaging
  - ✅ No console errors
  - ✅ Kiosk-friendly sizing (big touch targets)

### 1.2 Kiosk terminal
- Navigate to `http://localhost:3000/kiosk`
- Expected:
  - ✅ Token/badge entry input visible
  - ✅ Keypad or input method works
  - ✅ Handshake status is OK and not spamming (single request, retries only on failure)

### 1.3 Clock in flow (happy path)
- Enter valid employee token (e.g., from seed data)
- Submit CHECK_IN
- Expected:
  - ✅ Success feedback shown
  - ✅ Auto-reset to ready screen (or clear state)
  - ✅ "Last sync" or event count updates

### 1.4 Clock out flow
- Enter same employee token
- Submit CHECK_OUT
- Expected:
  - ✅ Success feedback
  - ✅ Auto-reset

### 1.5 Offline queue test (critical)
This is the big one. Test offline-first reliability:

1. Open DevTools → Network → set to **Offline**
2. Submit 2-3 punch events
3. Expected:
   - ✅ Events queue locally
   - ✅ UI shows "Queued: X" or similar indicator
   - ✅ No crash or freeze

4. Set network back to **Online**
5. Expected:
   - ✅ Auto-sync triggers
   - ✅ Queue count drops to 0
   - ✅ Events now visible server-side

6. Refresh page
7. Expected:
   - ✅ Stable, no duplicates
   - ✅ Previously synced events still present

### 1.6 Negative handshake validation
- POST `/api/kiosk/handshake` with an invalid device ID
- Expected:
  - ✅ 403 `device_site_mismatch`
  - ✅ No repeated request loop

---

## Phase 2: Admin Portal Flow Tests (browser automation)

### 2.1 Login
- Navigate to `http://localhost:3000/admin/login`
- Enter admin credentials (from `.env` or seed data)
- Expected:
  - ✅ Login succeeds
  - ✅ Redirected to dashboard

### 2.2 Dashboard
- Navigate to `http://localhost:3000/admin/dashboard`
- Expected:
  - ✅ Stats cards load
  - ✅ Recent activity visible
  - ✅ No console errors

### 2.3 Core pages load check
Visit each page and verify it loads without errors:

| Route | Check |
|-------|-------|
| `/admin/employees` | ✅ Table loads, search works |
| `/admin/sites` | ✅ Table loads |
| `/admin/devices` | ✅ Table loads, health status visible |
| `/admin/timesheets` | ✅ Table loads, date filter works |
| `/admin/corrections` | ✅ Table loads |
| `/admin/reports` | ✅ Page loads |

### 2.4 Employee CRUD flow
- Create new employee (if form exists)
- Edit existing employee
- Deactivate employee
- Expected:
  - ✅ Forms submit without error
  - ✅ Changes persist on refresh
  - ✅ Audit trail created (check AuditLog if possible)

### 2.5 Corrections workflow
- Navigate to `/admin/corrections`
- Create a correction request (if UI allows)
- Approve or reject a correction
- Expected:
  - ✅ Correction creates new record (not edit)
  - ✅ Approval workflow works
  - ✅ Original event preserved

### 2.6 Export test
- Navigate to `/admin/timesheets` or `/admin/reports`
- Click CSV export (if available)
- Expected:
  - ✅ File downloads
  - ✅ Contains expected data

---

## Phase 3: Database Sanity Check

// turbo
Run Prisma validation:
```bash
pnpm prisma validate
pnpm prisma db push --dry-run
```

Optional (if time permits):
```bash
pnpm prisma studio
```
- Verify ClockEvents are landing correctly
- Check for duplicates (there should be none)
- Verify Corrections reference original events

---

## Phase 4: Quality Gates

// turbo-all
Run all gates:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

All must pass before PR.

---

## Phase 5: Final Report

Output a summary in this format:

```
## E2E Verification Report — [DATE]

### ✅ Passed
- [ ] Kiosk ready screen loads
- [ ] Kiosk punch flow works
- [ ] Offline queue + sync works
- [ ] Admin login works
- [ ] Admin pages load (employees, sites, devices, timesheets, corrections, reports)
- [ ] Employee CRUD works
- [ ] Corrections workflow works
- [ ] Export works
- [ ] Quality gates pass

### ❌ Failed (if any)
- Issue: [description]
- Steps to reproduce: [exact steps]
- Expected: [what should happen]
- Actual: [what happened]

### ⚠️ Warnings / Observations
- [any edge cases, slow loads, minor UX issues]

### 🎯 Merge Readiness
- [ ] Ready to merge
- [ ] Needs fixes first (list blockers)
```

---

## Automated execution (Playwright)

Run the automated E2E suite (includes DB reset, migrate, seed):

```bash
pnpm test:e2e
```

The suite uses SQLite `e2e.db` and runs `prisma migrate reset --force` for determinism.
Playwright starts `pnpm dev` automatically with:

- `KIOSK_DEVICE_ID=device_alpha`
- `KIOSK_SITE_ID=site_hq`
- `AUTH_ADMIN_EMAIL=admin@wymap.local`
- `AUTH_ADMIN_PASSWORD=ChangeMe123!`

---

## Notes for agent execution

- Use `browser_subagent` for all browser interactions
- Capture screenshots at key checkpoints for evidence
- If a step fails, note the exact error and continue to the next step
- At the end, compile all results into the final report
