import { describe, expect, it } from "vitest";

import { renderMonthlyJournalFallback } from "@/lib/ai/reports";
import type { MonthlyJournalPromptInput } from "@/types/ai";

const input: MonthlyJournalPromptInput = {
  kind: "monthly_journal",
  runId: "run-direction",
  year: 3,
  month: 9,
  summary: {
    month: 9,
    actions: ["competition_project", "postgraduate_prep", "public_exam_prep"],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: {
      money: 1200,
      mood: 55,
      stress: 42,
      fulfillment: 40,
      social: 36,
      semesterAcademics: 60,
    },
    statsAfter: {
      money: 980,
      mood: 63,
      stress: 46,
      fulfillment: 54,
      social: 38,
      semesterAcademics: 74,
    },
    statsDelta: {
      money: -220,
      mood: 8,
      stress: 4,
      fulfillment: 14,
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
        summary: "完成了长期项目答辩。",
        month: 9,
        tags: ["competition"],
      },
    ],
    notableFacts: ["recommendation:borderline", "scholarship:standard:3"],
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
        postgraduate: 22,
        public_exam: 16,
        recommendation: 28,
        undecided: 4,
      },
      dominantDirection: "recommendation",
      publicExam: {
        progress: 24,
        aptitudePrep: 16,
        essayPrep: 12,
      },
      postgraduateProgress: 30,
      employmentReadiness: 12,
      recommendationReadiness: 36,
      recommendationQualification: "borderline",
      latestHints: [],
    },
  },
};

describe("monthly report direction cues", () => {
  it("lets the fallback journal mention an emerging future path", () => {
    const report = renderMonthlyJournalFallback(input);

    expect(report.markdown).toContain("推免");
    expect(report.markdown).toContain("这个月");
  });
});
