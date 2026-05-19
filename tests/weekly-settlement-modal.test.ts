import { describe, expect, it } from "vitest";

import { stripWeeklySettlementFocus } from "@/components/weekly-settlement-modal";

describe("weekly settlement modal helpers", () => {
  it("removes the weekly-settlement focus query without disturbing runId", () => {
    expect(stripWeeklySettlementFocus("/game?runId=demo&focus=weekly-settlement")).toBe("/game?runId=demo");
    expect(stripWeeklySettlementFocus("/game?focus=weekly-settlement&runId=demo")).toBe("/game?runId=demo");
  });

  it("leaves unrelated focus values untouched", () => {
    expect(stripWeeklySettlementFocus("/game?runId=demo&focus=planner")).toBe("/game?runId=demo&focus=planner");
  });
});
