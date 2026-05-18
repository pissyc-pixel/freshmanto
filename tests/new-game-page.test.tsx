import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("new-game page", () => {
  it("renders the admission-style new student setup form", async () => {
    const pageModule = await import("@/app/new-game/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain('data-testid="new-game-page"');
    expect(markup).toContain("Freshmanto");
    expect(markup).toContain("form");
    expect(markup).toContain("discipline");
    expect(markup).toContain("name");
  }, 15000);
});
