import { createClient, SupabaseClient } from "@supabase/supabase-js";

let __demoSupabase: SupabaseClient | null = null;
let __lastInit = 0;

export function getDb(): SupabaseClient {
  const now = Date.now();

  // Reinicializar client a cada 5 minutos para limpar cache
  if (!__demoSupabase || (now - __lastInit) > 5 * 60 * 1000) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos em .env.local"
      );
    }
    __demoSupabase = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: "public" },
      global: { headers: { "x-client-info": "supabase-js/" + now } },
    });
    __lastInit = now;
  }
  return __demoSupabase;
}

export function nowIso(): string {
  return new Date().toISOString();
}
