export const SUPABASE_ENV_KEYS = {
  url: "NEXT_PUBLIC_SUPABASE_URL",
  publishableKey: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  secretKey: "SUPABASE_SECRET_KEY"
} as const;

export const supabaseConfig = Object.freeze({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  secretKey: process.env.SUPABASE_SECRET_KEY ?? ""
});

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(isSupabaseConfigured() && supabaseConfig.secretKey);
}

export function getMissingSupabaseEnvKeys(options?: { requireAdmin?: boolean }) {
  const missingKeys: string[] = [];

  if (!supabaseConfig.url) {
    missingKeys.push(SUPABASE_ENV_KEYS.url);
  }

  if (!supabaseConfig.publishableKey) {
    missingKeys.push(SUPABASE_ENV_KEYS.publishableKey);
  }

  if (options?.requireAdmin && !supabaseConfig.secretKey) {
    missingKeys.push(SUPABASE_ENV_KEYS.secretKey);
  }

  return missingKeys;
}

export function assertSupabaseConfigured() {
  const missingKeys = getMissingSupabaseEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(`Supabase is not configured. Missing env keys: ${missingKeys.join(", ")}`);
  }
}

export function assertSupabaseAdminConfigured() {
  const missingKeys = getMissingSupabaseEnvKeys({ requireAdmin: true });

  if (missingKeys.length > 0) {
    throw new Error(`Supabase admin client is not configured. Missing env keys: ${missingKeys.join(", ")}`);
  }
}
