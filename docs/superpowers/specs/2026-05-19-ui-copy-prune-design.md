## Freshmanto UI Redundant Copy Prune Design

### Goal

Remove only the player-facing redundant copy, helper text, and duplicated information cards highlighted in the provided screenshots. Keep gameplay logic, scheduling flow, action selection, weekly settlement, resume data, route judgment, and all underlying state transitions unchanged.

### Scope

- Sidebar:
  - Remove the brand subtitle under `Freshmanto`.
  - Remove the descriptive copy under the `大学生活模拟器` card.
  - Remove the standalone home icon navigation row.
- Weekly planner page:
  - Remove the helper sentence under `本月会发生什么`.
  - Remove the entire duplicated `本月日历` card block.
  - Remove redundant helper copy and hint cards inside the left-side planner panel.
  - Keep weekly schedule cards and all planner interactions intact.
- Action modal:
  - Remove the top availability helper sentence.
  - Remove the event notice card at the top of the modal.
  - Remove relation/priority badges such as `今天相关` and `手头优先`.
- Weekly settlement:
  - Remove the event summary sentence under the weekly review title.
  - Remove the entire `这周还惦记着的事` card so raw keys never render.
- Resume page:
  - Remove the same sidebar subtitle, sidebar summary copy, and home row.
  - Remove long descriptive copy under the top resume sections.
  - Remove KPI explainer notes under GPA / ranking / scholarship / project / internship tiles.
  - Remove the helper copy under `基础画像 / 入学档案`.
  - Remove the helper copy under `为什么你正在接近某条路`.
  - Remove the entire `方向线索` card.
  - Remove the entire bottom `正式结果预览` and `阶段日志` sections.

### Implementation Approach

- Prefer render-layer deletions in page components and presentational components.
- Only touch view-model or helper code when a removed UI element is sourced there and leaving it in place would keep rendering unwanted labels.
- Do not delete or reshape domain data, resolver outputs, or engine-produced fields.
- Let surrounding layout collapse naturally by removing the rendered blocks instead of hiding them with CSS placeholders.

### Files Expected

- `components/fm-ui/FmScaffold.tsx`
- `app/game/page.tsx`
- `components/action-plan-form.tsx`
- `components/weekly-settlement-card.tsx`
- `lib/planner-option-priority.ts`
- `app/resume/page.tsx`
- Relevant tests covering weekly planner, modal copy, settlement, and resume page rendering

### Verification Plan

- Update or add render-level tests so removed copy/cards no longer appear while functional anchors still render.
- Run targeted tests for game page, resume page, planner option priority, and weekly settlement.
- Run `npm run build` as the final acceptance check.
