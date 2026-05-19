import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type { GameRun } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerResumeBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "legacy-month-two-run"),
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
  getServerResumeBundle: vi.fn(async () => mockedBundleState.bundle),
}));

function createLegacyMonthTwoRun(): GameRun {
  const baseRun = createInitialGameRun({
    id: "legacy-month-two-run",
    name: "林舒恬",
    discipline: "business",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  return {
    ...baseRun,
    currentMonth: 2,
    activeMonth: {
      year: 1,
      month: 2,
      currentWeek: 1,
      totalWeeks: 4,
      allowanceApplied: true,
      cooldownsAtStart: { askFamilyMonths: 0 },
      weeklyCalendar: [],
      currentWeekState: undefined as unknown as NonNullable<GameRun["activeMonth"]>["currentWeekState"],
      completedWeeks: [],
      statsAtStart: { ...baseRun.stats },
      turns: [],
    },
  };
}

describe("resume page legacy month-2 saves", () => {
  beforeEach(() => {
    const run = createLegacyMonthTwoRun();
    mockedBundleState.bundle = {
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
      monthlyStates: [],
      resumeItems: [],
    };
  });

  it("renders safely for a legacy month-2 save with a broken activeMonth snapshot", async () => {
    const pageModule = await import("@/app/resume/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "legacy-month-two-run" }),
      }),
    );

    expect(markup).toContain("履历档案");
    expect(markup).toContain("基础画像 / 入学档案");
    expect(markup).toContain("还没有能写进履历的经历");
    expect(markup).toContain("为什么你正在接近某条路");
    expect(markup).not.toContain("从这一周开始，把大学慢慢过出来。");
    expect(markup).not.toContain("GPA、履历、机会线索和阶段记录，都会收在这里。");
    expect(markup).not.toContain("这里记录能慢慢写进简历和未来选择里的东西。个人履历会随着项目、成绩、奖学金和实践经历慢慢成形。");
    expect(markup).not.toContain("学校、专业方向、城市层级和初始背景都只来自当前存档字段。这里负责整理，不会替你补写经历。");
    expect(markup).not.toContain("这里不提前下定论，只把现阶段已经看得见的倾向、支撑证据和缺口整理给你。");
    expect(markup).not.toContain("这些线索只反映当前存档已有的倾向，不预示最终结果。");
    expect(markup).not.toContain("正式结果预览");
    expect(markup).not.toContain("阶段日志");
  });
});
