import { afterEach, describe, expect, it, vi } from "vitest";
import type { MonthlyJournalPromptInput } from "@/types/ai";

function createMonthlyInput(): MonthlyJournalPromptInput {
  return {
    kind: "monthly_journal",
    runId: "ai-timeout-run",
    year: 1,
    month: 1,
    summary: {
      month: 1,
      actions: ["study", "relax"],
      attendanceStrategy: "mixed",
      schedule: [],
      weeklyCalendar: [],
      statsBefore: {
        money: 1090,
        mood: 55,
        stress: 40,
        fulfillment: 35,
        social: 30,
        semesterAcademics: 45,
      },
      statsAfter: {
        money: 860,
        mood: 58,
        stress: 42,
        fulfillment: 39,
        social: 30,
        semesterAcademics: 50,
      },
      statsDelta: {
        money: -230,
        mood: 3,
        stress: 2,
        fulfillment: 4,
        social: 0,
        semesterAcademics: 5,
      },
      moneyDelta: -230,
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
        rollCallRiskDelta: 1,
        usualScoreRiskDelta: 1,
        proxyCost: 0,
        remedyPressure: 1,
        academicRiskDelta: 1,
        academicGain: 3,
        moodDelta: 0,
        stressDelta: 1,
      },
      turns: [],
    },
  };
}

describe("AI report fallback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("falls back quickly when the configured model call exceeds AI_REPORT_TIMEOUT_MS", async () => {
    vi.stubEnv("OPENAI_MODEL", "slow-model");
    vi.doMock("@/lib/ai/config", () => ({
      aiConfig: {
        apiKey: "test-key",
        baseUrl: "https://example.test/v1",
        reportTimeoutMs: 1,
      },
      isAiConfigured: () => true,
      getAiReportTimeoutMs: () => 1,
    }));
    vi.doMock("@/lib/ai/client", () => ({
      createAiClient: () => ({
        responses: {
          create: () =>
            new Promise((resolve) => {
              setTimeout(() => resolve({ output_text: "late model text" }), 30);
            }),
        },
      }),
    }));
    const { generateAiReport } = await import("@/lib/ai/reports");

    const startedAt = Date.now();
    const report = await generateAiReport(createMonthlyInput());

    expect(Date.now() - startedAt).toBeLessThan(25);
    expect(report.kind).toBe("monthly_journal");
    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("第 1 学年 第 1 月");
  });
});
