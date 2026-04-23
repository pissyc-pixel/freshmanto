import { isAiConfigured } from "@/lib/ai/config";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "freshmanto-beta",
    time: new Date().toISOString(),
    checks: {
      supabaseConfigured: isSupabaseConfigured(),
      supabaseAdminConfigured: isSupabaseAdminConfigured(),
      aiConfigured: isAiConfigured(),
    },
  });
}
