import { describe, expect, it } from "vitest";

import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import type { StructuredMonthlySummary } from "@/types/game";

function createSummary(): StructuredMonthlySummary {
  return {
    month: 9,
    actions: ["competition_project", "postgraduate_prep", "public_exam_prep"],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: {
      money: 1200,
      mood: 58,
      stress: 44,
      fulfillment: 46,
      social: 40,
      semesterAcademics: 64,
    },
    statsAfter: {
      money: 980,
      mood: 61,
      stress: 49,
      fulfillment: 58,
      social: 42,
      semesterAcademics: 78,
    },
    statsDelta: {
      money: -220,
      mood: 3,
      stress: 5,
      fulfillment: 12,
      social: 2,
      semesterAcademics: 14,
    },
    moneyDelta: -220,
    academicFeedback: "excellent",
    eventIds: [],
    resumeAdditions: [
      {
        id: "resume-1",
        category: "competition",
        title: "省级项目赛二等奖",
        summary: "推进了学期里的长期项目。",
        month: 9,
        tags: ["competition"],
      },
    ],
    notableFacts: [
      "competition:省级项目赛:provincial-second",
      "recommendation:borderline",
      "scholarship:standard:3",
    ],
    resolvedActions: [],
    flags: [],
    cooldowns: {
      askFamilyMonths: 0,
    },
    course: {
      strategy: "mixed",
      attendanceCounted: true,
      directRollCallPenalty: 0,
      rollCallRiskDelta: 1,
      usualScoreRiskDelta: 1,
      proxyCost: 0,
      remedyPressure: 0,
      academicRiskDelta: 1,
      academicGain: 6,
      moodDelta: 0,
      stressDelta: 1,
    },
    turns: [],
    progression: {
      tendencies: {
        employment: 12,
        postgraduate: 24,
        public_exam: 18,
        recommendation: 28,
        undecided: 4,
      },
      dominantDirection: "recommendation",
      publicExam: {
        progress: 24,
        aptitudePrep: 16,
        essayPrep: 12,
      },
      postgraduateProgress: 32,
      employmentReadiness: 14,
      recommendationReadiness: 36,
      recommendationQualification: "borderline",
      latestHints: [],
    },
    scholarshipAwarded: {
      id: "sch-1",
      academicYear: 3,
      level: "standard",
      amount: 2000,
      title: "普通奖学金",
      reason: "上一学年的整体表现比较稳。",
    },
  };
}

describe("monthly digest direction shaping", () => {
  it("adds emerging direction hints into the monthly digest", () => {
    const digest = buildMonthlyDiaryDigest(createSummary(), 3, 9);

    expect(digest.keyMoments.some((line) => line.includes("推免") || line.includes("方向"))).toBe(true);
    expect(digest.coreChanges.some((line) => line.includes("公考进度"))).toBe(true);
  });

  it("lets growth journal explain what the month is shaping toward", () => {
    const journal = buildGrowthJournalEntry(createSummary(), 3, 9);

    expect(journal.message).toContain("方向");
    expect(journal.details.some((line) => line.includes("推免") || line.includes("公考"))).toBe(true);
  });
});
