import { describe, expect, it } from "vitest";

import {
  createInitialGameRun,
  confirmPlannedWeek,
  createMonthlySchedule,
  evaluateGraduationOutcome,
  planWeeklyDayAction,
  resolveActionTurn,
  resolveMonthlyTurn,
  resolveWeekEnd,
  selectWeekAttendanceStrategy,
  settleSemester,
} from "@/core/game-engine";
import {
  ensureProgressionState,
  evaluateRecommendationQualification,
  settleLongTermProgression,
} from "@/core/resolvers/progression";
import { evaluateSemesterFeedback } from "@/core/resolvers";
import { getMonthlyEventWeight } from "@/core/resolvers/events";
import { getWeeklyAllowance, getWeeklyLivingExpense } from "@/data/events";
import type {
  CourseAttendanceStrategy,
  GameRun,
  MonthlyActionPlan,
  SemesterFeedback,
  StructuredMonthlySummary,
  WeeklyActionOption,
} from "@/types/game";

function createDecision(
  attendanceStrategy: CourseAttendanceStrategy,
  actions: MonthlyActionPlan["actions"] = [
    { action: "study", time: "day" },
    { action: "relax", time: "night" },
  ],
): MonthlyActionPlan {
  return {
    attendanceStrategy,
    actions,
  };
}

function createBigMealAction(): MonthlyActionPlan["actions"][number] {
  return {
    action: "big_meal" as MonthlyActionPlan["actions"][number]["action"],
    time: "day",
  };
}

function withMonth(run: GameRun, currentMonth: number): GameRun {
  return {
    ...run,
    currentMonth,
  };
}

function createHistoricalSummary(
  month: number,
  feedback: SemesterFeedback,
  actions: string[] = ["study"],
): StructuredMonthlySummary {
  return {
    month,
    actions: actions as StructuredMonthlySummary["actions"],
    attendanceStrategy: "mixed",
    schedule: createMonthlySchedule(month),
    weeklyCalendar: [],
    statsBefore: {
      money: 1000,
      mood: 60,
      stress: 30,
      fulfillment: 40,
      social: 36,
      semesterAcademics: 20,
    },
    statsAfter: {
      money: 1000,
      mood: 60,
      stress: 30,
      fulfillment: 42,
      social: 36,
      semesterAcademics: 48,
    },
    statsDelta: {
      money: 0,
      mood: 0,
      stress: 0,
      fulfillment: 2,
      social: 0,
      semesterAcademics: 28,
    },
    moneyDelta: 0,
    academicFeedback: feedback,
    eventIds: [],
    resumeAdditions: [],
    notableFacts: [],
    resolvedActions: [],
    flags: [],
    cooldowns: {
      askFamilyMonths: 0,
    },
    course: {
      strategy: "mixed",
      attendanceCounted: true,
      directRollCallPenalty: 0,
      rollCallRiskDelta: 0,
      usualScoreRiskDelta: 0,
      proxyCost: 0,
      remedyPressure: 0,
      academicRiskDelta: 0,
      academicGain: 12,
      moodDelta: 0,
      stressDelta: 0,
    },
    turns: [],
  };
}

function studyActionGain(summary: ReturnType<typeof resolveMonthlyTurn>["summary"]): number {
  return summary.statsDelta.semesterAcademics - summary.course.academicGain - summary.course.directRollCallPenalty;
}

describe("opening generation", () => {
  it("keeps qingbei in tier 1 cities and nankai_tianda in tier 2 cities", () => {
    const qingbeiRun = createInitialGameRun({
      id: "run-qingbei",
      randomValues: [0.05, 0.15, 0.55, 0.45, 0.92, 0.03, 0.2, 0.1],
    });
    const nankaiRun = createInitialGameRun({
      id: "run-nankai",
      randomValues: [0.25, 0.35, 0.45, 0.55, 0.25, 0.18, 0.2, 0.3],
    });

    expect(qingbeiRun.profile.schoolTier).toBe("qingbei");
    expect(qingbeiRun.profile.cityTier).toBe("tier_1");
    expect(nankaiRun.profile.schoolTier).toBe("nankai_tianda");
    expect(nankaiRun.profile.cityTier).toBe("tier_2");
  });
});

