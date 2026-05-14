import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  applyOptimisticPlan,
  buildPlannerDayAriaLabel,
  countUnplannedDays,
  handlePlannerDayKeyDown,
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

  it("opens planner day from keyboard on Enter and Space while preventing default scroll behavior", () => {
    const activatedKeys: string[] = [];
    const preventedKeys: string[] = [];

    for (const key of ["Enter", " "]) {
      handlePlannerDayKeyDown(
        {
          key,
          preventDefault: () => {
            preventedKeys.push(key);
          },
        },
        () => {
          activatedKeys.push(key);
        },
      );
    }

    handlePlannerDayKeyDown(
      {
        key: "Escape",
        preventDefault: () => {
          preventedKeys.push("Escape");
        },
      },
      () => {
        activatedKeys.push("Escape");
      },
    );

    expect(activatedKeys).toEqual(["Enter", " "]);
    expect(preventedKeys).toEqual(["Enter", " "]);
  });

  it("builds an aria label that describes the day status, planned action, and attendance requirement", () => {
    const unlockedLabel = buildPlannerDayAriaLabel(createPlannerDay(), false);
    const plannedLabel = buildPlannerDayAriaLabel(
      createPlannerDay({
        plannedActionLabel: "复习 / 学习",
        effectiveTypeLabel: "这天基本能自己支配",
        status: "已安排",
      }),
      true,
    );

    expect(unlockedLabel).toContain("需先确认本周课程态度");
    expect(plannedLabel).toContain("已安排 复习 / 学习");
    expect(plannedLabel).not.toContain("需先确认本周课程态度");
  });

  it("closes the day-planning modal immediately after marking the plan as pending", () => {
    const source = readFileSync("components/action-plan-form.tsx", "utf-8");

    expect(source).toMatch(
      /onSubmit=\{\(\) => \{\s*markPlanAsPending\(selectedDay, option\);\s*setSelectedWeekday\(null\);/s,
    );
  });

  it("renders planner day cards as keyboard-focusable dialog buttons with aria metadata", () => {
    const source = readFileSync("components/action-plan-form.tsx", "utf-8");

    expect(source).toContain('role="button"');
    expect(source).toContain("tabIndex={0}");
    expect(source).toContain('aria-haspopup="dialog"');
    expect(source).toContain("aria-disabled={!attendanceLocked || plannerSavePending}");
    expect(source).toContain("aria-label={buildPlannerDayAriaLabel(day, attendanceLocked)}");
  });

  it("renders the action picker as a real global dialog instead of a plain in-card panel", () => {
    const source = readFileSync("components/action-plan-form.tsx", "utf-8");

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
  });
});
