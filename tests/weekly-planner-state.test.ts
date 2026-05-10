import { describe, expect, it } from "vitest";
import {
  applyOptimisticPlan,
  countUnplannedDays,
  resolvePendingPlanStatus,
  type PlannerDayView,
} from "@/components/action-plan-form";
import { buildPlannerFeedbackLines, buildPlannerStatusText } from "@/app/game/view-model";
import type { ActiveWeekState } from "@/types/game";

function createPlannerDay(overrides?: Partial<PlannerDayView>): PlannerDayView {
  return {
    weekday: "mon",
    label: "周一",
    status: "待安排",
    plannedActionLabel: null,
    justPlanned: false,
    baseTypeLabel: "白天满课，默认只有夜里可以安排",
    effectiveTypeLabel: "白天满课，默认只有夜里可以安排",
    skipClassAvailable: true,
    skipClassSelected: false,
    eventTitle: null,
    eventSummary: null,
    normalOptions: [
      {
        optionId: "study",
        label: "复习 / 学习",
        description: "稳步推进学业。",
        selected: false,
      },
    ],
    skipOptions: [
      {
        optionId: "study",
        label: "复习 / 学习",
        description: "稳步推进学业。",
        selected: false,
      },
    ],
    ...overrides,
  };
}

describe("weekly planner state helpers", () => {
  it("reduces the remaining unplanned-day count after selecting a day action", () => {
    const days = [
      createPlannerDay(),
      createPlannerDay({ weekday: "tue", label: "周二" }),
    ];

    const updated = applyOptimisticPlan(days, "mon", "复习 / 学习", false);

    expect(countUnplannedDays(days)).toBe(2);
    expect(countUnplannedDays(updated)).toBe(1);
  });

  it("updates the selected day card state immediately from the same planner source", () => {
    const days = [
      createPlannerDay(),
      createPlannerDay({ weekday: "tue", label: "周二" }),
    ];

    const updated = applyOptimisticPlan(days, "mon", "复习 / 学习", true);
    const monday = updated.find((day) => day.weekday === "mon");
    const tuesday = updated.find((day) => day.weekday === "tue");

    expect(monday).toMatchObject({
      status: "已安排",
      plannedActionLabel: "复习 / 学习",
      justPlanned: true,
      skipClassSelected: true,
    });
    expect(tuesday?.justPlanned).toBe(false);
  });

  it("keeps planner status copy readable instead of leaking raw unicode escapes", () => {
    const weekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 9,
      releasedClassDays: [],
      attendanceStrategy: "mixed",
      attendanceLocked: true,
      readyToConfirm: false,
      days: [
        {
          label: "周一",
          weekday: "mon",
          baseDayType: "night_only",
          effectiveDayType: "night_only",
          skipClassAvailable: true,
          skipClassSelected: false,
          planningStatus: "planned",
          plannedAction: {
            action: "study",
            optionId: "study",
            label: "复习 / 学习",
            time: "night",
            weekday: "mon",
          },
        },
      ],
    };

    const status = buildPlannerStatusText(weekState);
    const feedbackLines = buildPlannerFeedbackLines(weekState).join(" ");

    expect(status).toContain("这周已经排了");
    expect(status).not.toContain("\\u");
    expect(feedbackLines).toContain("自动补成");
    expect(feedbackLines).not.toContain("\\u");
  });

  it("marks a pending plan as confirmed when the server echoes the same weekday action back", () => {
    const days = [
      createPlannerDay({
        weekday: "mon",
        status: "已安排",
        plannedActionLabel: "复习 / 学习",
      }),
    ];

    expect(
      resolvePendingPlanStatus(days, {
        weekday: "mon",
        label: "复习 / 学习",
      }),
    ).toBe("confirmed");
  });

  it("marks a pending plan as rejected when the server returns an error without persisting it", () => {
    const days = [createPlannerDay()];

    expect(
      resolvePendingPlanStatus(
        days,
        {
          weekday: "mon",
          label: "复习 / 学习",
        },
        {
          kind: "error",
          title: "这一天排不进这个行动",
          message: "这一天默认只剩夜间可安排，白天行动放不进去。",
        },
      ),
    ).toBe("rejected");
  });
});
