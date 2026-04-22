import type {
  GraduationOutcome,
  ResumeCategory,
  StructuredEndingSummary,
  StructuredMonthlySummary
} from "@/types/game";

export type RunRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "active" | "completed";
  current_year: number;
  current_month: number;
  profile_json: unknown;
  current_state_json: unknown;
};

export type MonthlyStateRecord = {
  id: string;
  run_id: string;
  year: number;
  month: number;
  snapshot_json: StructuredMonthlySummary;
  created_at: string;
};

export type GameEventLogRecord = {
  id: string;
  run_id: string;
  year: number;
  month: number;
  log_type: "action" | "event" | "settlement";
  message: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type AIReportRecord = {
  id: string;
  run_id: string;
  year: number;
  month: number | null;
  report_type: "monthly_journal" | "ending_report";
  input_summary_json: StructuredMonthlySummary | StructuredEndingSummary;
  output_markdown: string;
  created_at: string;
};

export type ResumeItemRecord = {
  id: string;
  run_id: string;
  year: number;
  month: number;
  category: ResumeCategory;
  title: string;
  summary: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type EndingRecord = {
  id: string;
  run_id: string;
  outcome: GraduationOutcome;
  summary_json: StructuredEndingSummary;
  created_at: string;
};

