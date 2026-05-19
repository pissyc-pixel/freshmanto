import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const persistCookieMock = vi.fn();
const createServerDemoPresetRunMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: persistCookieMock,
  })),
}));

vi.mock("@/lib/demo/server", () => ({
  createServerDemoRun: vi.fn(),
  createServerDemoPresetRun: createServerDemoPresetRunMock,
}));

describe("loadDemoSaveAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    persistCookieMock.mockClear();
    createServerDemoPresetRunMock.mockReset();
    createServerDemoPresetRunMock.mockResolvedValue({
      run: {
        id: "demo-run-loaded",
      },
    });
  });

  it("redirects back to /demo-saves when presetId is missing", async () => {
    const { loadDemoSaveAction } = await import("@/app/actions");
    const formData = new FormData();

    await expect(loadDemoSaveAction(formData)).rejects.toThrow("REDIRECT:/demo-saves");
    expect(createServerDemoPresetRunMock).not.toHaveBeenCalled();
  });

  it("creates the selected preset run and redirects into /game", async () => {
    const { loadDemoSaveAction } = await import("@/app/actions");
    const formData = new FormData();
    formData.set("presetId", "nankai-business-employment-junior-fall");

    await expect(loadDemoSaveAction(formData)).rejects.toThrow("REDIRECT:/game?runId=demo-run-loaded");
    expect(createServerDemoPresetRunMock).toHaveBeenCalledWith("nankai-business-employment-junior-fall");
  });

  it("redirects back to /demo-saves with a friendly error when preset loading fails", async () => {
    createServerDemoPresetRunMock.mockRejectedValueOnce(new Error("save resume items failed"));
    const { loadDemoSaveAction } = await import("@/app/actions");
    const formData = new FormData();
    formData.set("presetId", "tianda-engineering-recommendation-junior-fall");

    await expect(loadDemoSaveAction(formData)).rejects.toThrow("REDIRECT:/demo-saves?error=load-failed");
    expect(persistCookieMock).not.toHaveBeenCalled();
  });
});
