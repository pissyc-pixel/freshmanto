import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("ui copy prune source boundaries", () => {
  const actionPlanFormSource = readFileSync("components/action-plan-form.tsx", "utf-8");
  const plannerPrioritySource = readFileSync("lib/planner-option-priority.ts", "utf-8");
  const scaffoldSource = readFileSync("components/fm-ui/FmScaffold.tsx", "utf-8");

  it("removes redundant planner helper copy from the day planner flow", () => {
    expect(actionPlanFormSource).not.toContain("今天有事插进来，安排要留点余地。");
    expect(actionPlanFormSource).not.toContain("先定这周怎么上课。");
    expect(actionPlanFormSource).not.toContain("没安排的日子，会自然滑过去。");
  });

  it("removes event and cash-priority badges but keeps selected-state labeling", () => {
    expect(plannerPrioritySource).not.toContain("今天相关");
    expect(plannerPrioritySource).not.toContain("手头优先");
    expect(plannerPrioritySource).toContain("已选");
  });

  it("removes the standalone home-row sidebar navigation entry", () => {
    expect(scaffoldSource).not.toContain('FmIcon name="home"');
    expect(scaffoldSource).not.toContain('href="/" aria-hidden={Boolean(runId)}');
  });
});
