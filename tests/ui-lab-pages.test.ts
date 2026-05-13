import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("ui lab static pages", () => {
  it("renders the start lab headline", async () => {
    const pageModule = await import("@/app/ui-lab/start/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("FRESHMANTO");
    expect(markup).toContain("开启崭新大学生活");
  });

  it("renders the admission lab document heading", async () => {
    const pageModule = await import("@/app/ui-lab/admission/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("录取通知书");
    expect(markup).toContain("SHANGHAI JIAO TONG UNIVERSITY");
  });

  it("renders the planner lab shell", async () => {
    const pageModule = await import("@/app/ui-lab/planner/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("本月周历");
    expect(markup).toContain("第 1 周");
  });

  it("renders the action modal lab overlay", async () => {
    const pageModule = await import("@/app/ui-lab/action-modal/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("周四 · 半天空档");
    expect(markup).toContain("确认选择");
  });

  it("renders the journal lab timeline", async () => {
    const pageModule = await import("@/app/ui-lab/journal/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("成长日志");
    expect(markup).toContain("图书馆的午后");
  });

  it("renders the resume lab timeline", async () => {
    const pageModule = await import("@/app/ui-lab/resume/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("个人履历");
    expect(markup).toContain("核心能力");
  });

  it("renders the monthly journal lab paper page", async () => {
    const pageModule = await import("@/app/ui-lab/monthly-journal/page");
    const markup = renderToStaticMarkup(pageModule.default());

    expect(markup).toContain("九月 · 大一");
    expect(markup).toContain("翻到下个月");
  });
});
