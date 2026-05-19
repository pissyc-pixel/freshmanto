import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { ensureProgressionState } from "@/core/resolvers/progression";
import type { GameRun } from "@/types/game";

function createBaseRun(id: string): GameRun {
  return createInitialGameRun({
    id,
    randomValues: [0.12, 0.24, 0.36, 0.48, 0.6, 0.18, 0.3, 0.42],
  });
}

describe("progression dominant direction", () => {
  it("preserves the previous dominant direction when capped route tendencies tie", () => {
    const baseRun = createBaseRun("direction-tie-recommendation");
    const run = ensureProgressionState({
      ...baseRun,
      progression: {
        ...baseRun.progression!,
        dominantDirection: "recommendation",
        tendencies: {
          ...baseRun.progression!.tendencies,
          recommendation: 100,
          postgraduate: 100,
          employment: 24,
          public_exam: 10,
          undecided: 0,
        },
      },
    });

    expect(run.progression?.dominantDirection).toBe("recommendation");
  });
});
