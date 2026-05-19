import { describe, expect, it } from "vitest";

import { buildStatusGuidance } from "@/lib/status-guidance";

describe("status guidance", () => {
  it("recommends recovery when mood is very low", () => {
    const guidance = buildStatusGuidance({
      mood: 18,
      stress: 44,
    });

    expect(guidance.summary).toContain("缓过来一点");
    expect(guidance.recommendedActions).toContain("relax");
  });

  it("warns against stacking more pressure when stress is very high", () => {
    const guidance = buildStatusGuidance({
      mood: 52,
      stress: 86,
    });

    expect(guidance.summary).toContain("别排太满");
    expect(guidance.recommendedActions).toContain("big_meal");
    expect(guidance.recommendedActions).toContain("social");
  });
});
