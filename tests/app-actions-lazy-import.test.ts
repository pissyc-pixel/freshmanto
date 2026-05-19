import { afterEach, describe, expect, it, vi } from "vitest";

describe("app actions module loading", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not eagerly load heavy demo server modules on import", async () => {
    const demoServerModuleLoaded = vi.fn();
    const ensureSchemaModuleLoaded = vi.fn();
    const aiReportsModuleLoaded = vi.fn();

    vi.doMock("@/lib/demo/server", () => {
      demoServerModuleLoaded();
      return {
        createServerDemoRun: vi.fn(),
        createServerDemoPresetRun: vi.fn(),
        advanceServerDemoTurn: vi.fn(),
        confirmServerWeek: vi.fn(),
        decideServerFutureOffer: vi.fn(),
        planServerWeekdayAction: vi.fn(),
        setServerWeekAttendance: vi.fn(),
      };
    });

    vi.doMock("@/db/ensure-schema", () => {
      ensureSchemaModuleLoaded();
      return {
        ensureDemoSchema: vi.fn(),
      };
    });

    vi.doMock("@/lib/ai/reports", () => {
      aiReportsModuleLoaded();
      return {
        generateAiReport: vi.fn(),
      };
    });

    await import("@/app/actions");

    expect(demoServerModuleLoaded).not.toHaveBeenCalled();
    expect(ensureSchemaModuleLoaded).not.toHaveBeenCalled();
    expect(aiReportsModuleLoaded).not.toHaveBeenCalled();
  });
});
