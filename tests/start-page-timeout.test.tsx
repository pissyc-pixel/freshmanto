import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(),
}));

describe("start page timeout fallback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("renders the start page even when reading the active run cookie hangs", async () => {
    vi.useFakeTimers();
    const { readActiveRunIdFromCookies } = await import("@/lib/demo/server-run-context");
    vi.mocked(readActiveRunIdFromCookies).mockImplementation(
      () => new Promise<string | undefined>(() => undefined),
    );

    const pageModule = await import("@/app/page");
    const markupPromise = pageModule.default();

    await vi.advanceTimersByTimeAsync(250);

    const markup = renderToStaticMarkup(await markupPromise);
    expect(markup).toContain("Freshmanto");
    expect(markup).toContain("/demo-saves");
  });
});
