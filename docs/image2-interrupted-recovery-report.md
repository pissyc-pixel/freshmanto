# Image2 Interrupted Recovery Report

Date: 2026-05-13

## Snapshot

1. Current branch
   - `rescue/image2-interrupted-integration`
2. Current latest preserved commit at audit start
   - `2f77a23` `wip: preserve interrupted image2 real ui integration`
3. Uncommitted files at audit start
   - Yes. The interrupted migration was first preserved on the rescue branch before recovery work began.
4. Baseline used for rollback comparison
   - `master`

## Verification Result

Commands run on 2026-05-13:

```bash
npm run lint
npm run build
npx vitest run
```

Result:

- `npm run lint`: passed
- `npm run build`: passed
- `npx vitest run`: passed (`16` files, `131` tests)

Note:

- One parallel re-run produced a `vitest` worker-start timeout while `lint`, `build`, and `vitest` were executed concurrently.
- Re-running `npx vitest run` on its own passed cleanly, so this was treated as an environment/concurrency issue rather than a gameplay regression.

## Risk Classification

### Low-risk UI / docs changes

- `lib/feature-readiness.ts`
- `components/fm-ui/FmComingSoon.tsx`
- `components/fm-ui/FmEmptyState.tsx`
- `components/fm-ui/FmPartialNotice.tsx`
- `components/fm-ui/FmScaffold.tsx`
- `app/fm-ui.css`
- `app/layout.tsx`
- `docs/image2-ui-real-integration-audit.md`
- `docs/design-reference/image2-ui/__actual_real__/*`
- `tests/feature-readiness.test.tsx`
- `tests/fm-real-pages.test.tsx`
- `tests/admission-view-model.test.ts`

### High-risk real gameplay path changes

- `app/game/page.tsx`
- `components/action-plan-form.tsx`
- `app/actions.ts`

Notes:

- `core/game-engine/*` and `core/resolvers/*` were explicitly reviewed and show no diff versus `master`.
- No weekly settlement rule files or action payload rule files were changed under `core/`.

### Medium-risk real page integrations

- `app/page.tsx`
- `app/admission/page.tsx`
- `app/journal/page.tsx`
- `app/resume/page.tsx`

## Half-migration Findings

The branch was not broken at the rule layer, but it was in a half-migrated UI state:

1. Real gameplay screens had already been re-skinned onto `FmScaffold` / `fm-ui.css`.
2. `app/game/page.tsx` and `components/action-plan-form.tsx` were visually migrated while still relying on the original planner data flow.
3. A new real `/admission` page had been added and `startNewRunAction` now redirects there before `/game`.
4. `journal` and `resume` had already been moved to the new visual system with real-data empty states.
5. Formal sidebar navigation still exposed not-ready items (`Campus Map`, `Social Circle`) as disabled entries, which conflicted with the no-prototype / no-fake-feature requirement.

## Recovery Decision

Recommended path: `continue收口` (Plan A)

Reason:

1. `lint`, `build`, and `vitest` all passed before any rollback was needed.
2. The risky part is mostly visual-shell migration, not rule-layer mutation.
3. Weekly planner, weekly confirmation, monthly summary, and cash warning regression coverage remained green.
4. The only clear recovery issue found was player-facing navigation scope, which was safe to tighten without touching rule logic.

## Recovery Changes Applied

1. Preserved the interrupted state on `rescue/image2-interrupted-integration`.
2. Added a regression test to ensure not-ready features do not appear in the formal sidebar.
3. Updated `components/fm-ui/FmScaffold.tsx` so only `real` and `partial` features render in formal navigation.

## Gameplay Chain Safety Readout

Based on code review plus passing tests:

1. Day-by-day weekly planning state is still driven by real planner data, not UI Lab mock data.
2. Canceling the action modal still uses `type="button"` and does not submit the form.
3. Confirm-week / planned-action regressions are covered by existing weekly tests and remained green.
4. `plannedAction` continues to be the source for weekly settlement and monthly summary generation in `core/game-engine/monthly.ts`.
5. Cash warning regressions remained green.
6. `journal`, `resume`, and monthly journal continue to read real run/month data instead of `app/ui-lab/mock-data.ts`.

## Remaining Manual Focus

Even with green verification, these paths still deserve manual regression testing before merge:

1. Weekly planner day selection and immediate UI refresh
2. Modal cancel vs submit behavior
3. Confirm-week after a mixed week of chosen actions and untouched days
4. Weekly settlement rendering after confirm
5. Start page -> admission -> game transition with a fresh run

## Merge Recommendation

Do not merge directly to `master` yet without a short manual pass on the weekly planner to weekly settlement flow.
