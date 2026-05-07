import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

