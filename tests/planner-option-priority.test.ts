import { describe, expect, it } from "vitest";

import {
  annotatePlannerOptions,
  type PlannerOptionForPriority,
} from "@/lib/planner-option-priority";
import type { WeeklyEventInstance } from "@/types/game";

function createOption(input: Partial<PlannerOptionForPriority> & Pick<PlannerOptionForPriority, "optionId" | "action" | "label">): PlannerOptionForPriority {
  return {
    optionId: input.optionId,
    action: input.action,
    label: input.label,
    description: input.description ?? `${input.label} description`,
    selected: input.selected ?? false,
    source: input.source ?? "default",
    sourceEventId: input.sourceEventId,
  };
}

describe("planner option priority", () => {
  it("puts event-related actions first and tags them clearly", () => {
    const event: WeeklyEventInstance = {
      id: "weekly-engineering-sprint",
      title: "工科实验周",
      summary: "这周工科氛围更强。",
      weekday: "sat",
      effectDescription: "项目和实验更容易推进。",
      actionBoosts: [
        {
          action: "competition_project",
          effect: {
            stats: { fulfillment: 1 },
          },
        },
      ],
    };

    const sorted = annotatePlannerOptions({
      options: [
        createOption({ optionId: "social", action: "social", label: "社交 / 关系" }),
        createOption({ optionId: "competition_project", action: "competition_project", label: "比赛 / 项目投入" }),
        createOption({ optionId: "study", action: "study", label: "复习 / 学习" }),
      ],
      event,
      hasCashRisk: false,
    });

    expect(sorted[0]?.optionId).toBe("competition_project");
    expect(sorted[0]?.badges).toContain("今天相关");
  });

  it("puts cash-risk mitigation actions before ordinary leisure actions", () => {
    const sorted = annotatePlannerOptions({
      options: [
        createOption({ optionId: "social", action: "social", label: "社交 / 关系" }),
        createOption({ optionId: "part_time", action: "part_time", label: "兼职 / 赚钱" }),
        createOption({ optionId: "ask_family", action: "ask_family", label: "向家里要钱" }),
      ],
      hasCashRisk: true,
    });

    expect(sorted.slice(0, 2).map((option) => option.optionId)).toEqual(["part_time", "ask_family"]);
    expect(sorted[0]?.badges).toContain("手头优先");
    expect(sorted[1]?.badges).toContain("手头优先");
  });

  it("keeps explicit selected state understandable instead of relying on border style alone", () => {
    const sorted = annotatePlannerOptions({
      options: [
        createOption({ optionId: "study", action: "study", label: "复习 / 学习", selected: true }),
        createOption({ optionId: "social", action: "social", label: "社交 / 关系" }),
      ],
      hasCashRisk: false,
    });

    expect(sorted[0]?.badges).toContain("已选");
  });
});