describe("monthly schedule", () => {
  it("builds a 30 day month with the required free-time distribution", () => {
    const schedule = createMonthlySchedule(1);

    expect(schedule).toHaveLength(30);
    expect(schedule.filter((day) => day.dayType === "free").length).toBe(8);
    expect(schedule.filter((day) => day.dayType === "half_free").length).toBe(8);
    expect(schedule.filter((day) => day.dayType === "busy_day").length).toBe(14);
    expect(
      schedule
        .filter((day) => day.dayType === "busy_day")
        .every((day) => day.availableTimes.includes("night")),
    ).toBe(true);
  });
});

describe("monthly resolution", () => {
  it("enforces ask-family cooldown across months", () => {
    const run = createInitialGameRun({
      id: "allowance-run",
      randomValues: [0.45, 0.45, 0.55, 0.45, 0.62, 0.3, 0.3, 0.3],
    });

    const firstMonth = resolveMonthlyTurn(
      run,
      createDecision("mixed", [
        { action: "ask_family", time: "day" },
        { action: "relax", time: "night" },
      ]),
    );

    const secondMonth = resolveMonthlyTurn(
      firstMonth.run,
      createDecision("mixed", [
        { action: "ask_family", time: "day" },
        { action: "study", time: "night" },
      ]),
    );

    expect(firstMonth.summary.cooldowns.askFamilyMonths).toBe(1);
    expect(secondMonth.summary.flags).toContain("ask-family-on-cooldown");
    expect(secondMonth.run.stats.stress).toBeGreaterThanOrEqual(firstMonth.run.stats.stress);
  });

  it("treats phone usage as attendance while increasing academic risk without direct mood loss", () => {
    const baseRun = createInitialGameRun({
      id: "phone-run",
      randomValues: [0.42, 0.33, 0.51, 0.64, 0.58, 0.45, 0.7, 0.2],
    });

    const phoneMonth = resolveMonthlyTurn(baseRun, createDecision("phone"));
    const mixedMonth = resolveMonthlyTurn(baseRun, createDecision("mixed"));

    expect(phoneMonth.summary.course.attendanceCounted).toBe(true);
    expect(phoneMonth.summary.course.directRollCallPenalty).toBe(0);
    expect(phoneMonth.summary.course.academicRiskDelta).toBeGreaterThan(
      mixedMonth.summary.course.academicRiskDelta,
    );
    expect(phoneMonth.summary.statsDelta.mood).toBeGreaterThanOrEqual(0);
  });

  it("allows only night-safe actions on busy days while still supporting study and relax at night", () => {
    const run = createInitialGameRun({
      id: "time-run",
      randomValues: [0.61, 0.11, 0.23, 0.35, 0.49, 0.71, 0.12, 0.88],
    });

    const result = resolveMonthlyTurn(
      run,
      createDecision("serious", [
        { action: "part_time", time: "night" },
        { action: "study", time: "night" },
        { action: "relax", time: "night" },
      ]),
    );

    expect(result.summary.flags).toContain("invalid-night-part-time");
    expect(result.summary.resolvedActions.some((item) => item.action === "study")).toBe(true);
    expect(result.summary.resolvedActions.some((item) => item.action === "relax")).toBe(true);
  });

  it("resolves fixed events from data instead of hardcoding them in the engine", () => {
    const run = createInitialGameRun({
      id: "event-run",
      randomValues: [0.19, 0.21, 0.37, 0.49, 0.55, 0.66, 0.77, 0.88],
    });

    const result = resolveMonthlyTurn(run, createDecision("serious"));

    expect(result.summary.eventIds.length).toBeGreaterThan(0);
    expect(result.summary.notableFacts.some((fact) => fact.includes("event:"))).toBe(true);
  });

  it("keeps the turn in the same week until time is exhausted while settling weekly costs once per week", () => {
    const run = withMonth(
      createInitialGameRun({
        id: "big-meal-run",
        randomValues: [0.53, 0.31, 0.42, 0.57, 0.63, 0.21, 0.34, 0.45],
      }),
      3,
    );
    const weeklyAllowance = getWeeklyAllowance(run);
    const weeklyExpense = getWeeklyLivingExpense(run);

    const mealBeforeWeek = resolveActionTurn(run, {
      attendanceStrategy: "mixed",
      action: createBigMealAction(),
    });
    const firstWeekStudy = resolveActionTurn(mealBeforeWeek.run, {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "day" },
    });
    const forcedWeekEnd = resolveWeekEnd(firstWeekStudy.run, "mixed");
    const mealBetweenWeeks = resolveActionTurn(forcedWeekEnd.run, {
      attendanceStrategy: "mixed",
      action: createBigMealAction(),
    });
    const secondWeekStudy = resolveActionTurn(mealBetweenWeeks.run, {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "day" },
    });

    expect(mealBeforeWeek.turnSummary.advancesCalendar).toBe(false);
    expect(mealBeforeWeek.turnSummary.moneyDelta).toBe(-180);
    expect(mealBeforeWeek.run.activeMonth?.currentWeek).toBe(1);
    expect(mealBeforeWeek.turnSummary.weekTimeBefore).toBe(mealBeforeWeek.turnSummary.weekTimeAfter);
    expect(mealBeforeWeek.turnSummary.statsDelta.mood).toBe(8);
    expect(mealBeforeWeek.turnSummary.statsDelta.stress).toBe(-6);

    expect(firstWeekStudy.turnSummary.advancesCalendar).toBe(true);
    expect(firstWeekStudy.turnSummary.moneyDelta).toBe(weeklyAllowance - weeklyExpense);
    expect(firstWeekStudy.run.activeMonth?.currentWeek).toBe(1);
    expect(firstWeekStudy.turnSummary.weekTimeAfter).toBeLessThan(firstWeekStudy.turnSummary.weekTimeBefore!);

    expect(forcedWeekEnd.run.activeMonth?.currentWeek).toBe(2);

    expect(mealBetweenWeeks.turnSummary.advancesCalendar).toBe(false);
    expect(mealBetweenWeeks.turnSummary.moneyDelta).toBe(-180);
    expect(mealBetweenWeeks.run.activeMonth?.currentWeek).toBe(2);

    expect(secondWeekStudy.turnSummary.advancesCalendar).toBe(true);
    expect(secondWeekStudy.turnSummary.moneyDelta).toBe(weeklyAllowance - weeklyExpense);
    expect(secondWeekStudy.run.activeMonth?.currentWeek).toBe(2);
  });

  it("reduces study gains on repeated months and when the player is overstressed", () => {
    const baseRun = withMonth(
      createInitialGameRun({
        id: "study-balance-run",
        randomValues: [0.48, 0.22, 0.36, 0.52, 0.68, 0.19, 0.28, 0.41],
      }),
      3,
    );

    const firstMonth = resolveMonthlyTurn(
      baseRun,
      createDecision("mixed", [{ action: "study", time: "day" }]),
    );
    const secondMonth = resolveMonthlyTurn(
      firstMonth.run,
      createDecision("mixed", [{ action: "study", time: "day" }]),
    );
    const stressedRun = {
      ...baseRun,
      stats: {
        ...baseRun.stats,
        stress: 86,
        mood: 18,
      },
    };
    const stressedMonth = resolveMonthlyTurn(
      stressedRun,
      createDecision("mixed", [{ action: "study", time: "day" }]),
    );

    expect(studyActionGain(firstMonth.summary)).toBeGreaterThan(studyActionGain(secondMonth.summary));
    expect(studyActionGain(firstMonth.summary)).toBeGreaterThan(studyActionGain(stressedMonth.summary));
  });

  it("keeps weekly living costs above a basic ordinary allowance so money pressure persists", () => {
    const baseRun = withMonth(
      createInitialGameRun({
        id: "weekly-money-pressure-run",
        randomValues: [0.24, 0.34, 0.41, 0.52, 0.68, 0.19, 0.28, 0.41],
      }),
      4,
    );
    const pressuredRun: GameRun = {
      ...baseRun,
      profile: {
        ...baseRun.profile,
        familyBackground: "ordinary",
        cityTier: "tier_2",
        monthlyAllowance: 1400,
      },
      stats: {
        ...baseRun.stats,
        money: 1400,
      },
    };
    let nextRun = pressuredRun;

    for (let week = 0; week < 4; week += 1) {
      const actionResult = resolveActionTurn(nextRun, {
        attendanceStrategy: "mixed",
        action: { action: "study", time: "night" },
      });
      const weekEndResult = resolveWeekEnd(actionResult.run, "mixed");
      nextRun = weekEndResult.run;
    }

    expect(getWeeklyLivingExpense(pressuredRun)).toBeGreaterThan(getWeeklyAllowance(pressuredRun));
    expect(nextRun.stats.money).toBeLessThan(pressuredRun.stats.money);
  });

  it("still settles weekly allowance and living costs when the player ends a week after only zero-time actions", () => {
    const run = withMonth(
      createInitialGameRun({
        id: "zero-time-week-end-run",
        randomValues: [0.31, 0.24, 0.4, 0.52, 0.68, 0.19, 0.28, 0.41],
      }),
      4,
    );
    const weeklyBudgetDelta = getWeeklyAllowance(run) - getWeeklyLivingExpense(run);

    const mealTurn = resolveActionTurn(run, {
      attendanceStrategy: "mixed",
      action: createBigMealAction(),
    });
    const endedWeek = resolveWeekEnd(mealTurn.run, "mixed");

    expect(mealTurn.turnSummary.advancesCalendar).toBe(false);
    expect(endedWeek.run.activeMonth?.currentWeek).toBe(2);
    expect(endedWeek.run.stats.money).toBe(run.stats.money - 180 + weeklyBudgetDelta);
  });

  it("reduces study gains across repeated weekly turns in the same month", () => {
    const run = withMonth(
      createInitialGameRun({
        id: "weekly-study-diminish-run",
        randomValues: [0.44, 0.28, 0.36, 0.52, 0.68, 0.19, 0.28, 0.41],
      }),
      3,
    );

    const firstTurn = resolveActionTurn(run, {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "night" },
    });
    const secondTurn = resolveActionTurn(firstTurn.run, {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "night" },
    });

    expect(firstTurn.turnSummary.statsDelta.semesterAcademics).toBeLessThanOrEqual(5);
    expect(firstTurn.turnSummary.statsDelta.semesterAcademics).toBeGreaterThan(
      secondTurn.turnSummary.statsDelta.semesterAcademics,
    );
  });

  it("collapses study efficiency under high stress and low mood", () => {
    const baseRun = withMonth(
      createInitialGameRun({
        id: "study-collapse-run",
        randomValues: [0.39, 0.28, 0.36, 0.52, 0.68, 0.19, 0.28, 0.41],
      }),
      6,
    );
    const stressedRun: GameRun = {
      ...baseRun,
      stats: {
        ...baseRun.stats,
        stress: 88,
        mood: 18,
      },
    };

    const result = resolveActionTurn(stressedRun, {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "night" },
    });

    expect(result.turnSummary.flags).toContain("stress-efficiency-penalty");
    expect(result.turnSummary.flags).toContain("study-efficiency-collapsed");
    expect(result.turnSummary.statsDelta.semesterAcademics).toBeLessThanOrEqual(2);
  });

  it("changes event weights with stress, social, academics, and money state", () => {
    const baseRun = createInitialGameRun({
      id: "state-event-weight-run",
      randomValues: [0.14, 0.23, 0.4, 0.51, 0.62, 0.18, 0.29, 0.33],
    });
    const stressedRun: GameRun = {
      ...withMonth(baseRun, 6),
      stats: {
        ...baseRun.stats,
        stress: 88,
        mood: 18,
      },
    };
    const socialRun: GameRun = {
      ...withMonth(baseRun, 6),
      stats: {
        ...baseRun.stats,
        social: 78,
      },
    };
    const scholarshipRun: GameRun = {
      ...withMonth(baseRun, 6),
      monthlySummaries: [
        createHistoricalSummary(4, "excellent"),
        createHistoricalSummary(5, "excellent"),
      ],
      stats: {
        ...baseRun.stats,
        semesterAcademics: 58,
      },
    };
    const lowMoneyRun: GameRun = {
      ...withMonth(baseRun, 5),
      stats: {
        ...baseRun.stats,
        money: -1900,
      },
    };

    expect(getMonthlyEventWeight(stressedRun, 6, "burnout-slump")).toBeGreaterThan(
      getMonthlyEventWeight(baseRun, 6, "burnout-slump"),
    );
    expect(getMonthlyEventWeight(socialRun, 6, "social-mutual-aid")).toBeGreaterThan(
      getMonthlyEventWeight(baseRun, 6, "social-mutual-aid"),
    );
    expect(getMonthlyEventWeight(scholarshipRun, 6, "academic-scholarship")).toBeGreaterThan(
      getMonthlyEventWeight(baseRun, 6, "academic-scholarship"),
    );
    expect(getMonthlyEventWeight(lowMoneyRun, 5, "economic-pressure")).toBeGreaterThan(
      getMonthlyEventWeight(baseRun, 5, "economic-pressure"),
    );
  });

  it("adds a fallback monthly event when no state-linked event is selected", () => {
    const run = withMonth(
      createInitialGameRun({
        id: "fallback-event-run",
        randomValues: [0.22, 0.27, 0.39, 0.41, 0.63, 0.18, 0.34, 0.29],
      }),
      8,
    );

    const result = resolveMonthlyTurn(
      run,
      createDecision("mixed", [{ action: "relax", time: "night" }]),
    );

    expect(result.summary.eventIds.length).toBeGreaterThan(0);
    expect(result.summary.eventIds).toContain("monthly-routine-reset");
  });

  it("resolves state-linked monthly events for high stress, high social, high academics, and low money", () => {
    const baseRun = createInitialGameRun({
      id: "state-linked-event-run",
      randomValues: [0.17, 0.24, 0.4, 0.51, 0.62, 0.18, 0.29, 0.33],
    });
    const highStressRun: GameRun = {
      ...withMonth(baseRun, 6),
      stats: {
        ...baseRun.stats,
        stress: 86,
        mood: 46,
      },
    };
    const highSocialRun: GameRun = {
      ...withMonth(baseRun, 6),
      stats: {
        ...baseRun.stats,
        social: 78,
      },
    };
    const highAcademicRun: GameRun = {
      ...withMonth(baseRun, 6),
      monthlySummaries: [
        createHistoricalSummary(4, "excellent"),
        createHistoricalSummary(5, "excellent"),
      ],
      stats: {
        ...baseRun.stats,
        semesterAcademics: 58,
      },
    };
    const lowMoneyRun: GameRun = {
      ...withMonth(baseRun, 6),
      stats: {
        ...baseRun.stats,
        money: -1200,
      },
    };

    const highStressMonth = resolveMonthlyTurn(
      highStressRun,
      createDecision("mixed", [{ action: "relax", time: "night" }]),
    );
    const highSocialMonth = resolveMonthlyTurn(
      highSocialRun,
      createDecision("mixed", [{ action: "relax", time: "night" }]),
    );
    const highAcademicMonth = resolveMonthlyTurn(
      highAcademicRun,
      createDecision("mixed", [{ action: "study", time: "night" }]),
    );
    const lowMoneyMonth = resolveMonthlyTurn(
      lowMoneyRun,
      createDecision("mixed", [{ action: "study", time: "night" }]),
    );

    expect(highStressMonth.summary.eventIds).toContain("stress-surge");
    expect(highSocialMonth.summary.eventIds).toContain("social-mutual-aid");
    expect(["academic-scholarship", "teacher-attention"]).toContain(highAcademicMonth.summary.eventIds[0]);
    expect(lowMoneyMonth.summary.eventIds).toContain("economic-pressure");
  });

  it("penalizes overloaded players with refusal events and rejected productive actions", () => {
    const baseRun = withMonth(
      createInitialGameRun({
        id: "burnout-run",
        randomValues: [0.32, 0.26, 0.47, 0.59, 0.67, 0.24, 0.35, 0.46],
      }),
      7,
    );
    const burnoutRun: GameRun = {
      ...baseRun,
      stats: {
        ...baseRun.stats,
        stress: 92,
        mood: 8,
      },
      risk: {
        ...baseRun.risk,
        burnout: 18,
      },
    };

    const result = resolveMonthlyTurn(
      burnoutRun,
      createDecision("mixed", [
        { action: "study", time: "day" },
        { action: "job_prep", time: "night" },
      ]),
    );

    expect(result.summary.eventIds).toContain("burnout-slump");
    expect(result.summary.flags).toContain("state-refused-study");
    expect(result.summary.flags).toContain("state-refused-work");
    expect(result.summary.resolvedActions.some((item) => item.reason === "state-refused-study")).toBe(true);
    expect(result.summary.resolvedActions.some((item) => item.reason === "state-refused-work")).toBe(true);
  });
});

