---
name: devops-audit
description: Audits CI/CD, deployment, infrastructure, and operational readiness. Use when the user requests a DevOps audit, CI/CD review, deployment review, infrastructure review, or operational readiness check.
---

# DevOps Audit

**Recommended agent:** generalPurpose (fast model). DevOps audits are mostly config review and gap analysis — less deep reasoning needed. The fast model handles YAML/JSON config parsing, gap identification, and checklist-style reporting well. Pair with Convex MCP for live deployment checks.

## Process

### Step 1 — Scope

Default scope: whole repo. Key areas: `.github/`, `Dockerfile`, `docker-compose`, `convex/`, `package.json` scripts, `next.config.js`.

### Step 2 — Config scan (explore subagent, thoroughness "quick")

Launch explore to find:
- CI/CD: `.github/workflows/`, `.circleci/`, `Jenkinsfile`, any pipeline config
- Docker: `Dockerfile`, `docker-compose.yml`
- Infrastructure: `terraform/`, `pulumi/`, `cdk/`, `infra/`
- Build scripts: `package.json` scripts section
- Environment config: `.env*`, `convex/` env files

### Step 3 — Convex MCP checks

Use these MCP tools:
- `status` → verify deployment exists, check dev vs prod parity
- `envList` → verify required env vars are set (OPENAI_API_KEY, auth secrets)
- `logs` → sample recent logs for errors or warnings
- `tables` → verify schema matches expected state

### Step 4 — Build & deploy review

- `package.json` scripts: `dev`, `build`, `start`, `lint` — are they complete?
- Is `concurrently` the right approach for dev? Does build handle Convex + Next.js?
- Deployment target: Vercel for Next.js, Convex Cloud for backend
- Environment parity: does dev match prod config shape?

### Step 5 — Browser verification (optional, browser-use subagent)

If a deployed URL exists:
1. Navigate to it
2. Verify it loads without errors
3. Check that build output looks correct (no dev warnings in console)
4. Take a snapshot to confirm deployed state matches expectations

### Step 6 — Report

## Output Template

```markdown
# DevOps Audit — [Scope]

## Executive summary
[Deploy safety; main gaps; top recommendation.]

## CI/CD
- [ ] Pipeline exists (.github/workflows/ or equivalent)
- [ ] Build: reproducible, cached, fast feedback
- [ ] Tests: run in CI (if tests exist)
- [ ] Lint/format: enforced in CI; branch protection
- [ ] Secrets: CI secrets used, not hardcoded
- [ ] Convex deploy: automated via `npx convex deploy`

**Findings:** [file + issue + recommendation]

## Deployment & release
- [ ] Frontend: Vercel or equivalent; preview deploys on PR
- [ ] Backend: Convex Cloud; `npx convex deploy` in pipeline
- [ ] Rollback: path documented (Convex supports deployment history)
- [ ] Dev/prod parity: same env var shape; no prod secrets in dev

**Findings:** [file + issue + recommendation]

## Infrastructure & observability
- [ ] Convex dashboard: logs, function metrics available
- [ ] Error tracking: Sentry or equivalent configured
- [ ] Structured logging in Convex actions/mutations
- [ ] Alerting: on function failures or excursion detection failures

**Findings:** [file + issue + recommendation]

## Build & dev experience
- [ ] `npm run dev`: starts both Next.js and Convex dev
- [ ] `npm run build`: produces deployable artifact
- [ ] TypeScript: strict mode, no implicit any
- [ ] Lockfile: committed and up to date

**Findings:** [file + issue + recommendation]

## Recommendations (prioritized)
1. 🔴 Critical
2. 🟡 High
3. 🔵 Medium
4. ⚪ Low
```
