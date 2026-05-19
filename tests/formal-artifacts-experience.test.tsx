import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormalArtifactCards, FormalDocumentPreview } from "@/components/formal-artifacts";
import type { FormalArtifact } from "@/lib/demo/formal-artifacts";

const artifact: FormalArtifact = {
  id: "formal-stage-artifact",
  kind: "scholarship",
  title: "奖学金证书",
  subtitle: "第 1 学年",
  summary: "这一年的投入被正式看见。",
  issuer: "Freshmanto 奖学金评审组",
  serialNumber: "SCH-001",
  sealLabel: "已归档",
  badgeLabel: "奖学金发放",
  badgeTone: "academic",
  facts: ["6000 元"],
  periodLabel: "M13",
  monthIndex: 13,
};

describe("formal result experience", () => {
  it("shows the full emotional sequence on formal result cards and documents", () => {
    const cardMarkup = renderToStaticMarkup(<FormalArtifactCards artifacts={[artifact]} />);
    const documentMarkup = renderToStaticMarkup(
      <FormalDocumentPreview artifact={artifact} recipientName="测试同学" />,
    );

    for (const stage of ["等待", "揭晓", "被认可", "回看付出", "留下纪念"]) {
      expect(cardMarkup).toContain(stage);
      expect(documentMarkup).toContain(stage);
    }
  });
});
