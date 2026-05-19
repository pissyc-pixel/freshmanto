# UI Copy Prune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove redundant player-facing copy and duplicated cards from the weekly planner and resume surfaces without changing gameplay logic or data flow.

**Architecture:** Keep the change at the render layer wherever possible by deleting JSX branches, helper copy props, and duplicated card sections. Only trim helper outputs when those helpers exist solely to feed removed UI labels, while preserving planner ordering, state transitions, and settlement/resume data structures.

**Tech Stack:** Next.js App Router, React server/client components, Vitest, TypeScript

---

### Task 1: Lock In Weekly Planner And Resume Copy Removal Expectations

**Files:**
- Modify: `tests/key-month-game-page.test.tsx`
- Modify: `tests/resume-page-legacy-save.test.tsx`
- Create: `tests/ui-copy-prune-source.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
expect(markup).not.toContain("从这一周开始，把大学慢慢过出来。");
expect(markup).not.toContain("排课、做选择，看看四年后会走到哪里。");
expect(markup).not.toContain("这个月有些日子值得留意。");
expect(markup).not.toContain("本月日历");

expect(markup).not.toContain("这里记录能慢慢写进简历和未来选择里的东西。个人履历会随着项目、成绩、奖学金和实践经历慢慢成形。");
expect(markup).not.toContain("为什么你正在接近某条路");
expect(markup).not.toContain("方向线索");

expect(source).not.toContain("今天有事插进来，安排要留点余地。");
expect(source).not.toContain("没安排的日子，会自然滑过去。");
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/key-month-game-page.test.tsx tests/resume-page-legacy-save.test.tsx tests/ui-copy-prune-source.test.ts`

Expected: FAIL because current pages and planner source still contain the redundant copy.

- [ ] **Step 3: Keep the failing assertions as the acceptance boundary**

```ts
// No production-code change in this task.
// The failing assertions define the render-layer deletion boundary.
```

- [ ] **Step 4: Re-run the same tests before implementation starts**

Run: `npm test -- tests/key-month-game-page.test.tsx tests/resume-page-legacy-save.test.tsx tests/ui-copy-prune-source.test.ts`

Expected: FAIL again with the same removed-copy expectations.

### Task 2: Remove Weekly Planner And Modal Redundant UI Copy

**Files:**
- Modify: `components/fm-ui/FmScaffold.tsx`
- Modify: `app/game/page.tsx`
- Modify: `components/action-plan-form.tsx`
- Modify: `lib/planner-option-priority.ts`

- [ ] **Step 1: Use the failing tests from Task 1 as guardrails**

```ts
expect(markup).not.toContain("本月日历");
expect(source).not.toContain("今天相关");
expect(source).not.toContain("手头优先");
```

- [ ] **Step 2: Remove sidebar subtitle/home row, duplicated month card, planner helper copy, modal notice copy, and priority badges**

```tsx
<FmShellLayout
  sidebarSubtitle={undefined}
  sidebarSummary={undefined}
/>

<FmSectionHead title="本月会发生什么" />

{/*
  Remove the duplicated "本月日历" block entirely so the planner panel moves up naturally.
*/}

{!attendanceLocked ? null : null}

{eventNotice ? null : null}
```

```ts
const badges: string[] = [];
if (input.option.selected) {
  badges.push("已选");
}
```

- [ ] **Step 3: Run focused tests for weekly planner copy pruning**

Run: `npm test -- tests/key-month-game-page.test.tsx tests/planner-option-priority.test.ts tests/ui-copy-prune-source.test.ts`

Expected: PASS after the render-layer removals.

### Task 3: Remove Weekly Settlement And Resume Duplicated UI Blocks

**Files:**
- Modify: `components/weekly-settlement-card.tsx`
- Modify: `app/resume/page.tsx`
- Modify: `tests/resume-page-legacy-save.test.tsx`
- Create or Modify: `tests/weekly-settlement-card.test.tsx`

- [ ] **Step 1: Write or extend the failing settlement/resume assertions**

```ts
expect(markup).not.toContain("这周还惦记着的事");
expect(markup).not.toContain("方向线索");
expect(markup).not.toContain("正式结果预览");
expect(markup).not.toContain("阶段日志");
```

- [ ] **Step 2: Run tests to verify they fail before implementation**

Run: `npm test -- tests/resume-page-legacy-save.test.tsx tests/weekly-settlement-card.test.tsx`

Expected: FAIL because the settlement risk card and resume sections still render.

- [ ] **Step 3: Remove only the redundant render blocks while preserving real data-driven sections**

```tsx
{props.eventTitle ? null : null}
{props.riskLines.length > 0 ? null : null}

<FmSectionHead title="履历档案" />
<FmSectionHead title="基础画像 / 入学档案" />
<FmSectionHead title="为什么你正在接近某条路" aside={<FmBadge tone="ending">{directionPerception.primary.label}</FmBadge>} />

{/*
  Remove the "方向线索", "正式结果预览", and "阶段日志" panels entirely.
*/}
```

- [ ] **Step 4: Re-run the focused tests**

Run: `npm test -- tests/resume-page-legacy-save.test.tsx tests/weekly-settlement-card.test.tsx`

Expected: PASS with core resume sections still present and redundant cards removed.

### Task 4: Final Regression And Build Verification

**Files:**
- Verify only: `app/game/page.tsx`, `components/action-plan-form.tsx`, `components/weekly-settlement-card.tsx`, `app/resume/page.tsx`, updated tests

- [ ] **Step 1: Run the full targeted regression set**

Run: `npm test -- tests/key-month-game-page.test.tsx tests/resume-page-legacy-save.test.tsx tests/planner-option-priority.test.ts tests/weekly-settlement-card.test.tsx tests/ui-copy-prune-source.test.ts`

Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Next.js build completes successfully with exit code 0.

- [ ] **Step 3: Review git diff before handoff**

```bash
git diff -- app/game/page.tsx components/action-plan-form.tsx components/weekly-settlement-card.tsx app/resume/page.tsx components/fm-ui/FmScaffold.tsx lib/planner-option-priority.ts tests
```

- [ ] **Step 4: Summarize completed UI-only deletions and call out verification evidence**

```text
Report only the removed UI surfaces, preserved functional areas, and the exact test/build commands that passed.
```
