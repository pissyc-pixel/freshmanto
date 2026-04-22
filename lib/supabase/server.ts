import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured, supabaseConfig } from "@/lib/supabase/config";

export function createSupabaseServerClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase server client is not configured.");
  }

  return createClient(supabaseConfig.url, supabaseConfig.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

