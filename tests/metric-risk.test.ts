import { describe, expect, it } from "vitest";

import type { DynamicStats } from "@/types/game";

function buildMetricItems(stats: DynamicStats) {
  return [
    {
      label: "金钱",
      tone: stats.money < 0 ? "red" : stats.money < 300 ? "amber" : "teal",
      warning: stats.money < 0 ? "本周基础开销可能不够" : stats.money < 300 ? "现金有点紧" : undefined,
    },
    {
      label: "心情",
      tone: stats.mood <= 35 ? "rose" : stats.mood <= 50 ? "amber" : "mint",
      warning: stats.mood <= 35 ? "心情已经很低" : stats.mood <= 50 ? "心情偏低" : undefined,
    },
    {
      label: "压力",
      tone: stats.stress >= 75 ? "rose" : stats.stress >= 60 ? "amber" : "blue",
      warning: stats.stress >= 75 ? "压力过高" : stats.stress >= 60 ? "压力偏高" : undefined,
    },
  ];
}

function createStats(overrides?: Partial<DynamicStats>): DynamicStats {
  return {
    money: 1200,
    mood: 60,
    stress: 30,
    fulfillment: 40,
    social: 35,
    semesterAcademics: 45,
    ...overrides,
  };
}

describe("metric risk thresholds", () => {
  describe("金钱", () => {
    it("shows red tone when money is negative", () => {
      const items = buildMetricItems(createStats({ money: -50 }));
      expect(items[0].tone).toBe("red");
      expect(items[0].warning).toBe("本周基础开销可能不够");
    });

    it("shows amber tone when money is below 300", () => {
      const items = buildMetricItems(createStats({ money: 200 }));
      expect(items[0].tone).toBe("amber");
      expect(items[0].warning).toBe("现金有点紧");
    });

    it("shows teal tone when money is normal", () => {
      const items = buildMetricItems(createStats({ money: 800 }));
      expect(items[0].tone).toBe("teal");
      expect(items[0].warning).toBeUndefined();
    });
  });

  describe("心情", () => {
    it("shows rose tone when mood is very low (<=35)", () => {
      const items = buildMetricItems(createStats({ mood: 20 }));
      expect(items[1].tone).toBe("rose");
      expect(items[1].warning).toBe("心情已经很低");
    });

    it("shows amber tone when mood is low (36-50)", () => {
      const items = buildMetricItems(createStats({ mood: 45 }));
      expect(items[1].tone).toBe("amber");
      expect(items[1].warning).toBe("心情偏低");
    });

    it("shows mint tone when mood is normal (>50)", () => {
      const items = buildMetricItems(createStats({ mood: 65 }));
      expect(items[1].tone).toBe("mint");
      expect(items[1].warning).toBeUndefined();
    });
  });

  describe("压力", () => {
    it("shows rose tone when stress is very high (>=75)", () => {
      const items = buildMetricItems(createStats({ stress: 80 }));
      expect(items[2].tone).toBe("rose");
      expect(items[2].warning).toBe("压力过高");
    });

    it("shows amber tone when stress is high (60-74)", () => {
      const items = buildMetricItems(createStats({ stress: 65 }));
      expect(items[2].tone).toBe("amber");
      expect(items[2].warning).toBe("压力偏高");
    });

    it("shows blue tone when stress is normal (<60)", () => {
      const items = buildMetricItems(createStats({ stress: 40 }));
      expect(items[2].tone).toBe("blue");
      expect(items[2].warning).toBeUndefined();
    });
  });
});
