# Contributing to Wymap

## Quick Start

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

## Merge Hygiene Checklist

### 1. Always work via a branch, never straight on `main`

- ✅ `codex/<task-name>` or `feat/<task-name>`  
- ❌ Never commit directly to `main`

### 2. One PR = one theme of change

Keep PRs focused:
- ✅ "UI shell + components"
- ✅ "Kiosk offline queue"
- ❌ Avoid mega-PRs with UI + schema + kiosk + admin + ops

### 3. Rebase or merge `main` before starting new work

```bash
git checkout main && git pull
git checkout <your-branch>
git merge main  # or rebase
```

### 4. Never "Keep Both" blindly in conflicts

| Choice | What it does |
|--------|--------------|
| Keep current | Your branch wins |
| Keep incoming | Merged branch wins |
| Keep both | **Concatenates both** → often breaks |

**Rule:** If "keep both" creates duplicate imports/consts/components, it will break.

### 5. Quality gates before merging

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 6. Clean-room check for big PRs

```bash
rm -rf .next node_modules
pnpm install
pnpm prisma generate
pnpm test
pnpm build
```

### 7. Prefer squash merge for Codex PRs

Keeps history clean.

### 8. CI blocks broken merges

PRs require passing CI before merge.

## Conflict Quick Reference

1. **Auto-generated file?** (`pnpm-lock.yaml`) → Prefer Incoming, then `pnpm install`
2. **Code file?** → Never "Keep both". Pick one, manually merge.
3. **Your feature change?** → Keep Current
4. **Incoming bugfix needed?** → Keep Incoming, re-apply your bits
5. **Both added useful doc sections?** → Keep Both, then tidy
6. **Unsure after 10s?** → Manual merge
