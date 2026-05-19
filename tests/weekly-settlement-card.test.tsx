import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WeeklySettlementCard } from "@/components/weekly-settlement-card";

describe("weekly settlement card copy pruning", () => {
  it("keeps action recap and totals while removing redundant event and risk summaries", () => {
    const markup = renderToStaticMarkup(
      <WeeklySettlementCard
        title="第 1 周回看"
        subtitle="课程态度：正常混课"
        eventTitle="企业宣讲 / 招聘会"
        eventSummary="这周有一场企业宣讲落到日程里，适合把就业线往前拨一下。"
        dayLines={[
          {
            id: "tue",
            label: "周二",
            actionLabel: "参加宣讲会",
            summary: "你把这天留给了宣讲会，日子也就这样往前走了一点。",
            statsDelta: {
              money: 0,
              mood: 2,
              stress: 1,
              semesterAcademics: 0,
              social: 1,
              fulfillment: 1,
            },
          },
        ]}
        totalLines={[
          { label: "钱", value: -50 },
          { label: "心情", value: 2 },
        ]}
        budgetLines={[]}
        riskLines={["study-group-help", "opportunity:recruitment-talk"]}
      />,
    );

    expect(markup).toContain("第 1 周回看");
    expect(markup).toContain("参加宣讲会");
    expect(markup).toContain("这一周留下了一点变化");
    expect(markup).not.toContain("这周还来着一件事");
    expect(markup).not.toContain("企业宣讲 / 招聘会");
    expect(markup).not.toContain("这周还惦记着的事");
    expect(markup).not.toContain("study-group-help");
    expect(markup).not.toContain("opportunity:recruitment-talk");
  });
});
