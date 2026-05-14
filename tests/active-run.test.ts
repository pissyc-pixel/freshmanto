import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FmShellLayout } from "@/components/fm-ui/FmScaffold";
import { buildRunHref, resolveActiveRunId } from "@/lib/demo/active-run";

describe("active run helpers", () => {
  it("prefers the explicit search param runId over cookie fallback", () => {
    expect(
      resolveActiveRunId({
        searchParamRunId: "run-from-url",
        cookieRunId: "run-from-cookie",
      }),
    ).toBe("run-from-url");
  });

  it("falls back to cookie runId when the page URL omits it", () => {
    expect(
      resolveActiveRunId({
        searchParamRunId: undefined,
        cookieRunId: "run-from-cookie",
      }),
    ).toBe("run-from-cookie");
  });

  it("builds internal run links with runId and extra params", () => {
    expect(buildRunHref("/game", "run-123", { focus: "weekly-settlement" })).toBe(
      "/game?runId=run-123&focus=weekly-settlement",
    );
    expect(buildRunHref("/journal", "run-123")).toBe("/journal?runId=run-123");
    expect(buildRunHref("/resume", undefined)).toBe("/resume");
  });

  it("renders sidebar links that preserve the current runId", () => {
    const markup = renderToStaticMarkup(
      createElement(
        FmShellLayout,
        {
          active: "journal",
          runId: "run-123",
          title: "成长日志",
        },
        createElement("div", null, "content"),
      ),
    );

    expect(markup).toContain("/game?runId=run-123");
    expect(markup).toContain("/journal?runId=run-123");
    expect(markup).toContain("/resume?runId=run-123");
    expect(markup).toContain("/ending?runId=run-123");
  });
});
