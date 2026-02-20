---
name: seo-audit
description: Audits sites and apps for search engine optimization (meta, structure, performance, crawlability). Use when the user requests an SEO audit, search optimization review, or meta and indexing check. Uses browser testing to verify rendered output.
---

# SEO Audit

**Recommended agent:** generalPurpose (fast model) for code review + browser-use subagent for rendered output verification. SEO checks are largely structural (meta tags, headings, config). The fast model handles this well. Browser verifies what crawlers actually see.

## Process

### Step 1 — Scope

Determine: SPA vs SSR vs static. This project uses **Next.js App Router (SSR by default)** which is SEO-friendly. Scope: public-facing pages vs dashboard (dashboard may not need SEO).

Key question: Which pages are public? (login, register, about, landing) vs which are behind auth? (dashboard/* — typically noindex)

### Step 2 — Code review (explore subagent, thoroughness "quick")

Launch explore to find:
- `app/layout.tsx` — root metadata (title, description)
- Per-page `metadata` exports or `generateMetadata` functions
- `public/robots.txt` — does it exist?
- `app/sitemap.ts` or `app/sitemap.xml` — does it exist?
- Open Graph / Twitter meta tags
- Structured data (JSON-LD)
- `<head>` content: canonical, viewport, charset
- Heading usage: H1 per page, heading hierarchy

Key files:
- `app/layout.tsx` — root metadata
- `app/page.tsx` — landing page
- `app/(auth)/login/page.tsx` — login page
- `next.config.js` — redirects, rewrites, headers

### Step 3 — Browser testing (browser-use subagent)

Launch browser-use to verify what crawlers actually see:

1. **Navigate to the landing page**
   - Take snapshot: check `<title>`, `<meta name="description">`, `<meta name="viewport">`
   - Check for `<h1>` — is there exactly one?
   - Check for Open Graph tags in the page source
2. **Navigate to login page**
   - Verify it has unique title/description
3. **Navigate to a protected route (e.g. /dashboard) without auth**
   - Does it redirect? (Good for SEO — no duplicate content)
4. **Check for robots.txt** — navigate to `/robots.txt`
5. **Check for sitemap** — navigate to `/sitemap.xml`
6. **Check response headers**:
   - `X-Robots-Tag` if present
   - Canonical URL handling
7. **Mobile viewport** — is the page responsive?

### Step 4 — Next.js-specific checks

- Is `metadata` exported from layout/page files? (Next.js 14 Metadata API)
- Are dynamic pages using `generateMetadata`?
- Is `next/head` used anywhere? (should use Metadata API instead in App Router)
- Image optimization: using `next/image` with proper alt text?
- Are dashboard routes behind auth middleware? (prevents indexing of protected content)

### Step 5 — Report

## Output Template

```markdown
# SEO Audit — [Scope]

## Executive summary
[Indexability; rendering mode (SSR); main gaps; top 2–3 actions.]

## Technical foundation
- [ ] Rendering: Next.js SSR — crawler-friendly ✓
- [ ] `robots.txt`: exists at /robots.txt — browser-verified
- [ ] Sitemap: exists at /sitemap.xml — browser-verified
- [ ] HTTPS: enforced — browser-verified
- [ ] Mobile viewport: set and responsive — browser-verified
- [ ] Canonical URLs: set on all indexable pages

**Findings:** [URL or file + issue + fix]

## Content & meta (browser-verified)
- [ ] Root title: set in app/layout.tsx — appears in `<title>`
- [ ] Per-page titles: each page has unique title via metadata export
- [ ] Meta descriptions: unique and compelling per page
- [ ] H1: exactly one per page; logical heading hierarchy
- [ ] Open Graph: og:title, og:description, og:image
- [ ] Twitter cards: twitter:card, twitter:title
- [ ] Structured data: JSON-LD for Organization or relevant entity

**Findings:** [page + issue + fix]

## Crawlability & performance
- [ ] Key content rendered server-side (not client-only JS)
- [ ] Core Web Vitals: LCP, INP, CLS (recommend Lighthouse)
- [ ] No critical resources blocked
- [ ] Internal linking: public pages linked from navigation

**Findings:** [URL + issue + fix]

## Protected content
- [ ] Dashboard routes: behind auth middleware (not indexed)
- [ ] No duplicate content between public and auth pages
- [ ] Login/register: indexed if desired, noindex if not

**Findings:** [URL + issue + fix]

## Browser test results
[Pages tested, meta tags found, robots.txt content, sitemap presence, heading structure]

## Recommendations (prioritized)
1. 🔴 Critical — blocks indexing
2. 🟡 High — significant impact
3. 🔵 Medium — incremental gains
4. ⚪ Low — polish
```
