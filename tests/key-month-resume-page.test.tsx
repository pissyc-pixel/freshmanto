import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { createDefaultCareerRouteState } from "@/core/resolvers/progression";
import type { ResumeItemRecord } from "@/types/db";
import type { GameRun, ScholarshipRecord } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerResumeBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "resume-key-month-run"),
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

function createRunForMonth(input: {
  id: string;
  year: number;
  month: number;
  scholarships?: ScholarshipRecord[];
  progression?: Partial<NonNullable<GameRun["progression"]>>;
}) {
  const baseRun = createInitialGameRun({
    id: input.id,
    name: "履历关键月份玩家",
    discipline: "business",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  return {
    ...baseRun,
    currentYear: input.year,
    currentMonth: input.month,
    currentSemester: (input.year - 1) * 2 + (input.month <= 6 ? 1 : 2),
    scholarships: input.scholarships ?? [],
    progression: {
      ...createDefaultCareerRouteState(),
      ...(input.progression ?? {}),
      tendencies: {
        ...createDefaultCareerRouteState().tendencies,
        ...(input.progression?.tendencies ?? {}),
      },
      publicExam: {
        ...createDefaultCareerRouteState().publicExam,
        ...(input.progression?.publicExam ?? {}),
      },
    },
  } satisfies GameRun;
}

function createResumeRecord(input: {
  id: string;
  year: number;
  month: number;
  category: ResumeItemRecord["category"];
  title: string;
  summary: string;
  tags: string[];
}): ResumeItemRecord {
  return {
    id: input.id,
    run_id: "resume-key-month-run",
    year: input.year,
    month: input.month,
    category: input.category,
    title: input.title,
    summary: input.summary,
    source_item_id: null,
    metadata_json: {
      tags: input.tags,
    },
    created_at: new Date().toISOString(),
  };
}

const scholarship: ScholarshipRecord = {
  id: "resume-sch-13",
  academicYear: 1,
  level: "standard",
  amount: 2000,
  title: "奖学金",
  reason: "上一学年成绩稳定，按规则获得奖学金。",
};

describe("key month resume page rendering", () => {
  it.each([
    {
      label: "month 13 scholarship archive",
      run: createRunForMonth({
        id: "resume-month-13",
        year: 2,
        month: 1,
        scholarships: [scholarship],
      }),
      resumeItems: [
        createResumeRecord({
          id: "resume-month-13-2-1-scholarship",
          year: 2,
          month: 1,
          category: "scholarship",
          title: "奖学金到账",
          summary: "奖学金正式进入履历。",
          tags: ["scholarship"],
        }),
      ],
      expected: "奖学金证书",
    },
    {
      label: "month 28 competition archive",
      run: createRunForMonth({
        id: "resume-month-28",
        year: 3,
        month: 4,
      }),
      resumeItems: [
        createResumeRecord({
          id: "resume-month-28-3-4-competition",
          year: 3,
          month: 4,
          category: "competition",
          title: "案例分析省级二等奖",
          summary: "按规则结算得到省级二等奖。",
          tags: ["provincial", "second"],
        }),
      ],
      expected: "竞赛评奖归档",
    },
    {
      label: "month 34 internship and recommendation archive",
      run: createRunForMonth({
        id: "resume-month-34",
        year: 3,
        month: 10,
        progression: {
          dominantDirection: "recommendation",
          recommendationQualification: "eligible",
          recommendationReadiness: 80,
          tendencies: {
            employment: 18,
            postgraduate: 42,
            public_exam: 2,
            recommendation: 84,
            undecided: 0,
          },
        },
      }),
      resumeItems: [
        createResumeRecord({
          id: "resume-month-34-3-10-internship",
          year: 3,
          month: 10,
          category: "internship",
          title: "暑期实习机会",
          summary: "一段真实进入履历的实习机会。",
          tags: ["internship", "strategy"],
        }),
      ],
      expected: "推免资格确认函",
    },
  ])("renders $label safely", async ({ run, resumeItems, expected }) => {
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
      resumeItems,
    };

    const pageModule = await import("@/app/resume/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: run.id }),
      }),
    );

    expect(markup).toContain("正式成果档案");
    expect(markup).toContain(expected);
  });
});
