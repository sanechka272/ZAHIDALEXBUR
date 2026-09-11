# ZAHIDALEXBUR Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the approved conversion-focused ZAHIDALEXBUR landing page in Next.js.

**Architecture:** App Router with a thin server `page.tsx`, one client landing shell for interaction, data/content modules, and custom global CSS. Existing public site images are referenced through centralized asset URLs so they can later be localized without touching the component structure.

**Tech Stack:** Next.js 16.3.4, React 19.3.0, TypeScript 5.9, native CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-11-zahidalexbur-landing-design.md`

## Global Constraints
- Preserve verified pricing and contact facts from the legacy site.
- Do not invent business metrics or certifications.
- Primary conversion is a phone/settlement consultation request.
- Responsive and keyboard accessible.
- No heavy UI or animation dependencies.

---

### Task 1: Project shell and content model
**Files:** `app/layout.tsx`, `app/page.tsx`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `lib/site-data.ts`
- [ ] Create the App Router shell and metadata.
- [ ] Centralize navigation, services, process steps, gallery assets, FAQ and contact information.
- [ ] Confirm all visible business facts match the legacy site.

### Task 2: Estimator behavior with tests
**Files:** `lib/estimate.js`, `lib/estimate.d.ts`, `tests/estimate.test.mjs`
- [ ] Write tests for known settlements and fallback behavior.
- [ ] Run `npm test` and confirm the tests fail before implementation.
- [ ] Implement the estimator.
- [ ] Run `npm test` and confirm the tests pass.

### Task 3: Landing UI and conversion interactions
**Files:** `components/LandingPage.tsx`, `app/globals.css`
- [ ] Implement header, hero, services, process, proof, estimator, benefits, gallery, FAQ, contact form and footer.
- [ ] Implement mobile navigation, estimator selection, form success state and session-scoped lead modal.
- [ ] Add responsive states, focus styles and reduced-motion rules.

### Task 4: Production verification
**Files:** no new product files required unless build issues are found.
- [ ] Run tests.
- [ ] Run `npm run build`.
- [ ] Fix any type/build failures.
- [ ] Review mobile and desktop structure against the approved mockup.
