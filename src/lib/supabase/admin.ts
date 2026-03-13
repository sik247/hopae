import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client with service role. Use only in API routes or server
 * code that must bypass RLS (e.g. updating entity metadata for integrations).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }
  return createSupabaseClient(url, key)
}
