import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type {
  AIReportRecord,
  GameEventLogRecord,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord
} from "@/types/db";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type { GameRun, MonthlyActionPlan, StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";
import { advanceDemoMonth, createDemoRun } from "@/lib/demo/run-service";

type InMemoryStore = {
  run: RunRecord | null;
  monthlyStates: MonthlyStateRecord[];
  logs: GameEventLogRecord[];
  aiReports: AIReportRecord[];
  resumeItems: ResumeItemRecord[];
};

function createStore(): InMemoryStore {
  return {
    run: null,
    monthlyStates: [],
    logs: [],
    aiReports: [],
    resumeItems: []
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
        current_state_json: input.currentState
      };
      store.run = record;
      return record;
    },
    async getRun(runId: string) {
      if (store.run?.id !== runId) {
        return null;
      }

      return store.run;
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
        updated_at: new Date().toISOString(),
        status: input.status ?? store.run.status,
        current_year: input.currentYear ?? store.run.current_year,
        current_month: input.currentMonth ?? store.run.current_month,
        profile_json: input.profile ?? store.run.profile_json,
        current_state_json: input.currentState ?? store.run.current_state_json
      };

      return store.run;
    },
    async saveMonthlyState(input: {
      runId: string;
      year: number;
      month: number;
      snapshot: StructuredMonthlySummary;
    }) {
      const record: MonthlyStateRecord = {
        id: `${input.runId}-${input.year}-${input.month}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        snapshot_json: input.snapshot,
        created_at: new Date().toISOString()
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
      metadata?: Record<string, unknown>;
    }>) {
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-${input.month}-${index}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        log_type: input.logType,
        message: input.message,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString()
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
        created_at: new Date().toISOString()
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
      metadata?: Record<string, unknown>;
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
        created_at: new Date().toISOString()
      })) satisfies ResumeItemRecord[];
      store.resumeItems.push(...records);
      return records;
    }
  };
}

async function fakeAiReport(input: AiReportRequest): Promise<AiReportResult> {
  return {
    kind: input.kind,
    markdown: `Report for ${input.kind}`,
    model: "fake-model",
    usedFallback: false
  };
}

describe("demo run service", () => {
  it("creates a new run and persists the initial state", async () => {
    const store = createStore();

    const result = await createDemoRun({
      repository: createRepository(store),
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });

    expect(result.run.id).toBeTruthy();
    expect(store.run?.current_state_json.id).toBe(result.run.id);
    expect(store.logs[0]?.message).toContain("run created");
  });

  it("advances one month, stores the summary, logs, report, and updated run state", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-month",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const plan: MonthlyActionPlan = {
      attendanceStrategy: "mixed",
      actions: [
        { action: "study", time: "day" },
        { action: "student_activity", time: "night" },
        { action: "social", time: "night" }
      ]
    };

    const result = await advanceDemoMonth({
      repository: createRepository(store),
      runId: run.id,
      plan,
      generateReport: fakeAiReport
    });

    expect(result.run.currentMonth).toBe(2);
    expect(store.monthlyStates).toHaveLength(1);
    expect(store.aiReports[0]?.report_type).toBe("monthly_journal");
    expect(store.logs.length).toBeGreaterThanOrEqual(2);
    expect(store.run?.current_state_json.currentMonth).toBe(2);
  });

  it("marks the run completed and saves an ending report after year 4 month 12", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-ending",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    const finalRun: GameRun = {
      ...run,
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      semesters: [
        { semester: 1, academicScore: 75, feedback: "stable", passed: true },
        { semester: 2, academicScore: 79, feedback: "stable", passed: true },
        { semester: 3, academicScore: 82, feedback: "stable", passed: true },
        { semester: 4, academicScore: 84, feedback: "stable", passed: true },
        { semester: 5, academicScore: 80, feedback: "stable", passed: true },
        { semester: 6, academicScore: 77, feedback: "stable", passed: true },
        { semester: 7, academicScore: 81, feedback: "stable", passed: true }
      ]
    };

    store.run = {
      id: finalRun.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: finalRun.currentYear,
      current_month: finalRun.currentMonth,
      profile_json: finalRun.profile,
      current_state_json: finalRun
    };

    const result = await advanceDemoMonth({
      repository: createRepository(store),
      runId: finalRun.id,
      plan: {
        attendanceStrategy: "serious",
        actions: [{ action: "study", time: "night" }]
      },
      generateReport: fakeAiReport
    });

    expect(result.run.status).toBe("completed");
    expect(result.endingReport?.kind).toBe("ending_report");
    expect(store.aiReports.some((record) => record.report_type === "ending_report")).toBe(true);
  });
});
