import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

export async function createSupabaseServerClient() {
  assertSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In Server Components, setting cookies may throw; middleware handles refresh.
        }
      },
    },
  });
}

