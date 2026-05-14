import { describe, expect, it } from "vitest";

import { buildJournalOverview } from "@/lib/journal-overview";

describe("journal overview counts", () => {
  it("counts monthly journals from real monthly reports", () => {
    const overview = buildJournalOverview({
      monthlyStates: [
        { id: "m1", year: 1, month: 1 },
      ],
      aiReports: [
        { report_type: "monthly_journal", year: 1, month: 1 },
      ],
    });

    expect(overview.monthlyJournalCount).toBe(1);
    expect(overview.growthLogCount).toBe(1);
    expect(overview.settledMonthCount).toBe(1);
  });

  it("stays empty when there are no monthly records yet", () => {
    const overview = buildJournalOverview({
      monthlyStates: [],
      aiReports: [],
    });

    expect(overview.monthlyJournalCount).toBe(0);
    expect(overview.growthLogCount).toBe(0);
    expect(overview.settledMonthCount).toBe(0);
  });
});
