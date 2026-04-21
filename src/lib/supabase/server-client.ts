import { createClient } from "@supabase/supabase-js";

import { getSupabaseServerEnv } from "@/lib/utils/env";

export function createSupabaseServerClient() {
  const env = getSupabaseServerEnv();

  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      persistSession: false,
    },
  });
}
