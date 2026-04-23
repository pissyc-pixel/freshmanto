import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("deployment readiness helpers", () => {
  it("exposes a safe health payload without leaking secret env names or values", async () => {
    const response = await GET();
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: "ok",
      service: "freshmanto-beta",
    });
    expect(typeof payload.checks.supabaseConfigured).toBe("boolean");
    expect(typeof payload.checks.supabaseAdminConfigured).toBe("boolean");
    expect(typeof payload.checks.aiConfigured).toBe("boolean");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("SUPABASE_SECRET_KEY");
    expect(serialized).not.toContain("OPENAI_API_KEY");
  });
});
