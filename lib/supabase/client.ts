import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/db";

export type BrowserSupabaseClient = SupabaseClient<Database>;

let browserClient: BrowserSupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  assertSupabaseConfigured();

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: false
      }
    });
  }

  return browserClient;
}
