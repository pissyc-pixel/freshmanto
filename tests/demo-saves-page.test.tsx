import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("demo saves page", () => {
  it("renders the core demo save list with load actions", async () => {
    const pageModule = await import("@/app/demo-saves/page");
    const markup = renderToStaticMarkup(await pageModule.default({ searchParams: Promise.resolve({}) }));

    expect(markup).toContain("Demo Save Center");
    expect(markup).toContain("nankai-business-employment-junior-fall");
    expect(markup).toContain("nankai-business-employment-final");
    expect(markup).toContain("tianda-engineering-recommendation-junior-fall");
    expect(markup).toContain("tianda-engineering-recommendation-final");
    expect(markup).toContain("presetId");
    expect(markup).not.toContain("generic-211-postgraduate-junior-fall");
    expect(markup).not.toContain("second-tier-employment-warning-junior-fall");
  });

  it("shows a friendly recovery alert when demo save loading failed previously", async () => {
    const pageModule = await import("@/app/demo-saves/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({ searchParams: Promise.resolve({ error: "load-failed" }) }),
    );

    expect(markup).toContain('role="alert"');
  });
});
