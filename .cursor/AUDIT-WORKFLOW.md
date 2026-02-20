# Repeatable Audit Workflow

This project uses **Rules**, **Skills**, **Prompts**, and **agent selection** to run consistent, high-quality audits. Each audit type has an optimal agent strategy based on what works best for that kind of analysis.

---

## 1. Agent recommendations — which agent for which audit

| Audit | Primary agent | Why | Supporting agents |
|-------|---------------|-----|-------------------|
| **Principal Engineer** | generalPurpose (default model) | Deep multi-file reasoning, architecture analysis, pattern recognition | explore (very thorough) for initial scan |
| **Security** | generalPurpose (default model) | Careful reasoning about attack surfaces, auth flows, data exposure | explore + browser-use for header/HTTPS checks |
| **DevOps** | generalPurpose (fast model) | Mostly config review and gap analysis; fast model handles YAML/JSON well | explore (quick) + Convex MCP |
| **Accessibility** | **browser-use (primary)** | Keyboard nav, focus, contrast, real DOM structure require live browser | explore (medium) for code-level fixes |
| **SEO** | generalPurpose (fast model) | Structural checks (meta, headings, config); browser verifies rendered output | browser-use for rendered verification |

### Why these assignments?

- **Default model** excels at deep reasoning across many files, finding subtle architecture issues, and understanding security implications. Use it when the audit requires judgment.
- **Fast model** is ideal for checklist-style audits where you're mostly checking "is X present?" across config files. DevOps and SEO are largely this pattern.
- **browser-use** is irreplaceable for accessibility — you literally cannot verify keyboard navigation, focus visibility, or rendered contrast from code alone. It's also valuable for SEO (verifying what crawlers actually see) and security (checking headers and auth redirects).
- **explore** is the best initial step for every audit — quickly maps the codebase so the main agent doesn't waste time searching.

---

## 2. Tool integration

### Convex MCP tools (use in Security, DevOps, and PE audits)

| Tool | What it checks | Used in |
|------|---------------|---------|
| `status` | Deployment health, dev vs prod | All audits |
| `functionSpec` | Public vs internal functions | Security, PE |
| `tables` | Schema drift (declared vs inferred) | PE, Security |
| `envList` | Environment variables, secrets exposure | Security, DevOps |
| `logs` | Recent errors, warnings | DevOps |
| `data` | Actual data patterns | Security (PII check) |
| `run` | Execute test queries | PE (validate behavior) |

### Browser MCP tools (use in A11y, SEO, and Security audits)

| Action | What it verifies | Used in |
|--------|-----------------|---------|
| Navigate + snapshot | Page structure, DOM, headings | A11y, SEO |
| Keyboard tab-through | Focus order, visibility, traps | A11y |
| Check headers | HSTS, CSP, X-Frame-Options | Security |
| Check /robots.txt | Crawl rules | SEO |
| Check /sitemap.xml | Sitemap presence | SEO |
| Auth redirect test | Protected routes redirect | Security |
| Mobile viewport | Responsive layout | A11y, SEO |

---

## 3. Prompts — copy-paste to run each audit

### Principal Engineer audit

```
Run a Principal Engineer audit on this repo.

Process:
1. Launch an explore subagent (very thorough) to map the full directory structure, module boundaries, and dependency graph.
2. Use Convex MCP: run `status` to get deployment selector, then `functionSpec` to check public/internal exposure, and `tables` to check schema health.
3. Review architecture (convex/ domain boundaries, Next.js App Router layout, component organization), code quality (TS strictness, Convex validators, error handling), and engineering practices (testing, observability, CI/CD).
4. Output the full report using the principal-engineer-audit skill template. Cite files and lines for every finding. Prioritize recommendations.
```

### Security audit

```
Run a security audit on this repo.

Process:
1. Launch an explore subagent (very thorough) to find all public Convex functions, auth-related files, env var usage, and input handling patterns.
2. Use Convex MCP: `status` → `functionSpec` (verify sensitive functions are internal) → `envList` (check for exposed secrets) → `tables` (review access patterns).
3. Deep-dive auth: @convex-dev/auth config, role enforcement (Admin/Supervisor/Viewer), HTTP endpoint protection, session lifecycle.
4. Run `npm audit` to check for known dependency vulnerabilities.
5. Launch a browser-use subagent to: navigate to the deployed app, check response headers (HSTS, CSP), verify HTTPS, test auth redirects on protected routes, and check error pages don't leak internals.
6. Output the full report using the security-audit skill template. Cite files and lines. Prioritize by exploitability and impact.
```

### DevOps audit

