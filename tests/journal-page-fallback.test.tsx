import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type { StructuredMonthlySummary } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerJournalBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "run-journal-page"),
}));

vi.mock("@/lib/demo/active-run", () => ({
  buildRunHref: (path: string, runId?: string | null) => (runId ? `${path}?runId=${runId}` : path),
  resolveActiveRunId: ({
    searchParamRunId,
    cookieRunId,
  }: {
    searchParamRunId?: string | null;
    cookieRunId?: string | null;
  }) => searchParamRunId ?? cookieRunId ?? null,
}));

vi.mock("@/lib/demo/server", () => ({
  getServerJournalBundle: vi.fn(async () => mockedBundleState.bundle),
}));

function createBundleWithoutAiJournal() {
  const run = createInitialGameRun({
    id: "run-journal-page",
    name: "林舒恒",
    discipline: "engineering",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  return {
    run,
    runRecord: {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: run.status,
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run,
    },
    monthlyStates: [
      {
        id: "month-1",
        run_id: run.id,
        year: 1,
        month: 1,
        created_at: new Date().toISOString(),
        snapshot_json: {
          month: 1,
          actions: ["study", "competition_project", "social"],
          attendanceStrategy: "mixed",
          schedule: [],
          weeklyCalendar: [],
          statsBefore: {
            money: 1200,
            mood: 55,
            stress: 48,
            fulfillment: 30,
            social: 24,
            semesterAcademics: 18,
          },
          statsAfter: {
            money: 980,
            mood: 58,
            stress: 42,
            fulfillment: 35,
            social: 28,
            semesterAcademics: 26,
          },
          statsDelta: {
            money: -220,
            mood: 3,
            stress: -6,
            fulfillment: 5,
            social: 4,
            semesterAcademics: 8,
          },
          moneyDelta: -220,
          academicFeedback: "stable",
          eventIds: [],
          resumeAdditions: [],
          notableFacts: ["competition:电子设计训练项目:unfinished"],
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
          progression: {
            tendencies: {
              employment: 16,
              postgraduate: 12,
              public_exam: 4,
              recommendation: 18,
              undecided: 6,
            },
            dominantDirection: "recommendation",
            publicExam: {
              progress: 0,
              aptitudePrep: 0,
              essayPrep: 0,
            },
            postgraduateProgress: 10,
            employmentReadiness: 8,
            recommendationReadiness: 18,
            recommendationQualification: "pending",
            latestHints: [],
          },
          competitionProjects: [],
        } as StructuredMonthlySummary,
      },
    ],
    aiReports: [],
  };
}

describe("journal page fallback", () => {
  beforeEach(() => {
    mockedBundleState.bundle = createBundleWithoutAiJournal();
  });

  it("renders the monthly rules fallback instead of crashing when the AI journal is missing", async () => {
    const pageModule = await import("@/app/journal/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "run-journal-page" }),
      }),
    );

    expect(markup).toContain("fm-paper__title");
    expect(markup).toContain("fm-paper__copy");
    expect(markup).toContain("月底状态");
    expect(markup).toContain("点击打开本月来信");
    expect(markup).not.toContain("学业变化");
    expect(markup).not.toContain("压力 / 心情变化");
    expect(markup).not.toContain("moneyDelta");
  });
});
