# Security Audit — Full app

**Date:** 2025-02-18  
**Scope:** Full repo (Convex backend, Next.js app, auth, ingestion, AI, export)  
**Deployment checked:** Convex dev (`ownDev`)

---

## Executive summary

**Risk level: High.** The application has a solid auth foundation (@convex-dev/auth with Password provider and roles) but **almost no server-side enforcement**: the vast majority of Convex queries, mutations, and actions are public and do not check `auth.getUserId()` or role. An unauthenticated caller can list all users, export all audit logs, create companies and policies, upload and ingest data, and call AI actions (prompt injection and cost abuse). The frontend relies on client-side redirects; the Convex API is fully callable without being logged in. Dependency audit reports 15 vulnerabilities including **critical** Next.js issues. **Top mitigation:** Add auth and role checks to every Convex function that reads or mutates sensitive data, then run `npm audit fix` (or targeted upgrades) and re-test.

---

## Authentication & authorization

- [x] Auth method: @convex-dev/auth with Password provider; session/token lifecycle handled by Convex Auth
- [ ] **Role/permission checks:** Missing on almost all functions
- [ ] **Default-deny:** Public API is effectively default-allow
- [x] Logout/sign-out: Provided by auth store

**Findings:**

| Location | Issue | Fix |
|----------|--------|-----|
| `convex/users.ts` | `getCurrentUser` and `listUsers` are public and do not call `auth.getUserId()`. Any caller can fetch any user by ID or list all users (emails, names, roles). | In both handlers, call `const userId = await auth.getUserId(ctx); if (userId === null) throw new Error("Unauthorized");`. For `listUsers`, additionally require `role === "admin"` (fetch current user and check role). For `getCurrentUser`, allow only if `args.userId === userId` or current user is admin. |
| `convex/companies.ts` | `createCompany` is public with no auth. Anyone can create companies. | Require auth: `const userId = await auth.getUserId(ctx); if (userId === null) throw new Error("Unauthorized");` (and optionally restrict to admin or registration flow only). |
| `convex/policies/mutations.ts` | `createPolicy` and `updatePolicy` are public. Comment says "Admin only; enforce in UI or via auth" but there is no server-side check. | After `auth.getUserId(ctx)`, load current user, verify `user.role === "admin"`, else throw. |
| `convex/dashboard.ts` | All queries (`kpis`, `recentTemperatureReadings`, `recentExcursions`, `recentAuditLogs`, `aiInsightsList`, `mostRecentExcursionWithInsight`) return org-wide data with no auth. | Require `auth.getUserId(ctx)` and scope data by user's `companyId` (and optionally `facilityIds`) so users only see their tenant's data. |
| `convex/shipments.ts` | `listShipments` and `getShipmentDetail` are public; no auth or company scoping. | Require auth and filter by `companyId`/`facilityIds` from current user. |
| `convex/facilities.ts` | `listFacilities` is public. | Require auth and scope by current user's `companyId` (and optionally facilityIds). |
| `convex/ingestion/mutations.ts` | `generateUploadUrl` is public. Anyone can obtain an upload URL. | Require `auth.getUserId(ctx)` and optionally restrict to supervisor/admin. |
| `convex/ingestion/upload.ts` | `processUpload` is public. Anyone can trigger ingestion for any facility/policy. | Require auth; verify user has access to `args.facilityId` / policy (e.g. same company). |
| `convex/ingestion/mockApi.ts` | `ingestMockData` is public. Anyone can inject mock temperature data. | Require auth and role (e.g. admin/supervisor) and scope facility/policy to user's company. |
| `convex/export.ts` | `exportAuditLogsCSV` is public. Exports full audit log for any date range. | Require auth and admin role; optionally scope export by company/facility. |
| `convex/ai/chat.ts` | `sendMessage` is public. Unauthenticated users can call the AI and incur cost / prompt injection. | Require `auth.getUserId(ctx)` before calling OpenAI. |
| `convex/ai/analysis.ts` | `recommendPolicy` is public. User-controlled `recentExcursionSummary` is sent to OpenAI (prompt injection) and stores result in aiInsights. | Require auth (and ideally admin/supervisor); consider length/sanitization limits on `recentExcursionSummary`. |
| `app/middleware.ts` | Middleware does not verify Convex auth (tokens are client-side). Protection is "layout checks getMe and redirects." | Acceptable as defense-in-depth; **server-side Convex must enforce auth** so that even if someone bypasses the UI, they cannot call sensitive functions. |

---

## Data & secrets

- [x] .env and .env.local are in .gitignore
- [x] OPENAI_API_KEY is read only in Convex server code (`process.env.OPENAI_API_KEY` in actions)
- [x] CONVEX_SITE_URL used in auth config (Convex env)
- [x] NEXT_PUBLIC_CONVEX_URL is intentionally public for client
- [ ] Convex envList returned empty (variables may be hidden); ensure OPENAI_API_KEY and CONVEX_SITE_URL are set in Convex dashboard for dev/prod

**Findings:**

| Location | Issue | Fix |
|----------|--------|-----|
| `app/dashboard/layout.tsx` (line 94) | Reads `process.env.NEXT_PUBLIC_CONVEX_URL` for runtime check. | OK; this is the intended public URL. Ensure no other secrets use NEXT_PUBLIC_ in this project. |
| `convex/ai/analysis.ts`, `convex/ai/chat.ts` | If OPENAI_API_KEY is missing, actions return user-facing messages ("AI analysis unavailable", "contact support"). | OK; avoids leaking "no API key" as an internal error. Ensure key is set in Convex env for production. |

