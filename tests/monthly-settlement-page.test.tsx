import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StructuredMonthlySummary } from "@/types/game";

const mockedState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerDemoBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "settlement-page-run"),
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
  getServerDemoBundle: vi.fn(async () => mockedState.bundle),
}));

function createBundle() {
  const summary: StructuredMonthlySummary = {
    month: 1,
    actions: ["study", "social", "big_meal"],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: {
      money: 1200,
      mood: 48,
      stress: 51,
      fulfillment: 26,
      social: 22,
      semesterAcademics: 30,
    },
    statsAfter: {
      money: 930,
      mood: 53,
      stress: 58,
      fulfillment: 31,
      social: 28,
      semesterAcademics: 39,
    },
    statsDelta: {
      money: -270,
      mood: 5,
      stress: 7,
      fulfillment: 5,
      social: 6,
      semesterAcademics: 9,
    },
    moneyDelta: -270,
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
  };

  return {
    run: {
      id: "settlement-page-run",
      status: "active" as const,
      currentYear: 1,
      currentMonth: 2,
      currentSemester: 1,
      profile: {
        talents: ["self-disciplined"],
        familyBackground: "ordinary" as const,
        monthlyAllowance: 1500,
        luck: 50,
        collegeTrack: "engineering" as const,
        schoolTier: "211" as const,
        cityTier: "tier_2" as const,
      },
      stats: summary.statsAfter,
      semesterAverage: 0,
      resume: [],
      logLineIds: [],
      monthlySummaries: [summary],
      semesters: [],
      cooldowns: { askFamilyMonths: 0 },
      risk: { academicRisk: 0, burnout: 0 },
      riskFlags: [],
    },
    runRecord: {
      id: "settlement-page-run",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active" as const,
      current_year: 1,
      current_month: 2,
      profile_json: {},
      current_state_json: {},
    },
    monthlyStates: [
      {
        id: "month-1",
        run_id: "settlement-page-run",
        year: 1,
        month: 1,
        created_at: new Date().toISOString(),
        snapshot_json: summary,
      },
    ],
    logs: [
      {
        id: "log-1",
        run_id: "settlement-page-run",
        year: 1,
        month: 1,
        log_type: "settlement" as const,
        message: "已确认本周安排",
        metadata_json: {},
        created_at: new Date().toISOString(),
      },
    ],
    aiReports: [
      {
        id: "report-1",
        run_id: "settlement-page-run",
        year: 1,
        month: 1,
        report_type: "monthly_journal" as const,
        input_summary_json: summary,
        output_markdown: "# 第1学年・第1月 月记\n\n## 第1学年・第1月 月记\n\n这个月快结束的时候，我才发现自己一直没怎么停下来。",
        model: "fallback",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

describe("monthly settlement page", () => {
  beforeEach(() => {
    mockedState.bundle = createBundle() as never;
  });

  it("keeps only stat changes and the diary body in the normal player view", async () => {
    const pageModule = await import("@/app/settlement/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "settlement-page-run", year: "1", month: "1" }),
      }),
    );

    expect(markup).toContain("第1学年 · 第1月 已结束");
    expect(markup).toContain("这个月结束时");
    expect(markup).toContain("这个月的月记");
    expect(markup).toContain("这个月快结束的时候，我才发现自己一直没怎么停下来。");
    expect(markup).not.toContain("AI 月记");
    expect(markup).not.toContain("写月记前的梗概");
    expect(markup).not.toContain("本月记录");
    expect(markup).not.toContain("玩家可见正文");
    expect(markup).not.toContain("结构化摘要");
    expect(markup).not.toContain("已确认本周安排");
    expect(markup).not.toContain("# 第1学年");
  });
});
