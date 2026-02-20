---
name: security-audit
description: Performs security-focused audits of code and configuration. Use when the user requests a security audit, security review, vulnerability assessment, or when reviewing auth, secrets, inputs, or dependencies for security.
---

# Security Audit

**Recommended agent:** generalPurpose (default model). Security requires careful reasoning about attack surfaces, auth flows, and data exposure. Pair with browser-use subagent to verify headers and HTTPS in production.

## Process

### Step 1 — Scope

Confirm: full app, auth only, API only, or single feature. Default to full app.

### Step 2 — Code scan (explore subagent, thoroughness "very thorough")

Launch explore to find:
- All files with `query`, `mutation`, `action` exports (public API surface)
- Auth-related: `convex/auth.ts`, `convex/auth.config.ts`, middleware
- Environment variables: `.env*`, `convex/` env usage
- Input handling: any raw concatenation, `dangerouslySetInnerHTML`, eval

### Step 3 — Convex MCP checks

Use these MCP tools:
- `status` → get deployment selector
- `functionSpec` → list ALL public functions; verify sensitive ones are `internal`
- `envList` → check what env vars exist; flag any that look like secrets without the CONVEX_ prefix
- `tables` → review table access patterns and indexes

### Step 4 — Auth deep dive

Review the full auth chain:
- `@convex-dev/auth` config in `convex/auth.config.ts`
- Session handling and token lifecycle
- Role checks: Admin / Supervisor / Viewer — are they enforced on every mutation?
- `convex/http.ts` — are HTTP endpoints protected?

### Step 5 — Browser testing (browser-use subagent)

Launch a `browser-use` subagent to:
1. Navigate to the deployed app URL
2. Check response headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)
3. Verify HTTPS redirect
4. Attempt accessing protected routes without auth — does it redirect?
5. Check that error pages don't leak stack traces or internals
6. Take snapshots of login/register forms for CSRF and input validation

### Step 6 — Dependency check

Run `npm audit` via Shell to find known vulnerabilities. Check lockfile is committed.

### Step 7 — Report

## Output Template

```markdown
# Security Audit — [Scope]

## Executive summary
[Risk level: Critical/High/Medium/Low. Top 2–3 issues and one-line mitigation.]

## Authentication & authorization
- [ ] @convex-dev/auth: config reviewed; session lifecycle sound
- [ ] Role checks: Admin/Supervisor/Viewer enforced on every mutation
- [ ] Public vs internal: all sensitive Convex functions are `internal`
- [ ] HTTP endpoints in convex/http.ts: auth required where needed
- [ ] Login/register: rate limiting, brute-force protection

**Findings:** [file:line + issue + fix]

## Data & secrets
- [ ] No secrets in repo (.env committed? .gitignore correct?)
- [ ] Convex env vars: only expected vars present
- [ ] PII: user data handling, retention, access scoping
- [ ] Audit log: append-only integrity maintained

**Findings:** [file:line + issue + fix]

## Input validation & injection
- [ ] Convex validators on ALL function args and returns
- [ ] No raw HTML insertion (dangerouslySetInnerHTML)
- [ ] File upload validation (convex/ingestion/)
- [ ] AI prompt injection: user input → OpenAI — is it sanitized?

**Findings:** [file:line + issue + fix]

## Dependencies & supply chain
- [ ] Lockfile committed
- [ ] npm audit: 0 critical/high vulnerabilities
- [ ] No unused or high-risk packages

**Findings:** [package + issue + fix]

## Infrastructure & config (browser-verified)
- [ ] HTTPS only; redirects HTTP → HTTPS
- [ ] Secure headers: HSTS, CSP, X-Frame-Options
- [ ] CORS: Convex default; no overly permissive overrides
- [ ] Error pages: no stack traces or internals leaked
- [ ] Protected routes: redirect to login when unauthenticated

**Findings:** [URL + issue + fix]

## Recommendations (prioritized)
1. 🔴 Critical
2. 🟡 High
3. 🔵 Medium
4. ⚪ Low
```
