const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? "";

export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
  secretKey: supabaseSecretKey
};

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(isSupabaseConfigured() && supabaseConfig.secretKey);
}

