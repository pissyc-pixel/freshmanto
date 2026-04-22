import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseAdminConfigured, supabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/db";

export type ServerSupabaseClient = SupabaseClient<Database>;

export function createSupabaseServerClient() {
  assertSupabaseAdminConfigured();

  return createClient<Database>(supabaseConfig.url, supabaseConfig.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