---

## Input validation & injection

- [x] Convex functions use validators (v.string(), v.id(), etc.) on args
- [x] No dangerouslySetInnerHTML or eval found in codebase
- [ ] User-controlled strings are sent to OpenAI without auth or strict limits

**Findings:**

| Location | Issue | Fix |
|----------|--------|-----|
| `convex/ai/chat.ts` | `args.message` and `args.history[].content` are sent to OpenAI. Unauthenticated callers can perform prompt injection and consume quota. | Require auth (see above). Optionally cap message length and rate-limit per user. |
| `convex/ai/analysis.ts` | `recommendPolicy(args.recentExcursionSummary)` sends user input to OpenAI and stores result. | Require auth; consider max length (e.g. 2000 chars) and rate limiting. |
| `convex/export.ts` (line 63) | CSV output uses `.replace(/"/g, '""')` for quoted fields — good for CSV injection. | No change needed for CSV escaping. |
| `convex/ingestion/parse.ts` | CSV/JSON parsing validates types and skips invalid rows. | Consider upper bounds on row count and line length to avoid DoS via huge uploads. |
| `convex/policies/mutations.ts` | `rules: v.any()` allows arbitrary JSON in policy rules. | Acceptable if rules are only used by trusted backend logic; ensure no rule content is rendered unsanitized in UI. If rules are ever rendered, validate/sanitize or use a stricter validator. |

---

## Dependencies & supply chain

- [x] Lockfile present (package-lock.json or equivalent)
- [ ] npm audit reports 15 vulnerabilities (3 low, 8 moderate, 3 high, 1 critical)

**Findings:**

| Package | Severity | Issue | Fix |
|---------|----------|--------|-----|
| next (0.9.9–15.5.9) | **Critical** | Multiple advisories: DoS (Server Actions), origin verification, cache key confusion, SSRF, content injection, auth bypass in middleware, DoS Server Components, etc. | Run `npm audit` and apply recommended fix. Audit suggests `next@14.2.35` may address some; verify compatibility with Next 14.2.x and upgrade. |
| glob (10.2.0–10.4.5) | High | Command injection via -c/--cmd (eslint-plugin-next dependency). | Upgrade eslint-config-next / Next when safe; or accept dev-only risk if glob is not used in production runtime. |
| cookie / @auth/core | Moderate | Cookie name/path/domain out-of-bounds characters (@convex-dev/auth). | Track @convex-dev/auth updates; fix may require upgrading auth package. |
| ajv (ReDoS) | Moderate | ESLint chain (dev dependency). | Upgrade ESLint/TypeScript ESLint when possible; lower priority for production runtime. |

**Recommendation:** Run `npm audit` and `npm audit fix`; for breaking changes, run `npm audit fix --force` only after testing. Prioritize upgrading Next.js to a patched version.

---

## Infrastructure & config (browser-verified)

- [ ] **Not verified in this run.** Deployed app URL was not exercised (no browser snapshot). Recommend: verify HTTPS, HSTS, CSP, X-Frame-Options, and that protected routes redirect to login when unauthenticated.

**Recommendations:**

1. In production, enforce HTTPS and security headers (e.g. in Next.js config or platform).
2. Ensure Convex deployment uses HTTPS (default).
3. Run a quick browser check: open app → inspect response headers; visit /dashboard without logging in and confirm redirect to login.

---

## Recommendations (prioritized)

1. **Critical — Add auth and role checks to all sensitive Convex functions.**  
   In every public query/mutation/action that reads or writes users, companies, facilities, policies, shipments, audit logs, or AI: call `auth.getUserId(ctx)` and throw if null; where needed, load user and enforce role (e.g. admin for listUsers, createPolicy, updatePolicy, exportAuditLogsCSV) and scope data by companyId/facilityIds. Start with: users.ts (getCurrentUser, listUsers), companies.ts (createCompany), policies/mutations.ts (createPolicy, updatePolicy), export.ts (exportAuditLogsCSV), ingestion (generateUploadUrl, processUpload, ingestMockData), ai/chat.ts (sendMessage), ai/analysis.ts (recommendPolicy), then dashboard, shipments, facilities.

2. **Critical — Upgrade Next.js and address npm audit.**  
   Run `npm audit` and apply fixes. Upgrade Next.js to a version that addresses the critical advisories (e.g. 14.2.35 or later patched release) and test the app.

3. **High — Scope dashboard and shipment data by tenant.**  
   Ensure dashboard and shipment queries filter by current user’s companyId (and facilityIds if applicable) so users cannot see other tenants’ data.

4. **High — Protect AI actions and export.**  
   Require auth for sendMessage, recommendPolicy, and exportAuditLogsCSV; add rate limiting and input length limits for AI to mitigate abuse and prompt injection.

5. **Medium — Harden ingestion.**  
   Require auth and company/facility scope for generateUploadUrl, processUpload, and ingestMockData; consider row count and size limits for uploads.

6. **Medium — Document and verify Convex env.**  
   Ensure OPENAI_API_KEY and CONVEX_SITE_URL are set in Convex dashboard for each deployment; document in runbook.

7. **Low — Security headers and browser verification.**  
   Add HSTS, CSP, and X-Frame-Options where applicable; run a one-time browser check for headers and auth redirects.

---

*Generated per the security-audit skill. Convex MCP (status, envList) was used; functionSpec returned empty. npm audit was run; browser testing was not performed this run.*
