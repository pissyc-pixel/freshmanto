import { describe, expect, it } from "vitest";

import {
  createInitialGameRun,
  createMonthlySchedule,
  evaluateGraduationOutcome,
  resolveMonthlyTurn,
  settleSemester,
} from "@/core/game-engine";
import { evaluateSemesterFeedback } from "@/core/resolvers";
import type { CourseAttendanceStrategy, GameRun, MonthlyActionPlan } from "@/types/game";

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
  it("pays allowance every month and enforces ask-family cooldown", () => {
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

    expect(firstMonth.summary.moneyDelta).toBeGreaterThanOrEqual(run.profile.monthlyAllowance);
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
});
