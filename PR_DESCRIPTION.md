# PR: fix: clean merge artefacts and restore green builds

## Summary

Resolves all duplicate code blocks caused by previous merge conflicts. Adds CI workflow to prevent future broken merges.

## What was broken

- **18 files** had duplicate code blocks from "Keep Both" conflict resolution
- Parsing errors: duplicate imports, duplicate `const`, duplicate components, duplicate JSX
- Build failed with Turbopack errors

## What was fixed

### Merge conflict cleanup (18 files)
- Admin pages: corrections, dashboard, devices, employees, layout, reports, sites, timesheets
- Client components: corrections-client, devices-client, employees-client, sites-client  
- API routes: corrections, devices, reports, sites
- Kiosk: terminal component, page

### CI infrastructure added
- `.github/workflows/ci.yml` - lint, typecheck, test, build on PRs to main
- `CONTRIBUTING.md` - merge hygiene checklist and conflict resolution guide

## Quality gates

| Gate | Status |
|------|--------|
| Lint | ✅ Pass |
| Type check | ✅ Pass |
| Tests | ✅ 3/3 Pass |
| Build | ✅ Pass |

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
```

## Commits

1. `d293bf8` - fix: resolve duplicate code from merge conflicts
2. `fefa828` - ci: add GitHub Actions workflow and contributing guidelines

## Files changed

20 files, +199 insertions, -1019 deletions
