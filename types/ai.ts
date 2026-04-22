import type { StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";

export type AiReportKind = "monthly_journal" | "ending_report";

export type MonthlyJournalPromptInput = {
  kind: "monthly_journal";
  runId: string;
  year: number;
  month: number;
  summary: StructuredMonthlySummary;
};

export type EndingReportPromptInput = {
  kind: "ending_report";
  runId: string;
  summary: StructuredEndingSummary;
};

export type AiReportRequest = MonthlyJournalPromptInput | EndingReportPromptInput;

export type AiPromptMessage = {
  role: "system" | "user";
  content: string;
};

export type AiPromptContract = {
  name: string;
  purpose: string;
  allowedInput: string;
  forbiddenInput: string;
  outputStyle: string;
};

export type AiPromptPayload = {
  contract: AiPromptContract;
  messages: AiPromptMessage[];
  input: AiReportRequest;
};

export type AiReportResult = {
  kind: AiReportKind;
  markdown: string;
  model?: string;
  usedFallback: boolean;
};
