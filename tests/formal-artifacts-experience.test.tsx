import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormalArtifactCards, FormalDocumentPreview } from "@/components/formal-artifacts";
import type { FormalArtifact } from "@/lib/demo/formal-artifacts";

const scholarshipArtifact: FormalArtifact = {
  id: "formal-stage-artifact",
  kind: "scholarship",
  title: "奖学金证书",
  subtitle: "上一学年的稳定积累被正式看见",
  summary: "这份结果来自已经发生过的学业表现和阶段积累。",
  issuer: "学生资助与发展中心",
  serialNumber: "SCH-13-0001",
  sealLabel: "正式发放",
  badgeLabel: "奖学金归档",
  badgeTone: "academic",
  facts: ["第 13 月", "结果层级：较高"],
  periodLabel: "第 13 月",
  monthIndex: 13,
};

const employmentArtifact: FormalArtifact = {
  id: "employment-artifact",
  kind: "employment",
  title: "就业录用通知",
  subtitle: "本地消费品公司市场运营助理",
  summary: "这份机会已经进入正式档案，不再显示内部层级 key。",
  issuer: "校园招聘结果归档中心",
  serialNumber: "OFR-37-0001",
  sealLabel: "待查看",
  badgeLabel: "就业结果",
  badgeTone: "ending",
  facts: ["目标层级：南开 / 天大层级", "结果感受：较好", "薪资感受：较高"],
  periodLabel: "第 37 月",
  monthIndex: 37,
  offerId: "offer-1",
  offerType: "employment",
  accepted: false,
  rejected: false,
  documentHighlights: [
    {
      label: "单位类型",
      value: "一家位于杭州的互联网平台公司",
    },
    {
      label: "岗位",
      value: "商业分析助理",
    },
    {
      label: "工作城市",
      value: "杭州",
    },
    {
      label: "薪资参考",
      value: "年总包约 18-22 万",
    },
  ],
  documentNarrative: [
    "你最终收到了一家位于杭州的互联网平台公司的录用通知，岗位是商业分析助理，年总包约 18-22 万。",
    "大学后期留下的调研项目、商赛经历和实习记录，让这份 offer 显得不是突然出现的结果。",
  ],
};

describe("formal result experience", () => {
  it("shows the emotional sequence as content instead of cramped action buttons", () => {
    const cardMarkup = renderToStaticMarkup(<FormalArtifactCards artifacts={[scholarshipArtifact]} />);
    const documentMarkup = renderToStaticMarkup(
      <FormalDocumentPreview artifact={scholarshipArtifact} recipientName="同学" />,
    );

    for (const stage of ["等待", "揭晓", "被认可", "回看付出", "留下纪念"]) {
      expect(cardMarkup).toContain(stage);
      expect(documentMarkup).toContain(stage);
    }
  });

  it("renders wide, player-facing artifact cards without internal fields or English offer labels", () => {
    const markup = renderToStaticMarkup(
      <FormalArtifactCards artifacts={[employmentArtifact]} runId="demo-run" showOfferActions />,
    );

    expect(markup).toContain("就业录用通知");
    expect(markup).toContain("本地消费品公司市场运营助理");
    expect(markup).toContain("收进履历");
    expect(markup).toContain("留作纪念");
    expect(markup).not.toContain("Offer Letter");
    expect(markup).not.toContain("market-ops");
    expect(markup).not.toContain("quality");
    expect(markup).not.toContain("salaryLevel");
  });

  it("renders the final employment document around the offer body instead of a repeated side summary", () => {
    const markup = renderToStaticMarkup(
      <FormalDocumentPreview artifact={employmentArtifact} recipientName="同学" />,
    );

    expect(markup).toContain("单位类型");
    expect(markup).toContain("岗位");
    expect(markup).toContain("工作城市");
    expect(markup).toContain("薪资参考");
    expect(markup).toContain("一家位于杭州的互联网平台公司");
    expect(markup).toContain("商业分析助理");
    expect(markup).toContain("年总包约 18-22 万");
    expect(markup).toContain("调研项目、商赛经历和实习记录");
    expect(markup).not.toContain("结果类型");
    expect(markup).not.toContain("归档时间");
    expect(markup).not.toContain("现在留下的是");
  });

  it("dedupes duplicate artifacts before rendering cards", () => {
    const duplicateMarkup = renderToStaticMarkup(
      <FormalArtifactCards
        artifacts={[
          scholarshipArtifact,
          { ...scholarshipArtifact, subtitle: "重复项", summary: "不应该再渲染第二次。" },
        ]}
      />,
    );

    expect(duplicateMarkup.match(/奖学金证书/g)?.length ?? 0).toBe(1);
  });
});
