import { describe, expect, it } from "vitest";

import { createStarterProfile } from "@/core/generators/opening";

describe("starter profile generation", () => {
  it("keeps the player-selected discipline instead of overwriting it randomly", () => {
    const profile = createStarterProfile({
      randomValues: [0.1, 0.2, 0.3, 0.4, 0.95, 0.6, 0.7, 0.8],
      name: "林舒恒",
      discipline: "arts",
    } as never);

    expect(profile.name).toBe("林舒恒");
    expect(profile.collegeTrack).toBe("arts");
  });
});
