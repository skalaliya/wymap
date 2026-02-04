# PR: test: add Playwright E2E harness + kiosk handshake backoff

## Summary

- add Playwright-based E2E coverage for kiosk/admin flows with deterministic SQLite setup
- add kiosk handshake dedupe/backoff + test IDs for stable E2E selectors
- tighten Vitest config to avoid running dependency tests
- extend CI to run Playwright E2E checks

## What changed

### Kiosk reliability
- add handshake dedupe/backoff + offline retry messaging
- add stable test IDs for handshake/queue/status UI

### Automated E2E
- add Playwright config + kiosk/admin flows + negative handshake test
- add deterministic `pnpm test:e2e` script using `e2e.db` and `prisma migrate reset`

### CI improvements
- run Playwright E2E after lint/typecheck/unit/build

## Quality gates

| Gate | Status |
|------|--------|
| Lint | ⏳ Not run |
| Type check | ⏳ Not run |
| Tests | ✅ Pass (`pnpm test`) |
| E2E | ⏳ Not run |
| Build | ⏳ Not run |

## How to test locally

```bash
# Clean-room verification
rm -rf .next node_modules
pnpm install
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Commits

1. fix(kiosk): add handshake dedupe and backoff
2. test: add Playwright E2E harness
3. docs(ci): add E2E workflow guidance

## Files changed

10 files, +301 insertions, -39 deletions
