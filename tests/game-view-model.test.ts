import { describe, expect, it } from "vitest";

import { createWeeklyCalendar } from "@/core/game-engine";
import {
  buildCurrentActionFeedback,
  buildWeeklyScheduleBlocks,
} from "@/app/game/view-model";
import type { ActionTurnSummary, ActiveWeekState, DynamicStats } from "@/types/game";

function createStats(overrides?: Partial<DynamicStats>): DynamicStats {
  return {
    money: 1200,
    mood: 60,
    stress: 30,
    fulfillment: 40,
    social: 35,
    semesterAcademics: 45,
    ...overrides,
  };
}

function createTurnSummary(overrides?: Partial<ActionTurnSummary>): ActionTurnSummary {
  return {
    turn: 2,
    week: 1,
    slotLabel: "第 1 周",
    advancesCalendar: false,
    attendanceStrategy: "mixed",
    chosenAction: { action: "big_meal", time: "night" },
    resolvedAction: { action: "big_meal", time: "night", accepted: true },
    statsBefore: createStats(),
    statsAfter: createStats({ money: 1020, mood: 68, stress: 24 }),
    statsDelta: {
      money: -180,
      mood: 8,
      stress: -6,
      fulfillment: 0,
      social: 0,
      semesterAcademics: 0,
    },
    moneyDelta: -180,
    flags: [],
    notableFacts: ["skip_class released mon, wed daytime blocks"],
    allowanceApplied: false,
    course: {
      strategy: "mixed",
      attendanceCounted: true,
      directRollCallPenalty: 0,
      rollCallRiskDelta: 0,
      usualScoreRiskDelta: 0,
      proxyCost: 0,
      remedyPressure: 0,
      academicRiskDelta: 0,
      academicGain: 0,
      moodDelta: 0,
      stressDelta: 0,
    },
    weekTimeBefore: 13,
    weekTimeAfter: 13,
    releasedClassDays: ["mon", "wed"],
    weekCompleted: false,
    ...overrides,
  };
}

describe("game page view-model helpers", () => {
  it("localizes weekly schedule blocks for the active week and released class days", () => {
    const weeklyCalendar = createWeeklyCalendar(1);
    const currentWeekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
      attendanceStrategy: "mixed",
    };

    const blocks = buildWeeklyScheduleBlocks({
      weeklyCalendar,
      currentWeek: 1,
      currentWeekState,
    });

    expect(blocks[0]).toMatchObject({
      label: "第 1 周",
      detail: "本周还剩 11 / 13 个半天可用。",
      timeSummary: "这周已经腾出来的上课白天：周一白天、周三白天",
    });
    expect(blocks[0]?.days.find((day) => day.label === "周一")?.detail).toBe(
      "这一天的白天已经被这周不去上课腾出来了。",
    );
    expect(blocks[1]).toMatchObject({
      label: "第 2 周",
      detail: "还没轮到这一周。",
    });
  });

  it("builds immediate feedback for the latest action without leaking raw weekday codes", () => {
    const currentWeekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
      attendanceStrategy: "mixed",
    };

    const feedback = buildCurrentActionFeedback({
      turn: createTurnSummary(),
      currentWeekState,
    });

    expect(feedback.nextStepHint).toContain("本周还剩 11 / 13 个半天");
    expect(feedback.nextStepHint).toContain("还能继续安排正式行动");
    expect(feedback.eventLines).toContain("上一轮腾出来的白天：周一白天、周三白天。");
    expect(feedback.eventLines).toContain("这一步没有消耗正式行动时间。");
    expect(feedback.eventLines.join(" ")).not.toContain("mon");
    expect(feedback.eventLines.join(" ")).not.toContain("wed");
  });
});
