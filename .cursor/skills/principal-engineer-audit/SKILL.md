---
name: principal-engineer-audit
description: Performs principal-engineer-level code and architecture audits. Use when the user requests a principal engineer audit, PE review, architecture review, technical excellence review, or code quality at staff/principal level.
---

# Principal Engineer Audit

**Recommended agent:** generalPurpose (default model). This audit requires deep multi-file reasoning, architecture analysis, and pattern recognition across the full codebase. The default model's strong reasoning is critical here. Do NOT use the fast model — it lacks depth for architecture analysis.

## Process

### Step 1 — Scope

Confirm scope: whole repo, package, or recent PR. Default to whole repo.

### Step 2 — Explore (use explore subagent)

Launch an `explore` subagent with thoroughness "very thorough" to map:
- Directory structure and module boundaries
- Key entrypoints (`app/`, `convex/`, `components/`)
- Dependency graph (imports between modules)
- Config files (`next.config.js`, `tailwind.config.ts`, `convex/schema.ts`)

### Step 3 — Deep review (main agent)

Review these areas using the checklist below, citing files/lines:

**Architecture & design**
- `convex/` domain structure: are schema, queries, mutations, and actions well-separated?
- `app/` routing: is the Next.js App Router layout clean? Shared layouts?
- `components/`: are UI primitives separated from feature components?
- Circular dependencies between `convex/`, `lib/`, `components/`?
- Data flow: Convex real-time queries → React → mutations back

**Code quality**
- Naming, typing (strict TS?), single responsibility per file
- Convex validators: all functions have arg + return validators?
- Shared types in `convex/lib/types.ts` — are they actually used consistently?
- Error handling in Convex actions vs mutations vs queries

**Engineering practices**
- Testing: is there any? (check for `__tests__`, `.test.`, `.spec.`)
- Observability: structured logs? Convex system logs?
- Security basics: public vs internal Convex functions correct?

### Step 4 — Convex-specific checks

Use the **Convex MCP tools** where available:
- `functionSpec` — verify public vs internal exposure matches intent
- `tables` — compare declared schema vs inferred schema for drift
- `status` — check deployment health

### Step 5 — Report

## Output Template

```markdown
# Principal Engineer Audit — [Scope]

## Executive summary
[2–3 sentences: overall health, top risk, top opportunity]

## Architecture & design
- [ ] Boundaries: clear module/domain boundaries, no circular deps
- [ ] Scalability: Convex data flow, real-time query patterns, bottlenecks
- [ ] Consistency: error handling, logging, API patterns applied consistently
- [ ] Tech debt: identified and prioritized
- [ ] Convex schema: declared matches inferred; indexes optimized

**Findings:** [file/area + recommendation]

## Code quality & maintainability
- [ ] Readability: naming, structure, single responsibility
- [ ] Type safety: strict TS; Convex validators on all functions
- [ ] Testability: seams exist; can test Convex handlers in isolation
- [ ] Dependencies: minimal, up-to-date, no unused packages

**Findings:** [file/area + recommendation]

## Engineering practices
- [ ] Error handling: Convex actions vs mutations; user-facing errors
- [ ] Observability: logs, Convex dashboard, metrics
- [ ] Security: public vs internal functions; auth checks
- [ ] Testing: coverage of critical paths
- [ ] CI/CD: build, lint, deploy pipeline

**Findings:** [file/area + recommendation]

## Recommendations (prioritized)
1. 🔴 Critical — must address
2. 🟡 High — should address soon
3. 🔵 Medium — roadmap
4. ⚪ Low — nice to have
```
