---
description: Wake up and refresh - project status check
---

# /start — Wymap project refresh

Goal: Re-orient instantly, verify repo health, and output a clear "what's next".

## 1) Read context first
// turbo
- Read `agent.md` fully.
- Summarise in **10 bullets**:
  - what the system does
  - what's non-negotiable
  - current architecture
  - current risks / known issues
  - next likely work items

## 2) Repo status snapshot
// turbo
Run:
- `git status`
- `git branch --show-current`
- `git log -10 --oneline`

Report:
- current branch
- uncommitted changes
- untracked files
- most recent commits relevant to current work

## 3) Environment sanity checks
// turbo
Run:
- `node -v`
- `pnpm -v`
- `ls -la .env* || true`

If `.env` missing:
- create from `.env.example` and explain which values are still required.

Validate required env keys exist:
- `DATABASE_URL`
- `AUTH_SECRET`

## 4) Install + Prisma (non-destructive by default)
// turbo
Run:
- `pnpm install`
- `pnpm prisma validate`
- `pnpm prisma generate`

Important:
- Do NOT run `migrate reset` automatically.
- If migrations are required, prefer:
  - `pnpm prisma migrate dev`
Only suggest reset if drift cannot be resolved and user agrees to wipe local data.

## 5) Quality gates (must pass)
// turbo-all
Run in this order:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

If any gate fails:
- fix it
- rerun the failing command
- summarise the exact fix and files changed

## 6) Run dev server if useful
// turbo
If the task involves UI/UX or flows:
```bash
pnpm dev
```
Confirm:
- http://localhost:3000
- kiosk: `/kiosk/ready`
- admin: `/admin/login`

## 7) Final output (always)
Return:
1) Current phase + what to do next (3 items max)
2) Quality gate results (pass/fail + evidence)
3) Any required follow-ups (migrations, env changes)
4) List of files changed (if any)
