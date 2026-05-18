import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("demo saves page", () => {
  it("renders the core demo save list with load actions", async () => {
    const pageModule = await import("@/app/demo-saves/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("载入演示存档");
    expect(markup).toContain("南开商科｜就业路线｜大三上");
    expect(markup).toContain("天大工科｜推免路线｜大三上");
    expect(markup).toContain("第 25 月第 1 周");
  });
});
