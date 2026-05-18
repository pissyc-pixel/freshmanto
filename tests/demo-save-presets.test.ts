import { describe, expect, it } from "vitest";

import type {
  AIReportRecord,
  GameEventLogRecord,
  Json,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord,
} from "@/types/db";
import type { GameRun, StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";
import { createDemoPresetRun, demoSavePresets } from "@/lib/demo/presets";

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
    async getRun() {
      return store.run;
    },
    async updateRun() {
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
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-${input.month}-${index}`,
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

describe("demo save presets", () => {
  it("lists the two required core demo saves in the catalog", () => {
    const labels = demoSavePresets.map((preset) => preset.label);

    expect(labels).toContain("南开商科｜就业路线｜大三上");
    expect(labels).toContain("天大工科｜推免路线｜大三上");
  });

  it("creates the Nankai business employment preset as a real month-25 run with history", async () => {
    const store = createStore();

    const result = await createDemoPresetRun({
      repository: createRepository(store),
      presetId: "nankai-business-employment-junior-fall",
      runId: "demo-nankai-business",
    });

    expect(result.run.currentYear).toBe(3);
    expect(result.run.currentMonth).toBe(1);
    expect(result.run.currentSemester).toBe(5);
    expect(result.run.profile.schoolTier).toBe("nankai_tianda");
    expect(result.run.profile.collegeTrack).toBe("business");
    expect(result.run.resume.length).toBeGreaterThanOrEqual(4);
    expect(store.monthlyStates.length).toBeGreaterThanOrEqual(4);
    expect(store.aiReports.length).toBeGreaterThanOrEqual(store.monthlyStates.length);
    expect(store.resumeItems.some((item) => item.title.includes("市级奖学金"))).toBe(true);
    expect(store.resumeItems.some((item) => item.title.includes("商业案例分析赛"))).toBe(true);
    expect(store.resumeItems.some((item) => item.title.includes("市场运营助理"))).toBe(true);
  });

  it("creates the Tianda engineering recommendation preset with explicit recommendation strength", async () => {
    const store = createStore();

    const result = await createDemoPresetRun({
      repository: createRepository(store),
      presetId: "tianda-engineering-recommendation-junior-fall",
      runId: "demo-tianda-engineering",
    });

    expect(result.run.currentYear).toBe(3);
    expect(result.run.currentMonth).toBe(1);
    expect(result.run.profile.schoolTier).toBe("nankai_tianda");
    expect(result.run.profile.collegeTrack).toBe("engineering");
    expect(result.run.scholarships?.length).toBeGreaterThanOrEqual(2);
    expect(result.run.progression?.recommendationQualification).toBe("eligible");
    expect(result.run.progression?.dominantDirection).toBe("recommendation");
    expect(store.resumeItems.some((item) => item.title.includes("国家奖学金"))).toBe(true);
    expect(store.resumeItems.some((item) => item.title.includes("电子设计竞赛"))).toBe(true);
    expect(store.resumeItems.some((item) => item.title.includes("工程训练综合项目"))).toBe(true);
  });
  it("persists core demo history as playable run-state evidence, not just external fixtures", async () => {
    const nankaiStore = createStore();
    const tiandaStore = createStore();

    const nankai = await createDemoPresetRun({
      repository: createRepository(nankaiStore),
      presetId: "nankai-business-employment-junior-fall",
      runId: "demo-nankai-state-evidence",
    });
    const tianda = await createDemoPresetRun({
      repository: createRepository(tiandaStore),
      presetId: "tianda-engineering-recommendation-junior-fall",
      runId: "demo-tianda-state-evidence",
    });

    expect(nankai.run.internshipRecords?.some((item) => item.stage === "first_internship")).toBe(true);
    expect(nankai.run.timelineNodes?.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["competition_award", "scholarship", "internship"]),
    );
    expect(nankai.run.monthlyLetters?.length).toBeGreaterThanOrEqual(4);
    expect(nankai.run.endingEvidence?.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["scholarship", "competition", "internship"]),
    );

    expect(tianda.run.timelineNodes?.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["competition_award", "scholarship"]),
    );
    expect(tianda.run.monthlyLetters?.length).toBeGreaterThanOrEqual(4);
    expect(tianda.run.endingEvidence?.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["scholarship", "competition", "route"]),
    );
  });
});
