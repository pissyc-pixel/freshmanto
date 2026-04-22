import type { PostgrestError, PostgrestSingleResponse, PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AIReportInsert,
  AIReportRecord,
  AiReportType,
  Database,
  GameEventLogInsert,
  GameEventLogRecord,
  GameEventLogType,
  Json,
  MonthlyStateInsert,
  MonthlyStateRecord,
  ResumeItemInsert,
  ResumeItemRecord,
  RunInsert,
  RunRecord,
  RunStatus,
  RunUpdate
} from "@/types/db";
import type {
  GameRun,
  ResumeCategory,
  StarterProfile,
  StructuredEndingSummary,
  StructuredMonthlySummary
} from "@/types/game";

type JsonObject = Record<string, Json>;
type SummaryPayload = StructuredMonthlySummary | StructuredEndingSummary;
type DatabaseClient = SupabaseClient<Database>;

export type CreateRunInput = {
  id?: string;
  status?: RunStatus;
  currentYear: number;
  currentMonth: number;
  profile: StarterProfile;
  currentState: GameRun;
};

export type UpdateRunInput = {
  status?: RunStatus;
  currentYear?: number;
  currentMonth?: number;
  profile?: StarterProfile;
  currentState?: GameRun;
};

export type SaveMonthlyStateInput = {
  runId: string;
  year: number;
  month: number;
  snapshot: StructuredMonthlySummary;
};

export type WriteEventLogInput = {
  runId: string;
  year: number;
  month: number;
  logType: GameEventLogType;
  message: string;
  metadata?: JsonObject;
};

export type SaveAiReportInput = {
  runId: string;
  year: number;
  month?: number | null;
  reportType: AiReportType;
  inputSummary: SummaryPayload;
  outputMarkdown: string;
  model?: string | null;
};

export type SaveResumeItemInput = {
  runId: string;
  year: number;
  month: number;
  category: ResumeCategory;
  title: string;
  summary: string;
  sourceItemId?: string | null;
  metadata?: JsonObject;
};

function ensureSingle<T>(result: PostgrestSingleResponse<T>, context: string) {
  if (result.error) {
    throw createRepositoryError(context, result.error);
  }

  return result.data;
}

function ensureMany<T>(result: PostgrestResponse<T>, context: string) {
  if (result.error) {
    throw createRepositoryError(context, result.error);
  }

  return result.data;
}

function createRepositoryError(context: string, error: PostgrestError) {
  return new Error(`${context} failed: ${error.message}`);
}

export function buildRunInsert(input: CreateRunInput): RunInsert {
  return {
    id: input.id,
    status: input.status ?? "active",
    current_year: input.currentYear,
    current_month: input.currentMonth,
    profile_json: input.profile,
    current_state_json: input.currentState
  };
}

export function buildRunUpdate(input: UpdateRunInput): RunUpdate {
  const payload: RunUpdate = {};

  if (input.status !== undefined) {
    payload.status = input.status;
  }

  if (input.currentYear !== undefined) {
    payload.current_year = input.currentYear;
  }

  if (input.currentMonth !== undefined) {
    payload.current_month = input.currentMonth;
  }

  if (input.profile !== undefined) {
    payload.profile_json = input.profile;
  }

  if (input.currentState !== undefined) {
    payload.current_state_json = input.currentState;
  }

  return payload;
}

export function buildMonthlyStateInsert(input: SaveMonthlyStateInput): MonthlyStateInsert {
  return {
    run_id: input.runId,
    year: input.year,
    month: input.month,
    snapshot_json: input.snapshot
  };
}

export function buildEventLogInsert(input: WriteEventLogInput): GameEventLogInsert {
  return {
    run_id: input.runId,
    year: input.year,
    month: input.month,
    log_type: input.logType,
    message: input.message,
    metadata_json: input.metadata ?? {}
  };
}

export function buildAiReportInsert(input: SaveAiReportInput): AIReportInsert {
  return {
    run_id: input.runId,
    year: input.year,
    month: input.month ?? null,
    report_type: input.reportType,
    input_summary_json: input.inputSummary,
    output_markdown: input.outputMarkdown,
    model: input.model ?? null
  };
}

