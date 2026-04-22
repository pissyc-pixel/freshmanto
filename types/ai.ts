import type { StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";

export type AiReportKind = "monthly_journal" | "ending_report";

export type MonthlyJournalPromptInput = {
  runId: string;
  year: number;
  month: number;
  summary: StructuredMonthlySummary;
};

export type EndingReportPromptInput = {
  runId: string;
  summary: StructuredEndingSummary;
};

export type AiReportRequest = MonthlyJournalPromptInput | EndingReportPromptInput;

export type AiReportResult = {
  kind: AiReportKind;
  markdown: string;
  model?: string;
};

