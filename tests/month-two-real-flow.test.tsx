import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { confirmDemoWeek, createDemoRun, setDemoWeekAttendance } from "@/lib/demo/run-service";
import type {
  AIReportRecord,
  GameEventLogRecord,
  Json,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord,
} from "@/types/db";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type { GameRun, StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";

type InMemoryStore = {
  run: RunRecord | null;
  monthlyStates: MonthlyStateRecord[];
  logs: GameEventLogRecord[];
  aiReports: AIReportRecord[];
  resumeItems: ResumeItemRecord[];
};

const mockedState = {
  gameBundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerGameBundle"]>> | null,
  journalBundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerJournalBundle"]>> | null,
  resumeBundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerResumeBundle"]>> | null,
  endingBundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerEndingPreview"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "month-two-real-flow"),
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
  getServerGameBundle: vi.fn(async () => mockedState.gameBundle),
  getServerJournalBundle: vi.fn(async () => mockedState.journalBundle),
  getServerResumeBundle: vi.fn(async () => mockedState.resumeBundle),
  getServerEndingPreview: vi.fn(async () => mockedState.endingBundle),
}));

function createStore(): InMemoryStore {
  return {
    run: null,
    monthlyStates: [],
    logs: [],
    aiReports: [],
    resumeItems: [],
  };
}

function createRepository(store: InMemoryStore) {
  return {
    async createRun(input: {
      currentYear: number;
      currentMonth: number;
      profile: GameRun["profile"];
      currentState: GameRun;
      status?: "active" | "completed";
      id?: string;
    }) {
      const record: RunRecord = {
        id: input.id ?? input.currentState.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: input.status ?? "active",
        current_year: input.currentYear,
        current_month: input.currentMonth,
        profile_json: input.profile,
        current_state_json: input.currentState,
      };
      store.run = record;
      return record;
    },
    async getRun(runId: string) {
      return store.run?.id === runId ? store.run : null;
    },
    async updateRun(runId: string, input: {
      status?: "active" | "completed";
      currentYear?: number;
      currentMonth?: number;
      profile?: GameRun["profile"];
      currentState?: GameRun;
    }) {
      if (!store.run || store.run.id !== runId) {
        throw new Error("run not found");
      }

      store.run = {
        ...store.run,
        status: input.status ?? store.run.status,
        current_year: input.currentYear ?? store.run.current_year,
        current_month: input.currentMonth ?? store.run.current_month,
        profile_json: input.profile ?? store.run.profile_json,
        current_state_json: input.currentState ?? store.run.current_state_json,
      };
      return store.run;
    },
    async saveMonthlyState(input: { runId: string; year: number; month: number; snapshot: StructuredMonthlySummary }) {
      const record: MonthlyStateRecord = {
        id: `${input.runId}-${input.year}-${input.month}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        snapshot_json: input.snapshot,
        created_at: new Date().toISOString(),
      };
      store.monthlyStates.push(record);
      return record;
    },
    async writeEventLogs(inputs: Array<{
      runId: string;
      year: number;
      month: number;
      logType: "action" | "event" | "settlement";
      message: string;
      metadata?: Record<string, Json>;
    }>) {
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-${input.month}-${index}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        log_type: input.logType,
        message: input.message,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString(),
      })) satisfies GameEventLogRecord[];
      store.logs.push(...records);
      return records;
    },
    async saveAiReport(input: {
      runId: string;
      year: number;
      month?: number | null;
      reportType: "monthly_journal" | "ending_report";
      inputSummary: StructuredMonthlySummary | StructuredEndingSummary;
      outputMarkdown: string;
      model?: string | null;
    }) {
      const record: AIReportRecord = {
        id: `${input.runId}-${input.reportType}-${store.aiReports.length + 1}`,
        run_id: input.runId,
        year: input.year,
        month: input.month ?? null,
        report_type: input.reportType,
        input_summary_json: input.inputSummary,
        output_markdown: input.outputMarkdown,
        model: input.model ?? null,
        created_at: new Date().toISOString(),
      };
      store.aiReports.push(record);
      return record;
    },
    async saveResumeItems(inputs: Array<{
      runId: string;
      year: number;
      month: number;
      category: ResumeItemRecord["category"];
      title: string;
      summary: string;
      sourceItemId?: string | null;
      metadata?: Record<string, Json>;
    }>) {
      const records = inputs.map((input) => ({
        id: `${input.runId}-${input.month}-${input.title}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        category: input.category,
        title: input.title,
        summary: input.summary,
        source_item_id: input.sourceItemId ?? null,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString(),
      })) satisfies ResumeItemRecord[];
      store.resumeItems.push(...records);
      return records;
    },
  };
}

