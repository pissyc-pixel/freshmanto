import { describe, expect, it } from "vitest";

import {
  buildPlannerActionNarrative,
  buildWeeklySettlementNarrative,
  normalizeMonthlyDiaryBody,
} from "@/lib/action-narratives";
import type { ActionTurnSummary, CollegeTrack, WeeklyDayType } from "@/types/game";

function createTurn(overrides?: Partial<ActionTurnSummary>): ActionTurnSummary {
  return {
    turn: 1,
    week: 1,
    slotLabel: "第 1 周",
    advancesCalendar: true,
    attendanceStrategy: "mixed",
    chosenAction: { action: "study", time: "night" },
    resolvedAction: { action: "study", time: "night", accepted: true },
    statsBefore: {
      money: 1200,
      mood: 52,
      stress: 48,
      fulfillment: 30,
      social: 26,
      semesterAcademics: 32,
    },
    statsAfter: {
      money: 1200,
      mood: 50,
      stress: 54,
      fulfillment: 32,
      social: 26,
      semesterAcademics: 38,
    },
    statsDelta: {
      money: 0,
      mood: -2,
      stress: 6,
      fulfillment: 2,
      social: 0,
      semesterAcademics: 6,
    },
    moneyDelta: 0,
    flags: [],
    notableFacts: [],
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
    weekday: "wed",
    dayLabel: "周三",
    ...overrides,
  };
}

describe("action narratives", () => {
  it("builds deterministic planner narratives from scene-like description pools", () => {
    const context = {
      saveId: "run-1",
      year: 1,
      month: 1,
      week: 2,
      weekday: "wed" as const,
      action: "social" as const,
      actionId: "social:night",
      dayType: "night_only" as WeeklyDayType,
      hasEvent: false,
      mood: 45,
      stress: 62,
      money: 540,
      collegeTrack: "business" as CollegeTrack,
      repeatedCount: 1,
    };

    const first = buildPlannerActionNarrative(context);
    const second = buildPlannerActionNarrative(context);

    expect(first).toBe(second);
    expect(first).not.toMatch(/社交提升|心情回升|金钱下降|系统|后台/);
    expect(first).toMatch(/舍友|同学|夜宵|操场|饭局|校外/);
  });

  it("writes weekly settlement idle days as lived-through retrospection instead of autofill mechanics", () => {
    const text = buildWeeklySettlementNarrative(
      createTurn({
        chosenAction: { action: "idle", time: "night" },
        resolvedAction: { action: "idle", time: "night", accepted: true, autoFilled: true },
        statsDelta: {
          money: -42,
          mood: 1,
          stress: -2,
          fulfillment: 0,
          social: 0,
          semesterAcademics: 0,
        },
        moneyDelta: -42,
        notableFacts: ["auto-filled-idle", "daily-living-cost:42"],
      }),
    );

    expect(text).not.toContain("自动补成");
    expect(text).not.toContain("手动安排");
    expect(text).not.toContain("daily-living-cost");
    expect(text).toMatch(/没特意安排|松松地过去|放空|拖到了晚上/);
  });

  it("strips markdown headings and repeated titles from diary body before showing it to players", () => {
    const body = normalizeMonthlyDiaryBody(`
# 第1学年・第1月 月记

## 第1学年・第1月 月记

这个月快结束的时候，我才发现自己一直没怎么停下来。

晚上回宿舍之后，人还是有点累。
`);

    expect(body).toBe("这个月快结束的时候，我才发现自己一直没怎么停下来。\n\n晚上回宿舍之后，人还是有点累。");
    expect(body).not.toContain("#");
    expect(body).not.toContain("第1学年・第1月 月记");
  });
});
