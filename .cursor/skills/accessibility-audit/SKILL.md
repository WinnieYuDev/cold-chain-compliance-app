---
name: accessibility-audit
description: Audits web UIs for accessibility (WCAG, keyboard, screen readers, contrast). Use when the user requests an accessibility audit, a11y review, WCAG check, or inclusive design review. Uses browser testing for live verification.
---

# Accessibility Audit

**Recommended agent:** browser-use subagent as primary. This is the audit that benefits MOST from browser testing — keyboard navigation, focus management, contrast, and real DOM structure can only be verified in a live browser. Pair with generalPurpose (default model) for code-level fixes.

## Process

### Step 1 — Scope

Confirm: whole app, specific flow (e.g. login → dashboard), or component set. Default to critical flows: login, dashboard, shipment detail.

### Step 2 — Code review (explore subagent, thoroughness "medium")

Launch explore to scan for:
- Missing `alt` attributes on `<img>` tags
- Form inputs without associated `<label>` or `aria-label`
- Use of `div`/`span` where `button`/`a`/`nav`/`main` should be used
- `role=` and `aria-*` usage patterns
- Focus management: `tabIndex`, `autoFocus`, `onKeyDown`
- Motion: `prefers-reduced-motion` media query usage
- Color-only indicators (check for status badges, alerts)

Key files to check:
- `app/layout.tsx`, `app/dashboard/layout.tsx` — landmarks, skip links
- `components/ui/*.tsx` — Button, Input, Select, Table primitives
- `app/(auth)/login/page.tsx`, `register/page.tsx` — form labels, errors
- `components/GlobalChat.tsx` — dynamic widget, focus trap

### Step 3 — Browser testing (browser-use subagent — PRIMARY)

This is the most important step. Launch browser-use to:

1. **Navigate to each key page** (login, dashboard, shipments, audit log)
2. **Take snapshot** of each page — check DOM structure for:
   - Landmark regions (`<main>`, `<nav>`, `<aside>`, `<header>`)
   - Heading hierarchy (single `<h1>`, logical `<h2>`/`<h3>`)
   - Form labels associated with inputs
   - Image alt text
3. **Keyboard navigation test**:
   - Tab through the page — is focus visible on every interactive element?
   - Can you reach all buttons, links, and form controls?
   - Is there a skip-to-content link?
   - Any focus traps (modals, chat widget)?
4. **Interactive elements**:
   - Click buttons, open dropdowns, submit forms using keyboard
   - Check that chat widget is keyboard-operable
   - Check sidebar toggle
5. **Visual checks** (from snapshot):
   - Text contrast appears sufficient (flag anything that looks low-contrast)
   - Interactive elements are large enough (44x44px touch targets)
   - Layout doesn't break at different viewport sizes

### Step 4 — Map to WCAG

For each finding, cite the WCAG 2.1 criterion:
- 1.1.1 Non-text Content (alt text)
- 1.3.1 Info and Relationships (semantics)
- 1.4.3 Contrast (Minimum)
- 2.1.1 Keyboard
- 2.4.1 Bypass Blocks (skip links)
- 2.4.3 Focus Order
- 2.4.7 Focus Visible
- 3.3.2 Labels or Instructions
- 4.1.2 Name, Role, Value (ARIA)

### Step 5 — Report

## Output Template

```markdown
# Accessibility Audit — [Scope]

## Executive summary
[WCAG AA target; overall compliance; top 3 barriers.]

## Perceivable
- [ ] Images: all `<img>` have meaningful `alt` (not empty `alt=""`)
- [ ] Color: status not conveyed by color alone (badges, excursion alerts)
- [ ] Contrast: text meets 4.5:1 (normal) / 3:1 (large) — browser-verified
- [ ] Zoom: layout works at 200% — browser-verified

**Findings:** [component + WCAG criterion + issue + fix]

## Operable
- [ ] Keyboard: all pages fully keyboard-navigable — browser-verified
- [ ] Focus visible: outline on every interactive element — browser-verified
- [ ] Skip link: present on dashboard layout
- [ ] No focus traps: chat widget, modals escapable
- [ ] Touch targets: 44x44px minimum on mobile — browser-verified

**Findings:** [component + WCAG criterion + issue + fix]

## Understandable
- [ ] `lang="en"` on `<html>`
- [ ] Form labels: login, register, search, data upload — all labeled
- [ ] Error messages: identified and described with `role="alert"`
- [ ] Navigation: consistent across pages

**Findings:** [component + WCAG criterion + issue + fix]

## Robust
- [ ] Semantic HTML: `<button>`, `<nav>`, `<main>`, `<aside>` used correctly
- [ ] ARIA: used sparingly and correctly; no redundant roles
- [ ] Heading hierarchy: single H1, logical H2/H3

**Findings:** [component + WCAG criterion + issue + fix]

## Browser test results
[Summary of browser-use findings: pages tested, keyboard nav results, focus issues, visual issues]

## Recommendations (prioritized)
1. 🔴 Critical — blocks core tasks for assistive tech users
2. 🟡 High — major barriers
3. 🔵 Medium — improvements
4. ⚪ Low — polish
```