```
Run a DevOps audit on this repo.

Process:
1. Launch an explore subagent (quick) to find CI/CD config, Docker files, infrastructure code, and build scripts.
2. Use Convex MCP: `status` (check deployments), `envList` (verify required vars), `logs` (sample recent errors).
3. Review: package.json scripts, build pipeline, deployment flow (Vercel + Convex Cloud), environment parity, lockfile.
4. Optionally launch browser-use to verify the deployed app loads correctly.
5. Output the full report using the devops-audit skill template. Recommend concrete next steps for each gap.
```

### Accessibility audit

```
Run an accessibility audit on this app.

Process:
1. Launch an explore subagent (medium) to scan code for: missing alt text, unlabeled form inputs, non-semantic HTML, ARIA usage, focus management patterns, and prefers-reduced-motion.
2. Launch a browser-use subagent (PRIMARY) to:
   a. Navigate to login, dashboard, shipments, and audit log pages.
   b. Take snapshots — check landmarks, heading hierarchy, form labels, alt text.
   c. Tab through each page — verify focus is visible on every interactive element, no focus traps, skip link exists.
   d. Test keyboard operation: open dropdowns, submit forms, toggle sidebar, open/close chat widget.
   e. Check visual issues: contrast, touch target size, responsive layout.
3. Map each finding to WCAG 2.1 criteria (1.1.1, 2.1.1, 2.4.7, etc.).
4. Output the full report using the accessibility-audit skill template. Include browser test results section.
```

### SEO audit

```
Run an SEO audit on this app.

Process:
1. Launch an explore subagent (quick) to find: metadata exports in app/ pages, robots.txt, sitemap, Open Graph tags, structured data, heading usage, next/image usage.
2. Launch a browser-use subagent to:
   a. Navigate to landing page — check <title>, <meta description>, <h1>, OG tags.
   b. Navigate to login — verify unique title/description.
   c. Navigate to /dashboard without auth — verify redirect (no duplicate content).
   d. Check /robots.txt and /sitemap.xml.
   e. Check mobile viewport and responsiveness.
3. Review Next.js-specific: Metadata API usage, generateMetadata, middleware auth protection.
4. Output the full report using the seo-audit skill template. Include browser test results.
```

---

## 4. Running a full suite

To run all five audits in sequence:

```
Run a full audit suite on this repo. Execute each audit in order:
1. Principal Engineer audit
2. Security audit
3. DevOps audit
4. Accessibility audit
5. SEO audit

For each, use the corresponding skill template and recommended agent strategy. Output each report with a horizontal rule between them. At the end, provide a consolidated "Top 10 actions" list across all five audits, ranked by impact.
```

---

## 5. Testing and optimizing agents

### How to compare

1. **Fix the scope** — use the same scope for every test run (e.g. "whole repo" or "convex/ and app/").
2. **Use the exact prompt** from section 3 — don't rephrase between runs.
3. **Run with Agent A**, then run the same prompt with **Agent B**.
4. **Score each run** on this rubric:

| Criterion | Weight | What to check |
|-----------|--------|---------------|
| Template compliance | 20% | Did it follow the skill's output format exactly? |
| File citations | 20% | Did it cite specific files and line numbers? |
| Actionability | 20% | Are recommendations concrete ("add X to Y") not vague ("improve Z")? |
| Accuracy | 20% | Are file references correct? No hallucinated files? |
| Completeness | 10% | Did it check all items in the checklist? |
| Tool usage | 10% | Did it use Convex MCP / browser-use where the skill says to? |

### Recommended test matrix

| Audit | Test with | Expected winner | Why |
|-------|-----------|-----------------|-----|
| Principal Engineer | Default vs fast | Default | Needs architecture depth |
| Security | Default vs fast | Default | Needs attack-surface reasoning |
| DevOps | Fast vs default | Fast | Config gap analysis; fast is sufficient |
| Accessibility | Browser-use + default vs browser-use + fast | Browser-use + default | A11y fixes need code understanding |
| SEO | Fast + browser-use vs default + browser-use | Fast + browser-use | Mostly structural checks |

### Recording results

After testing, update this section with your findings:

```
## Agent test results (fill in after testing)

| Audit | Best agent | Runner-up | Notes |
|-------|-----------|-----------|-------|
| PE | [TBD] | [TBD] | |
| Security | [TBD] | [TBD] | |
| DevOps | [TBD] | [TBD] | |
| A11y | [TBD] | [TBD] | |
| SEO | [TBD] | [TBD] | |
```

---

## 6. Updating the process

- **Change a checklist?** Edit the skill's `SKILL.md` — the template drives the output.
- **Change agent assignment?** Update this file (section 1) and `.cursor/rules/audits.mdc`.
- **Add a new audit type?** Create a new skill in `.cursor/skills/`, add it to the rule, add a prompt here.
- **Project changed tech stack?** Update the project-specific context in each skill's Process section.