export function buildResumeItemInsert(input: SaveResumeItemInput): ResumeItemInsert {
  return {
    run_id: input.runId,
    year: input.year,
    month: input.month,
    category: input.category,
    title: input.title,
    summary: input.summary,
    source_item_id: input.sourceItemId ?? null,
    metadata_json: input.metadata ?? {}
  };
}

export function createSupabaseDataRepository(client: DatabaseClient) {
  return {
    async createRun(input: CreateRunInput): Promise<RunRecord> {
      const result = await client.from("runs").insert(buildRunInsert(input)).select().single();
      return ensureSingle(result, "create run");
    },

    async getRun(runId: string): Promise<RunRecord | null> {
      const result = await client.from("runs").select("*").eq("id", runId).maybeSingle();
      if (result.error) {
        throw createRepositoryError("get run", result.error);
      }

      return result.data;
    },

    async updateRun(runId: string, input: UpdateRunInput): Promise<RunRecord> {
      const result = await client.from("runs").update(buildRunUpdate(input)).eq("id", runId).select().single();
      return ensureSingle(result, "update run");
    },

    async saveMonthlyState(input: SaveMonthlyStateInput): Promise<MonthlyStateRecord> {
      const result = await client
        .from("monthly_states")
        .upsert(buildMonthlyStateInsert(input), { onConflict: "run_id,year,month" })
        .select()
        .single();

      return ensureSingle(result, "save monthly state");
    },

    async listMonthlyStates(runId: string): Promise<MonthlyStateRecord[]> {
      const result = await client
        .from("monthly_states")
        .select("*")
        .eq("run_id", runId)
        .order("year", { ascending: true })
        .order("month", { ascending: true });

      return ensureMany(result, "list monthly states");
    },

    async writeEventLog(input: WriteEventLogInput): Promise<GameEventLogRecord> {
      const result = await client.from("game_event_logs").insert(buildEventLogInsert(input)).select().single();
      return ensureSingle(result, "write event log");
    },

    async writeEventLogs(inputs: WriteEventLogInput[]): Promise<GameEventLogRecord[]> {
      const rows = inputs.map(buildEventLogInsert);
      if (rows.length === 0) {
        return [];
      }

      const result = await client.from("game_event_logs").insert(rows).select();
      return ensureMany(result, "write event logs");
    },

    async listEventLogs(runId: string): Promise<GameEventLogRecord[]> {
      const result = await client
        .from("game_event_logs")
        .select("*")
        .eq("run_id", runId)
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .order("created_at", { ascending: true });

      return ensureMany(result, "list event logs");
    },

    async saveAiReport(input: SaveAiReportInput): Promise<AIReportRecord> {
      const result = await client.from("ai_reports").insert(buildAiReportInsert(input)).select().single();
      return ensureSingle(result, "save ai report");
    },

    async listAiReports(runId: string, reportType?: AiReportType): Promise<AIReportRecord[]> {
      let query = client
        .from("ai_reports")
        .select("*")
        .eq("run_id", runId)
        .order("year", { ascending: true })
        .order("month", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (reportType) {
        query = query.eq("report_type", reportType);
      }

      const result = await query;
      return ensureMany(result, "list ai reports");
    },

    async saveResumeItem(input: SaveResumeItemInput): Promise<ResumeItemRecord> {
      const result = await client.from("resume_items").insert(buildResumeItemInsert(input)).select().single();
      return ensureSingle(result, "save resume item");
    },

    async saveResumeItems(inputs: SaveResumeItemInput[]): Promise<ResumeItemRecord[]> {
      const rows = inputs.map(buildResumeItemInsert);
      if (rows.length === 0) {
        return [];
      }

      const result = await client.from("resume_items").insert(rows).select();
      return ensureMany(result, "save resume items");
    },

    async listResumeItems(runId: string): Promise<ResumeItemRecord[]> {
      const result = await client
        .from("resume_items")
        .select("*")
        .eq("run_id", runId)
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .order("created_at", { ascending: true });

      return ensureMany(result, "list resume items");
    }
  };
}

export function createBrowserSupabaseRepository() {
  return createSupabaseDataRepository(createSupabaseBrowserClient());
}

export function createServerSupabaseRepository() {
  return createSupabaseDataRepository(createSupabaseServerClient());
}
