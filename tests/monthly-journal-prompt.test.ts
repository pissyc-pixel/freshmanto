import { describe, expect, it } from "vitest";

import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import type { MonthlyJournalPromptInput } from "@/types/ai";

const input: MonthlyJournalPromptInput = {
  kind: "monthly_journal",
  runId: "prompt-run",
  year: 1,
  month: 2,
  summary: {
    month: 2,
    actions: ["study", "social"],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: {
      money: 1200,
      mood: 55,
      stress: 38,
      fulfillment: 40,
      social: 35,
      semesterAcademics: 58,
    },
    statsAfter: {
      money: 940,
      mood: 58,
      stress: 44,
      fulfillment: 44,
      social: 42,
      semesterAcademics: 66,
    },
    statsDelta: {
      money: -260,
      mood: 3,
      stress: 6,
      fulfillment: 4,
      social: 7,
      semesterAcademics: 8,
    },
    moneyDelta: -260,
    academicFeedback: "stable",
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
      academicGain: 0,
      moodDelta: 0,
      stressDelta: 0,
    },
    turns: [],
  },
};

describe("monthly journal prompt safeguards", () => {
  it("requires first-person voice, summary grounding, and anti-fabrication rules", () => {
    const prompt = buildMonthlyJournalPrompt(input);
    const promptText = prompt.messages.map((message) => message.content).join("\n");

    expect(promptText).toContain("第一人称");
    expect(promptText).toContain("私人日记");
    expect(promptText).toContain("深夜");
    expect(promptText).toMatch(/不得编造|不要编造|只能源于/);
    expect(promptText).toMatch(/不要写成总结报告|不要写成系统旁白|不要出现 markdown 标题/);
  });
});
