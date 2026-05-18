import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
  it("rejects mismatched field names so the front end must submit discipline", async () => {
    const { startNewRunAction } = await import("@/app/actions");
    const formData = new FormData();
    formData.set("name", "鄢书阅");
    formData.set("collegeTrack", "arts");

    await expect(startNewRunAction(formData)).rejects.toThrow("REDIRECT:/new-game");
    expect(createServerDemoRunMock).not.toHaveBeenCalled();
  });
});

const persistCookieMock = vi.fn();
const createServerDemoRunMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: persistCookieMock,
  })),
}));

vi.mock("@/lib/demo/server", () => ({
  createServerDemoRun: createServerDemoRunMock,
}));

describe("startNewRunAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    persistCookieMock.mockClear();
    createServerDemoRunMock.mockReset();
    createServerDemoRunMock.mockResolvedValue({
      run: {
        id: "run-new-student",
      },
    });
  });

  it("redirects back to /new-game instead of creating a run when formData is missing", async () => {
    const { startNewRunAction } = await import("@/app/actions");

    await expect(startNewRunAction()).rejects.toThrow("REDIRECT:/new-game");
    expect(createServerDemoRunMock).not.toHaveBeenCalled();
  });

  it("redirects back to /new-game instead of creating a run when required fields are incomplete", async () => {
    const { startNewRunAction } = await import("@/app/actions");
    const formData = new FormData();
    formData.set("name", "林舒恒");

    await expect(startNewRunAction(formData)).rejects.toThrow("REDIRECT:/new-game");
    expect(createServerDemoRunMock).not.toHaveBeenCalled();
  });

  it("creates a run only when name and discipline are both present and valid", async () => {
    const { startNewRunAction } = await import("@/app/actions");
    const formData = new FormData();
    formData.set("name", " 林舒恒 ");
    formData.set("discipline", "arts");

    await expect(startNewRunAction(formData)).rejects.toThrow("REDIRECT:/admission?runId=run-new-student");
    expect(createServerDemoRunMock).toHaveBeenCalledWith({
      name: "林舒恒",
      discipline: "arts",
    });
  });
});