describe("semester and ending evaluation", () => {
  it("maps academic value bands to stable statuses and resets semester academics on settlement", () => {
    expect(evaluateSemesterFeedback(92)).toBe("excellent");
    expect(evaluateSemesterFeedback(72)).toBe("stable");
    expect(evaluateSemesterFeedback(58)).toBe("strained");
    expect(evaluateSemesterFeedback(42)).toBe("warning");
    expect(evaluateSemesterFeedback(18)).toBe("critical");

    const run = createInitialGameRun({
      id: "semester-run",
      randomValues: [0.31, 0.28, 0.4, 0.55, 0.73, 0.51, 0.22, 0.44],
    });

    const afterMonth = resolveMonthlyTurn(run, createDecision("serious"));
    const settled = settleSemester(afterMonth.run);

    expect(settled.summary.feedback).toMatch(/excellent|stable|strained|warning|critical/);
    expect(settled.run.stats.semesterAcademics).toBe(0);
    expect(settled.run.semesters).toHaveLength(1);
  });

  it("graduates by default but escalates to delay or dropout after repeated academic collapse", () => {
    const healthyRun = createInitialGameRun({
      id: "healthy-run",
      randomValues: [0.16, 0.25, 0.44, 0.52, 0.61, 0.2, 0.35, 0.4],
    });

    const failingRun: GameRun = {
      ...healthyRun,
      currentYear: 4,
      semesters: [
        { semester: 1, academicScore: 22, feedback: "critical", passed: false },
        { semester: 2, academicScore: 18, feedback: "critical", passed: false },
        { semester: 3, academicScore: 35, feedback: "warning", passed: false },
        { semester: 4, academicScore: 28, feedback: "critical", passed: false },
        { semester: 5, academicScore: 25, feedback: "critical", passed: false },
        { semester: 6, academicScore: 32, feedback: "warning", passed: false },
        { semester: 7, academicScore: 15, feedback: "critical", passed: false },
        { semester: 8, academicScore: 19, feedback: "critical", passed: false },
      ],
      riskFlags: ["chronic_failure", "financial_instability", "burnout"],
    };

    expect(evaluateGraduationOutcome(healthyRun).outcome).toBe("graduate");
    expect(["delayed", "cannot_graduate", "drop_out"]).toContain(
      evaluateGraduationOutcome(failingRun).outcome,
    );
  });

  it("settles competition projects at semester end with a minimum effort threshold", () => {
    const baseRun = ensureProgressionState(
      createInitialGameRun({
        id: "competition-longline-run",
        randomValues: [0.16, 0.25, 0.44, 0.52, 0.61, 0.2, 0.35, 0.4],
      }),
    );
    const activeProject = baseRun.competitionProjects?.[0];
    const underInvestedRun: GameRun = {
      ...baseRun,
      competitionProjects: baseRun.competitionProjects?.map((project, index) =>
        index === 0 && activeProject
          ? { ...project, status: "active", investedDays: activeProject.minimumEffortDays - 1 }
          : project,
      ),
    };
    const investedRun: GameRun = {
      ...baseRun,
      competitionProjects: baseRun.competitionProjects?.map((project, index) =>
        index === 0 && activeProject
          ? { ...project, status: "active", investedDays: activeProject.minimumEffortDays + 3 }
          : project,
      ),
    };

    const expired = settleLongTermProgression(underInvestedRun, {
      playedYear: 1,
      playedMonth: 6,
    });
    const awarded = settleLongTermProgression(investedRun, {
      playedYear: 1,
      playedMonth: 6,
    });

    expect(expired.run.competitionProjects?.[0]?.status).toBe("expired");
    expect(awarded.run.competitionProjects?.some((project) => project.result)).toBe(true);
    expect(awarded.resumeAdditions.some((item) => item.category === "competition")).toBe(true);
  });

  it("awards scholarships only from the second academic year onward", () => {
    const baseRun = ensureProgressionState(
      createInitialGameRun({
        id: "scholarship-award-run",
        randomValues: [0.19, 0.25, 0.44, 0.52, 0.61, 0.2, 0.35, 0.4],
      }),
    );
    const yearOneRun: GameRun = {
      ...baseRun,
      currentYear: 2,
      currentMonth: 1,
      semesters: [
        { semester: 1, academicScore: 88, feedback: "excellent", passed: true },
        { semester: 2, academicScore: 84, feedback: "excellent", passed: true },
      ],
    };

    const scholarshipResult = settleLongTermProgression(yearOneRun, {
      playedYear: 1,
      playedMonth: 12,
    });

    expect(scholarshipResult.scholarshipAwarded).toBeDefined();
    expect(["standard", "high", "none"]).toContain(scholarshipResult.scholarshipAwarded?.level ?? "none");
    expect(scholarshipResult.run.scholarships?.length).toBeGreaterThan(0);
  });

  it("judges recommendation qualification in the second half of junior year from academics and resume weight", () => {
    const baseRun = ensureProgressionState(
      createInitialGameRun({
        id: "recommendation-run",
        randomValues: [0.05, 0.15, 0.55, 0.45, 0.92, 0.03, 0.2, 0.1],
      }),
    );
    const strongRun: GameRun = {
      ...baseRun,
      currentYear: 3,
      currentMonth: 7,
      semesterAverage: 88,
      semesters: [
        { semester: 1, academicScore: 90, feedback: "excellent", passed: true },
        { semester: 2, academicScore: 88, feedback: "excellent", passed: true },
        { semester: 3, academicScore: 91, feedback: "excellent", passed: true },
        { semester: 4, academicScore: 87, feedback: "excellent", passed: true },
      ],
      resume: [
        {
          id: "res-1",
          category: "competition",
          title: "National Modeling Contest",
          summary: "Won a national-level award.",
          month: 6,
          tags: ["competition", "national"],
        },
      ],
      scholarships: [
        {
          id: "sch-1",
          academicYear: 2,
          level: "high",
          amount: 5000,
          title: "高等级奖学金",
          reason: "Strong performance.",
        },
      ],
      competitionProjects: baseRun.competitionProjects?.map((project, index) =>
        index === 0 ? { ...project, status: "completed", result: { level: "national", rank: "second" } } : project,
      ),
    };

    expect(["eligible", "borderline"]).toContain(evaluateRecommendationQualification(strongRun));
  });

  it("auto-fills missing weekdays as default loafing when confirming a planned week", () => {
    const baseRun = createInitialGameRun({
      id: "auto-fill-idle-run",
      randomValues: [0.31, 0.28, 0.4, 0.55, 0.73, 0.51, 0.22, 0.44],
    });
    const withAttendance = selectWeekAttendanceStrategy(baseRun, "mixed");
    const partiallyPlanned = planWeeklyDayAction({
      run: withAttendance,
      weekday: "mon",
      optionId: "study",
    });

    const result = confirmPlannedWeek(partiallyPlanned);
    const settlement = result.run.activeMonth?.latestWeekSettlement;

    expect(result.monthCompleted).toBe(false);
    expect(settlement?.dailyResults).toHaveLength(7);
    expect(settlement?.dailyResults.filter((day) => day.resolvedAction.action === "idle")).toHaveLength(6);
    expect(settlement?.dailyResults.some((day) => day.resolvedAction.autoFilled)).toBe(true);
  });

  it("explains weekly allowance and fixed living costs in weekly settlement", () => {
    const baseRun = createInitialGameRun({
      id: "weekly-budget-run",
      randomValues: [0.18, 0.24, 0.31, 0.41, 0.52, 0.61, 0.74, 0.28],
    });
    const withAttendance = selectWeekAttendanceStrategy(baseRun, "mixed");
    const result = confirmPlannedWeek(withAttendance);
    const settlement = result.run.activeMonth?.latestWeekSettlement;

    expect(settlement?.budgetLines?.some((line) => line.includes("生活费到账"))).toBe(true);
    expect(settlement?.budgetLines?.some((line) => line.includes(`${getWeeklyLivingExpense(withAttendance)} 元`))).toBe(true);
    expect(settlement?.dailyResults.every((day) => day.notableFacts.some((fact) => fact.startsWith("daily-living-cost:")))).toBe(true);
  });

  it("closes a competition project line after skipping its briefing day", () => {
    const baseRun = createInitialGameRun({
      id: "competition-skip-run",
      randomValues: [0.44, 0.2, 0.36, 0.58, 0.62, 0.48, 0.21, 0.39],
    });
    const withAttendance = selectWeekAttendanceStrategy(baseRun, "mixed");
    const project = withAttendance.competitionProjects?.find((item) => item.status === "open");

    expect(project).toBeDefined();

    const runWithEvent = {
      ...withAttendance,
      activeMonth: {
        ...withAttendance.activeMonth!,
        currentWeekState: {
          ...withAttendance.activeMonth!.currentWeekState,
          event: {
            id: "weekly-competition-invite",
            title: `《${project!.title}》说明会 / 招募会`,
            summary: `这周会接触到“${project!.title}”这条长期比赛 / 项目线。`,
            weekday: "sat" as const,
            effectDescription: "周六会撞上一场项目说明会。",
            specialAction: {
              optionId: `weekly-competition-invite-attend:${project!.id}`,
              action: "student_activity" as const,
              label: `参加《${project!.title}》说明会`,
              description: "先去听说明会，把这条项目线接起来。",
              availability: ["night", "half_day", "full_day"] as WeeklyActionOption["availability"],
              source: "weekly_event" as const,
              sourceEventId: "weekly-competition-invite",
            },
            linkedProjectId: project!.id,
            linkedProjectTitle: project!.title,
            skipClosesProjectLine: true,
            defaultAttendIfUnplanned: true,
          },
        },
      },
    };
    const planned = {
      ...runWithEvent,
      activeMonth: {
        ...runWithEvent.activeMonth!,
        currentWeekState: {
          ...runWithEvent.activeMonth!.currentWeekState,
          days: runWithEvent.activeMonth!.currentWeekState.days?.map((day) =>
            day.weekday === "sat"
              ? {
                  ...day,
                  plannedAction: {
                    action: "social" as const,
                    optionId: "social",
                    label: "社交 / 关系",
                    time: "day" as const,
                    weekday: "sat" as const,
                  },
                  planningStatus: "planned" as const,
                }
              : day,
          ),
        },
      },
    };
    const result = confirmPlannedWeek(planned);
    const updatedProject = result.run.competitionProjects?.find((item) => item.id === project!.id);
    const saturdayResult = result.run.activeMonth?.latestWeekSettlement?.dailyResults.find((day) => day.weekday === "sat");

    expect(updatedProject?.status).toBe("expired");
    expect(saturdayResult?.notableFacts).toContain(`weekly-event:competition-skipped:${project!.title}`);
  });
});
