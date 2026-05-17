type MonthlyStateLike = {
  id: string;
  year: number;
  month: number;
};

type AiReportLike = {
  report_type: string;
  year: number;
  month: number | null;
};

export function buildJournalOverview(input: {
  monthlyStates: MonthlyStateLike[];
  aiReports: AiReportLike[];
}) {
  const monthlyJournalCount = input.aiReports.filter((report) => report.report_type === "monthly_journal").length;
  const settledMonthCount = input.monthlyStates.length;
  const growthLogCount = settledMonthCount;

  return {
    monthlyJournalCount,
    growthLogCount,
    settledMonthCount,
  };
}
