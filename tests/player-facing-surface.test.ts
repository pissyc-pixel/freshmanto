import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/generators/opening";
import { buildResumeFormalArtifacts } from "@/lib/demo/formal-artifacts";
import {
  formatPlayerFacingMonthIndex,
  sanitizePlayerFacingText,
} from "@/lib/player-facing-text";

describe("player-facing surface cleanup", () => {
  it("maps internal keys to natural Chinese and removes raw field names", () => {
    const text = sanitizePlayerFacingText(
      "project market-ops.first-entry quality: good salaryLevel: high sourceId artifactId category delta fallback nankai_tianda employment monthly",
    );

    expect(text).toContain("项目经历");
    expect(text).toContain("本地消费品公司市场运营助理");
    expect(text).toContain("较好");
    expect(text).toContain("较高");
    expect(text).toContain("南开 / 天大层级");
    expect(text).toContain("就业方向");
    expect(text).not.toContain("market-ops");
    expect(text).not.toContain("sourceId");
    expect(text).not.toContain("artifactId");
    expect(text).not.toContain("category");
    expect(text).not.toContain("delta");
    expect(text).not.toContain("fallback");
    expect(text).not.toContain("salaryLevel");
    expect(text).not.toContain("quality");
  });

  it("clamps player-facing months to the supported timeline", () => {
    expect(formatPlayerFacingMonthIndex(22)).toBe("第 22 月");
    expect(formatPlayerFacingMonthIndex(65136)).toBe("第 48 月");
  });

  it("builds formal artifacts from real month fields instead of parsing digits out of ids", () => {
    const run = createInitialGameRun({
      id: "artifact-run",
      name: "测试同学",
      discipline: "engineering",
      randomValues: [0.2, 0.4, 0.6, 0.8],
    });

    run.resume = [
      {
        id: "competition-artifact-65136-79",
        category: "competition",
        title: "竞赛获奖记录",
        summary: "这份结果来自真实比赛。",
        month: 22,
        tags: ["school", "first"],
      },
    ];
    run.futureOffers = [
      {
        id: "offer-1",
        type: "employment",
        title: "market-ops.first-entry",
        tier: "nankai_tianda",
        quality: "good",
        reasons: ["这份机会已经落地。"],
        tradeoffs: ["离家更近一些。"],
        accepted: false,
        rejected: false,
        monthIndex: 37,
        salaryLevel: "high",
      },
    ];

    const artifacts = buildResumeFormalArtifacts(run);
    const competition = artifacts.find((item) => item.kind === "competition");
    const offer = artifacts.find((item) => item.kind === "employment");

    expect(competition?.periodLabel).toBe("第 22 月");
    expect(competition?.monthIndex).toBe(22);
    expect(competition?.periodLabel).not.toContain("65136");

    expect(offer?.title).toBe("就业录用通知");
    expect(offer?.subtitle).toContain("本地消费品公司市场运营助理");
    expect(offer?.facts.join(" ")).toContain("南开 / 天大层级");
    expect(offer?.facts.join(" ")).toContain("较好");
    expect(offer?.facts.join(" ")).toContain("较高");
    expect(offer?.facts.join(" ")).not.toContain("nankai_tianda");
    expect(offer?.facts.join(" ")).not.toContain("good");
    expect(offer?.facts.join(" ")).not.toContain("high");
  });
});
