import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase browser client is not configured.");
  }

  return createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      persistSession: false
    }
  });
}

