import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerGameBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "game-experience-run"),
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
  getServerGameBundle: vi.fn(async () => mockedBundleState.bundle),
}));

describe("game page final-demo experience layers", () => {
  it("renders a layered month calendar and weekly kickoff modal copy from real run state", async () => {
    const run = createInitialGameRun({
      id: "game-experience-run",
      name: "事件体验档",
      discipline: "business",
      randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
    });
    const stressedRun = {
      ...run,
      stats: {
        ...run.stats,
        money: 120,
        mood: 30,
        stress: 82,
      },
    };

    mockedBundleState.bundle = {
      run: stressedRun,
      runRecord: {
        id: stressedRun.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: stressedRun.status,
        current_year: stressedRun.currentYear,
        current_month: stressedRun.currentMonth,
        profile_json: stressedRun.profile,
        current_state_json: stressedRun,
      },
      monthlyStates: [],
      logs: [],
    };

    const pageModule = await import("@/app/game/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: stressedRun.id }),
      }),
    );

    expect(markup).toContain("本月事件月历");
    expect(markup).toContain("风险事件");
    expect(markup).toContain("机会事件");
    expect(markup).toContain("本周开始前");
    expect(markup).toContain("现金");
    expect(markup).toContain("压力");
  });
});
