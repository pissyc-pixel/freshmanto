import { describe, expect, it } from "vitest";

import { createInitialGameRun, createWeeklyCalendar, selectWeekAttendanceStrategy } from "@/core/game-engine";
import { buildPlannerWeekdays } from "@/core/resolvers/schedule";
import {
  buildCurrentActionFeedback,
  buildPlannerDaysView,
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
    advancesCalendar: true,
    attendanceStrategy: "mixed",
    chosenAction: { action: "study", time: "day", label: "复习 / 学习", weekday: "mon" },
    resolvedAction: { action: "study", time: "day", accepted: true, label: "复习 / 学习", weekday: "mon" },
    statsBefore: createStats(),
    statsAfter: createStats({ semesterAcademics: 50, stress: 35 }),
    statsDelta: {
      money: 0,
      mood: 0,
      stress: 5,
      fulfillment: 2,
      social: 0,
      semesterAcademics: 5,
    },
    moneyDelta: 0,
    flags: ["weekly-opportunity:recruitment-talk"],
    notableFacts: ["weekly-event:recruitment-talk"],
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
    weekday: "mon",
    dayLabel: "周一",
    weekCompleted: false,
    ...overrides,
  };
}

describe("game page view-model helpers", () => {
  it("summarizes current-week day-by-day planning status on the calendar", () => {
    const weeklyCalendar = createWeeklyCalendar(1);
    const currentWeekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
      attendanceStrategy: "mixed",
      attendanceLocked: true,
      days: buildPlannerWeekdays({
        week: weeklyCalendar[0]!,
        releasedClassDays: ["mon", "wed"],
      }).map((day) => ({
        ...day,
        plannedAction: day.weekday === "mon" ? { action: "study", time: "day", label: "复习 / 学习" } : undefined,
        planningStatus: day.weekday === "mon" ? "planned" : "pending",
      })),
    };

    const blocks = buildWeeklyScheduleBlocks({
      weeklyCalendar,
      currentWeek: 1,
      currentWeekState,
    });

    expect(blocks[0]).toMatchObject({
      label: "第 1 周",
      detail: "这周已经排了 1 / 7 天。",
    });
    expect(blocks[0]?.days.find((day) => day.label === "周一")?.detail).toBe("已安排：复习 / 学习");
    expect(blocks[1]).toMatchObject({
      label: "第 2 周",
      detail: "还没到这周。",
    });
  });

  it("builds weekly planning feedback without leaking raw weekday codes", () => {
    const weeklyCalendar = createWeeklyCalendar(1);
    const currentWeekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
      attendanceStrategy: "mixed",
      attendanceLocked: true,
      days: buildPlannerWeekdays({
        week: weeklyCalendar[0]!,
        releasedClassDays: ["mon", "wed"],
      }),
    };

    const feedback = buildCurrentActionFeedback({
      turn: createTurnSummary(),
      currentWeekState,
    });

    expect(feedback.nextStepHint).toContain("这周已经排了 0 / 7 天");
    expect(feedback.eventLines.join(" ")).toContain("宣讲");
    expect(feedback.eventLines.join(" ")).not.toContain("mon");
    expect(feedback.eventLines.join(" ")).not.toContain("wed");
  });
  it("shows visible competition progress on planner cards", () => {
    const baseRun = createInitialGameRun({
      id: "competition-progress-view-run",
      discipline: "engineering",
      randomValues: [0.22, 0.31, 0.48, 0.57, 0.61, 0.19, 0.26, 0.4],
    });
    const activeProjectRun = selectWeekAttendanceStrategy(
      {
        ...baseRun,
        competitionProjects: baseRun.competitionProjects?.map((project, index) =>
          index === 0
            ? {
                ...project,
                status: "active",
                investedDays: 2,
                minimumEffortDays: 4,
                title: "电赛准备",
              }
            : project,
        ),
      },
      "mixed",
    );

    const plannerDays = buildPlannerDaysView(activeProjectRun.activeMonth!.currentWeekState, activeProjectRun);
    const saturday = plannerDays.find((day) => day.weekday === "sat");
    const competitionOption = saturday?.normalOptions.find((option) => option.action === "competition_project");

    expect(competitionOption).toBeDefined();
    expect(competitionOption?.progressText).toContain("2 / 4");
    expect(competitionOption?.progressText).toContain("这条项目已经投了");
  });

  it("renders one dedicated planner action per active competition project", () => {
    const baseRun = createInitialGameRun({
      id: "competition-specific-options-run",
      discipline: "engineering",
      randomValues: [0.22, 0.31, 0.48, 0.57, 0.61, 0.19, 0.26, 0.4],
    });
    const activeProjectRun = selectWeekAttendanceStrategy(
      {
        ...baseRun,
        competitionProjects: baseRun.competitionProjects?.map((project, index) => ({
          ...project,
          id: `project-${index + 1}`,
          status: "active",
          title: index === 0 ? "电子设计竞赛" : "案例分析商赛",
          category: index === 0 ? "工程实践" : "案例赛",
        })),
      },
      "mixed",
    );

    const plannerDays = buildPlannerDaysView(activeProjectRun.activeMonth!.currentWeekState, activeProjectRun);
    const saturday = plannerDays.find((day) => day.weekday === "sat");
    const competitionOptions = saturday?.normalOptions.filter((option) => option.action === "competition_project") ?? [];

    expect(competitionOptions.map((option) => option.optionId)).toEqual(
      expect.arrayContaining(["competition_project:project-1", "competition_project:project-2"]),
    );
    expect(competitionOptions.map((option) => option.label)).toEqual(
      expect.arrayContaining(["【电赛】方案设计", "【商赛】案例分析"]),
    );
  });

  it("uses plain player-facing trend text instead of emoji or arrows in action descriptions", () => {
    const weeklyCalendar = createWeeklyCalendar(1);
    const currentWeekState: ActiveWeekState = {
      week: 1,
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
      attendanceStrategy: "mixed",
      attendanceLocked: true,
      days: buildPlannerWeekdays({
        week: weeklyCalendar[0]!,
        releasedClassDays: ["mon", "wed"],
      }),
    };

    const plannerDays = buildPlannerDaysView(currentWeekState);
    const monday = plannerDays.find((day) => day.weekday === "mon");
    const descriptions = monday?.normalOptions.map((option) => option.description ?? "") ?? [];

    for (const desc of descriptions) {
      expect(desc).not.toContain("↑");
      expect(desc).not.toContain("↓");
      expect(desc).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    }

    const studyOption = monday?.normalOptions.find((option) => option.action === "study");
    expect(studyOption?.description).toBeDefined();
    expect(studyOption!.description!).toMatch(/教室|笔记|进度|复习|课本/);
  });
});
