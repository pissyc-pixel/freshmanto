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
    async deleteRun(runId: string) {
      if (store.run?.id === runId) {
        store.run = null;
      }
      store.monthlyStates = store.monthlyStates.filter((item) => item.run_id !== runId);
      store.logs = store.logs.filter((item) => item.run_id !== runId);
      store.aiReports = store.aiReports.filter((item) => item.run_id !== runId);
      store.resumeItems = store.resumeItems.filter((item) => item.run_id !== runId);
      return null;
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
    const ids = demoSavePresets.map((preset) => preset.id);

    expect(ids).toEqual([
      "nankai-business-employment-junior-fall",
      "nankai-business-employment-final",
      "tianda-engineering-recommendation-junior-fall",
      "tianda-engineering-recommendation-final",
    ]);
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

  it("creates the Nankai employment final preset at month 48 with an employment offer", async () => {
    const store = createStore();

    const result = await createDemoPresetRun({
      repository: createRepository(store),
      presetId: "nankai-business-employment-final",
      runId: "demo-nankai-final",
    });

    expect(result.run.currentYear).toBe(4);
    expect(result.run.currentMonth).toBe(12);
    expect(result.run.currentSemester).toBe(8);
    expect(result.run.futureOffers?.some((offer) => offer.type === "employment")).toBe(true);
    expect(result.run.acceptedOffer?.type).toBe("employment");
    expect(result.run.timelineNodes?.some((item) => item.kind === "offer")).toBe(true);
    expect(result.run.endingEvidence?.some((item) => item.kind === "offer")).toBe(true);
    expect(store.resumeItems.every((item) => item.category !== ("competition" as never) || item.category === "competition")).toBe(true);
  });

  it("creates the Tianda recommendation final preset at month 48 with a recommendation offer", async () => {
    const store = createStore();

    const result = await createDemoPresetRun({
      repository: createRepository(store),
      presetId: "tianda-engineering-recommendation-final",
      runId: "demo-tianda-final",
    });

    expect(result.run.currentYear).toBe(4);
    expect(result.run.currentMonth).toBe(12);
    expect(result.run.currentSemester).toBe(8);
    expect(result.run.futureOffers?.some((offer) => offer.type === "recommendation")).toBe(true);
    expect(result.run.acceptedOffer?.type).toBe("recommendation");
    expect(result.run.progression?.postgraduateChoiceOpenedAtMonth).toBe(28);
    expect(result.run.progression?.recommendationAppliedAtMonth).toBe(34);
    expect(result.run.timelineNodes?.some((item) => item.kind === "final_choice")).toBe(true);
    expect(result.run.endingEvidence?.some((item) => item.kind === "offer")).toBe(true);
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

  it("rolls back the half-created preset run when resume item persistence fails", async () => {
    const store = createStore();
    const repository = {
      ...createRepository(store),
      async saveResumeItems() {
        throw new Error("save resume items failed: resume_items_category_check");
      },
    };

    await expect(
      createDemoPresetRun({
        repository,
        presetId: "nankai-business-employment-junior-fall",
        runId: "demo-preset-rollback",
      }),
    ).rejects.toThrow("save resume items failed");

    expect(store.run).toBeNull();
    expect(store.monthlyStates).toHaveLength(0);
    expect(store.aiReports).toHaveLength(0);
    expect(store.resumeItems).toHaveLength(0);
  });
});
