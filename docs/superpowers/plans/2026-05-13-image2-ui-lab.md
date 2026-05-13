# Image2 UI Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build isolated `app/ui-lab/*` static routes that closely recreate the seven Image2 reference screens without changing existing gameplay pages or game logic.

**Architecture:** Add a dedicated UI Lab route group under `app/ui-lab` with shared visual tokens in a route-local stylesheet and a small set of presentational helpers for shell, sidebar, paper, timeline, planner cards, and modal framing. Keep all data static in-page or in a UI Lab mock module, then verify the visuals with a repeatable screenshot and diff workflow against the reference images.

**Tech Stack:** Next.js App Router, React server components, route-local CSS, Vitest, Playwright CLI or equivalent scripted browser capture, Pixelmatch.

---

### Task 1: Lock route and asset expectations with tests

**Files:**
- Create: `D:/freshmanto/tests/ui-lab-pages.test.ts`

- [ ] Add a Vitest file that imports each new UI Lab page component and asserts the static markup contains the screen-specific headings or labels from the reference routes.
- [ ] Run `npx vitest run tests/ui-lab-pages.test.ts` and confirm the test fails because the new routes do not exist yet.

### Task 2: Add shared tokens and route-local shell primitives

**Files:**
- Create: `D:/freshmanto/app/ui-lab/ui-lab.css`
- Create: `D:/freshmanto/app/ui-lab/mock-data.ts`
- Create: `D:/freshmanto/app/ui-lab/_components.tsx`

- [ ] Define the shared Freshmanto UI Lab tokens for background, cards, borders, shadows, radii, and typography.
- [ ] Add lightweight static helpers for the sidebar, planner metric strip, paper sheet, timeline, and button variants.
- [ ] Keep helpers presentation-only and avoid wiring any existing gameplay state or actions.

### Task 3: Build the seven static UI Lab routes

**Files:**
- Create: `D:/freshmanto/app/ui-lab/start/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/admission/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/planner/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/action-modal/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/journal/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/resume/page.tsx`
- Create: `D:/freshmanto/app/ui-lab/monthly-journal/page.tsx`

- [ ] Recreate the start page with centered card, serif brand wordmark, muted inputs, and deep green CTA.
- [ ] Recreate the admission letter with left profile rail, central document card, red university header, seal, and bottom controls.
- [ ] Recreate the planner and action modal with shared sidebar, metric strip, four week cards, and a centered overlay dialog.
- [ ] Recreate the growth journal and resume screens with the sidebar plus right-side timeline/card layouts.
- [ ] Recreate the monthly journal as layered lined paper with tape, polaroids, page counter, and next-month button.

### Task 4: Add reference asset organization and screenshot workflow

**Files:**
- Create: `D:/freshmanto/docs/design-reference/image2-ui/`
- Create: `D:/freshmanto/docs/design-reference/image2-ui/__actual__/`
- Create: `D:/freshmanto/docs/design-reference/image2-ui/__diff__/`
- Create: `D:/freshmanto/scripts/capture-ui-lab.mjs`

- [ ] Normalize the reference images into `docs/design-reference/image2-ui/` with the expected filenames from the task description.
- [ ] Add a capture script that opens each local UI Lab route, captures screenshots at the required viewport sizes, and writes actual and diff outputs.
- [ ] Run at least two capture-and-tune passes, adjusting spacing, typography, color, and shadows between passes.

### Task 5: Document component migration and run verification

**Files:**
- Create: `D:/freshmanto/docs/ui-lab-image2-migration-plan.md`
- Modify: `D:/freshmanto/package.json`

- [ ] Document how the static UI Lab layouts should later migrate into `components/fm-ui/*` primitives without yet wiring them into production pages.
- [ ] Add any needed script entry for the screenshot workflow.
- [ ] Run `npm run lint`, `npm run build`, and `npx vitest run`, then report exact outcomes.
