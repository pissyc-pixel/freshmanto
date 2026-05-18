import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("new-game page", () => {
  it("renders the admission-style new student setup form", async () => {
    const pageModule = await import("@/app/new-game/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("Freshmanto 新生建档");
    expect(markup).toContain("输入你的姓名");
    expect(markup).toContain("文科");
    expect(markup).toContain("理科");
    expect(markup).toContain("工科");
    expect(markup).toContain("商科");
    expect(markup).toContain("医科");
    expect(markup).toContain("开始入学");
  });
});
