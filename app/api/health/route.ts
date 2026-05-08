import { isAiConfigured } from "@/lib/ai/config";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabaseConfigured: isSupabaseConfigured(),
    supabaseAdminConfigured: isSupabaseAdminConfigured(),
    aiConfigured: isAiConfigured(),
  };
  const isHealthy = checks.supabaseConfigured && checks.supabaseAdminConfigured;

  return Response.json({
    status: isHealthy ? "ok" : "degraded",
    service: "freshmanto-beta",
    time: new Date().toISOString(),
    checks,
  }, {
    status: isHealthy ? 200 : 503,
  });
}
