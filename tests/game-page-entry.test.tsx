import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerGameBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "run-game-page"),
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

function createBundle() {
  const run = createInitialGameRun({
    id: "run-game-page",
    name: "林舒恒",
    discipline: "arts",
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
    monthlyStates: [],
    logs: [],
  };
}

describe("game page restart entry", () => {
  beforeEach(() => {
    mockedBundleState.bundle = createBundle();
  });

  it("routes the visible restart entry through /new-game instead of posting a direct create action", async () => {
    const pageModule = await import("@/app/game/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "run-game-page" }),
      }),
    );

    expect(markup).toContain("/new-game");
    expect(markup).not.toContain("重新开局</button></form>");
  });
});
