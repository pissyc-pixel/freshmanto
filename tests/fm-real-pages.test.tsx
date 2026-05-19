import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("real pages use freshmanto ui shells safely", () => {
  it("renders the start page with the image2-style brand entrance", async () => {
    const pageModule = await import("@/app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("Freshmanto");
    expect(markup).toContain("/new-game");
    expect(markup).toContain("/demo-saves");
    expect(markup).toContain("新生建档");
    expect(markup).toContain("载入演示存档");
    expect(markup).toContain("大学生活模拟器");
  });

  it("renders the journal empty state without fabricating monthly records", async () => {
    const pageModule = await import("@/app/journal/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("这里会收集每个月的 AI 月记");
    expect(markup).toContain("先回到首页创建一局");
    expect(markup).toContain("不会凭空生成");
  });

  it("renders the resume empty state without fabricating resume evidence", async () => {
    const pageModule = await import("@/app/resume/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("个人履历");
    expect(markup).toContain("还没有足够的履历证据");
    expect(markup).toContain("不会直接报错");
  });
});