async function fakeAiReport(input: AiReportRequest): Promise<AiReportResult> {
  return {
    kind: input.kind,
    markdown: `# ${input.kind}`,
    model: "fake",
    usedFallback: false,
  };
}

describe("real month-two page flow", () => {
  it("plays month 1 through settlement, reaches month 2, and renders the real pages safely", async () => {
    const store = createStore();
    const repository = createRepository(store);
    const created = await createDemoRun({
      repository,
      name: "月二真实链路",
      discipline: "business",
    });
    let run = created.run;

    for (let week = 1; week <= 4; week += 1) {
      run = (await setDemoWeekAttendance({
        repository,
        runId: run.id,
        attendanceStrategy: "mixed",
      })).run;
      run = (await confirmDemoWeek({
        repository,
        runId: run.id,
        generateReport: fakeAiReport,
      })).run;
    }

    expect(run.currentMonth).toBe(2);
    expect(store.monthlyStates).toHaveLength(1);
    expect(store.aiReports.some((item) => item.report_type === "monthly_journal")).toBe(true);

    mockedState.gameBundle = {
      run,
      runRecord: store.run!,
      monthlyStates: store.monthlyStates.slice(-1),
      logs: store.logs.slice(-6),
    };
    mockedState.journalBundle = {
      run,
      runRecord: store.run!,
      monthlyStates: store.monthlyStates,
      aiReports: store.aiReports,
    };
    mockedState.resumeBundle = {
      run,
      runRecord: store.run!,
      monthlyStates: store.monthlyStates,
      resumeItems: store.resumeItems,
    };
    mockedState.endingBundle = {
      run,
      runRecord: store.run!,
      monthlyStates: store.monthlyStates,
      logs: store.logs,
      aiReports: store.aiReports,
      resumeItems: store.resumeItems,
      endingSummary: {
        finalYear: 1,
        outcome: "normal_graduation",
        graduationPath: "undecided",
        pathResult: "ordinary",
        dominantDirection: "undecided",
        longTermAcademicAverage: 0,
        recommendationQualification: "pending",
        notableFacts: [],
      },
      savedEndingReport: undefined,
    };

    const [gamePage, journalPage, resumePage, endingPage] = await Promise.all([
      import("@/app/game/page"),
      import("@/app/journal/page"),
      import("@/app/resume/page"),
      import("@/app/ending/page"),
    ]);

    const [gameMarkup, journalMarkup, resumeMarkup, endingMarkup] = await Promise.all([
      gamePage.default({ searchParams: Promise.resolve({ runId: run.id }) }).then(renderToStaticMarkup),
      journalPage.default({ searchParams: Promise.resolve({ runId: run.id }) }).then(renderToStaticMarkup),
      resumePage.default({ searchParams: Promise.resolve({ runId: run.id }) }).then(renderToStaticMarkup),
      endingPage.default({ searchParams: Promise.resolve({ runId: run.id }) }).then(renderToStaticMarkup),
    ]);

    expect(gameMarkup).toContain("第1学年 · 第2月");
    expect(journalMarkup).toContain("成长日志");
    expect(resumeMarkup).toContain("履历档案");
    expect(endingMarkup).toContain("未来还没有写完");
  });
});
