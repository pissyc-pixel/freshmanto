import { describe, expect, it } from "vitest";

import { buildGrowthJournalEntry, buildMonthlyDiaryDigest, normalizeMonthlySummary } from "@/lib/demo/monthly-digest";
import type { StructuredMonthlySummary } from "@/types/game";

function createMinimalSummary(overrides?: Partial<StructuredMonthlySummary>): StructuredMonthlySummary {
  return {
    month: 1,
    actions: [],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: { money: 1000, mood: 60, stress: 40, fulfillment: 35, social: 30, semesterAcademics: 50 },
    statsAfter: { money: 800, mood: 55, stress: 45, fulfillment: 38, social: 32, semesterAcademics: 55 },
    statsDelta: { money: -200, mood: -5, stress: 5, fulfillment: 3, social: 2, semesterAcademics: 5 },
    moneyDelta: -200,
    academicFeedback: "stable",
    eventIds: [],
    resumeAdditions: [],
    notableFacts: [],
    resolvedActions: [],
    flags: [],
    cooldowns: { askFamilyMonths: 0 },
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
    turns: [],
    ...overrides,
  };
}

describe("normalizeMonthlySummary", () => {
  it("fills missing statsBefore/statsAfter/statsDelta with zero-filled defaults", () => {
    const summary = createMinimalSummary({
      statsBefore: undefined as unknown as StructuredMonthlySummary["statsBefore"],
      statsAfter: undefined as unknown as StructuredMonthlySummary["statsAfter"],
      statsDelta: undefined as unknown as StructuredMonthlySummary["statsDelta"],
    });

    const result = normalizeMonthlySummary(summary);

    expect(result.statsBefore).toEqual({ money: 0, mood: 0, stress: 0, fulfillment: 0, social: 0, semesterAcademics: 0 });
    expect(result.statsAfter).toEqual({ money: 0, mood: 0, stress: 0, fulfillment: 0, social: 0, semesterAcademics: 0 });
    expect(result.statsDelta).toEqual({ money: 0, mood: 0, stress: 0, fulfillment: 0, social: 0, semesterAcademics: 0 });
  });

  it("fills partial stats objects with zeros for missing properties", () => {
    const summary = createMinimalSummary({
      statsDelta: { money: -100 } as unknown as StructuredMonthlySummary["statsDelta"],
    });

    const result = normalizeMonthlySummary(summary);

    expect(result.statsDelta.money).toBe(-100);
    expect(result.statsDelta.mood).toBe(0);
    expect(result.statsDelta.stress).toBe(0);
    expect(result.statsDelta.fulfillment).toBe(0);
    expect(result.statsDelta.social).toBe(0);
    expect(result.statsDelta.semesterAcademics).toBe(0);
  });

  it("preserves complete stats objects unchanged", () => {
    const summary = createMinimalSummary();
    const result = normalizeMonthlySummary(summary);

    expect(result.statsBefore).toEqual(summary.statsBefore);
    expect(result.statsAfter).toEqual(summary.statsAfter);
    expect(result.statsDelta).toEqual(summary.statsDelta);
  });

  it("uses statsBefore as fallback for missing statsAfter", () => {
    const summary = createMinimalSummary({
      statsAfter: undefined as unknown as StructuredMonthlySummary["statsAfter"],
    });

    const result = normalizeMonthlySummary(summary);

    expect(result.statsAfter).toEqual(summary.statsBefore);
  });
});

describe("buildGrowthJournalEntry with partial data", () => {
  it("does not produce strings containing 'undefined' when statsDelta is partial", () => {
    const summary = createMinimalSummary({
      statsDelta: { money: -100 } as unknown as StructuredMonthlySummary["statsDelta"],
    });

    const entry = buildGrowthJournalEntry(summary, 1, 1);

    expect(entry.title).not.toContain("undefined");
    expect(entry.message).not.toContain("undefined");
    entry.details.forEach((detail) => {
      expect(detail).not.toContain("undefined");
    });
  });

  it("does not produce strings containing 'undefined' when progression is missing", () => {
    const summary = createMinimalSummary({
      progression: undefined,
    } as unknown as Partial<StructuredMonthlySummary>);

    const entry = buildGrowthJournalEntry(summary, 1, 1);

    expect(entry.title).not.toContain("undefined");
    expect(entry.message).not.toContain("undefined");
  });
});

describe("buildMonthlyDiaryDigest with partial data", () => {
  it("produces valid output when progression, competitionProjects, scholarshipAwarded are all missing", () => {
    const summary = createMinimalSummary({
      progression: undefined,
      competitionProjects: undefined,
      scholarshipAwarded: undefined,
    } as unknown as Partial<StructuredMonthlySummary>);

    const digest = buildMonthlyDiaryDigest(summary, 1, 1);

    expect(digest.monthLabel).toBeTruthy();
    expect(digest.directionSignal).toBeTruthy();
    expect(digest.moneyStory).toBeTruthy();
    expect(digest.endState.money).toBe(800);
  });

  it("produces moneyStory reflecting large spending", () => {
    const summary = createMinimalSummary({
      statsDelta: { money: -700, mood: 0, stress: 0, fulfillment: 0, social: 0, semesterAcademics: 0 },
    });

    const digest = buildMonthlyDiaryDigest(summary, 1, 1);

    expect(digest.moneyStory).toContain("700");
    expect(digest.moneyStory).toContain("紧");
  });

  it("produces moneyStory reflecting income", () => {
    const summary = createMinimalSummary({
      statsDelta: { money: 400, mood: 0, stress: 0, fulfillment: 0, social: 0, semesterAcademics: 0 },
    });

    const digest = buildMonthlyDiaryDigest(summary, 1, 1);

    expect(digest.moneyStory).toContain("缓");
  });
});
