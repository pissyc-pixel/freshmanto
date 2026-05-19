import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormalArtifactCards, FormalDocumentPreview } from "@/components/formal-artifacts";
import type { FormalArtifact } from "@/lib/demo/formal-artifacts";

const artifact: FormalArtifact = {
  id: "formal-stage-artifact",
  kind: "scholarship",
  title: "Scholarship Certificate",
  subtitle: "Year 1",
  summary: "Recognized for sustained academic progress.",
  issuer: "Freshmanto Records",
  serialNumber: "SCH-001",
  sealLabel: "Official",
  badgeLabel: "Scholarship",
  badgeTone: "academic",
  facts: ["6000"],
  periodLabel: "M13",
  monthIndex: 13,
};

describe("formal result experience", () => {
  it("shows the full emotional sequence on formal result cards and documents", () => {
    const cardMarkup = renderToStaticMarkup(<FormalArtifactCards artifacts={[artifact]} />);
    const documentMarkup = renderToStaticMarkup(
      <FormalDocumentPreview artifact={artifact} recipientName="Player" />,
    );

    for (const stage of ["等待", "揭晓", "被认可", "回看付出", "留下纪念"]) {
      expect(cardMarkup).toContain(stage);
      expect(documentMarkup).toContain(stage);
    }
  });

  it("dedupes duplicate artifacts before rendering cards", () => {
    const duplicateMarkup = renderToStaticMarkup(
      <FormalArtifactCards
        artifacts={[
          artifact,
          { ...artifact, subtitle: "Duplicate", summary: "Duplicate artifact row." },
        ]}
      />,
    );

    expect(duplicateMarkup.match(/Scholarship Certificate/g)?.length ?? 0).toBe(1);
  });
});
