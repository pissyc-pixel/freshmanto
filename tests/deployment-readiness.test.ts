import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";

describe("deployment readiness helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exposes a safe health payload without leaking secret env names or values", async () => {
    const response = await GET();
    const payload = await response.json();
    const serialized = JSON.stringify(payload);
    const shouldBeHealthy = payload.checks.supabaseConfigured && payload.checks.supabaseAdminConfigured;

    expect(payload).toMatchObject({
      status: shouldBeHealthy ? "ok" : "degraded",
      service: "freshmanto-beta",
    });
    expect(response.status).toBe(shouldBeHealthy ? 200 : 503);
    expect(typeof payload.checks.supabaseConfigured).toBe("boolean");
    expect(typeof payload.checks.supabaseAdminConfigured).toBe("boolean");
    expect(typeof payload.checks.aiConfigured).toBe("boolean");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("SUPABASE_SECRET_KEY");
    expect(serialized).not.toContain("OPENAI_API_KEY");
  });

  it("reports degraded status when required supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_BASE_URL", "");

    const { GET: getHealth } = await import("@/app/api/health/route");
    const response = await getHealth();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe("degraded");
    expect(payload.checks).toMatchObject({
      supabaseConfigured: false,
      supabaseAdminConfigured: false,
      aiConfigured: false,
    });
  });
});
