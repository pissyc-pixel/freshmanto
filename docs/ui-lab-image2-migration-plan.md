# Image2 UI Lab to Real App Migration Plan

## Goal

Keep the current `app/ui-lab/*` pages as high-fidelity visual references, then progressively extract the reusable pieces into `components/fm-ui/*` without coupling those static mocks to gameplay state too early.

## Extraction order

### 1. `components/fm-ui/FmShell.tsx`

- Own the pale green background, rounded frame, left sidebar slot, page header slot, and floating action slot.
- Support:
  - standalone centered mode for `/ui-lab/start`
  - sidebar mode for planner, journal, and resume
  - document mode for admission and monthly journal
- Leave navigation data outside the component so the real app can inject route-aware labels and actions later.

### 2. `components/fm-ui/FmCard.tsx`

- Wrap the shared card language:
  - soft white surface
  - subtle border
  - large radius
  - diffuse shadow
- Variants:
  - default content card
  - compact metric card
  - paper sheet
  - document card

### 3. `components/fm-ui/FmButton.tsx`

- Capture the three repeated button families:
  - deep green primary
  - white outline secondary
  - sidebar pill / floating action
- Keep icon placement and radius consistent.
- Do not bake in game actions; accept plain `children`, `icon`, `variant`, and native button props.

### 4. `components/fm-ui/FmMetricStrip.tsx`

- Extract the planner top strip into a prop-driven component:
  - `items[]` with `label`, `value`, `icon`, `tone`, `progress`
- Reuse it later in planner, settlement, and future dashboard views.

### 5. `components/fm-ui/FmActionDialog.tsx`

- Lift the dialog frame, overlay, option list item shell, and footer button row from `/ui-lab/action-modal`.
- Keep data contract intentionally presentation-first:
  - `title`
  - `subtitle`
  - `options[]`
  - `selectedId`
  - `onSelect`
  - `onCancel`
  - `onConfirm`
- Real payload construction should stay in the existing action planning layer, not in the dialog UI.

### 6. `components/fm-ui/FmTimeline.tsx`

- Generalize the journal and resume timeline spine into:
  - left rail
  - node icon slot
  - body slot
  - optional right meta slot
- Use composition rather than one giant all-purpose prop object.

### 7. `components/fm-ui/FmPaperPage.tsx`

- Own the lined paper background, stack shadow, tape accent, and polaroid anchors.
- Real monthly journal content can later inject:
  - `monthLabel`
  - `title`
  - `body`
  - `photos`
  - `footerAction`

### 8. `components/fm-ui/FmResumeSection.tsx`

- Extract the resume header blocks, score strip, skill pill row, and milestone rows.
- Keep item rendering flexible so future gameplay data can feed real awards, ranking, and progression milestones.

## Recommended integration sequence

1. Freeze the current UI Lab pages as visual baselines.
2. Extract `FmCard`, `FmButton`, and color/shadow tokens first.
3. Extract `FmShell` and `FmMetricStrip`.
4. Move planner modal into `FmActionDialog`.
5. Move journal/resume rails into `FmTimeline`.
6. Move monthly paper into `FmPaperPage`.
7. Wire one real page at a time, starting with the lowest-risk read-only surfaces:
   - `app/resume/page.tsx`
   - `app/journal/page.tsx`
   - planner read-only frame
8. Only after visual parity is stable, connect planner interactions back to live game state and action payloads.

## Guardrails

- Do not import gameplay reducers, resolver helpers, or server actions into `components/fm-ui/*`.
- Keep mock copy and screenshot fixtures in `app/ui-lab/*`.
- Use the screenshot workflow in `scripts/capture-ui-lab.mjs` as the regression check while extracting.
