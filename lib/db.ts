import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare global {
  var __demoSupabase: SupabaseClient | undefined;
}

export function getDb(): SupabaseClient {
  if (!global.__demoSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos em .env.local"
      );
    }
    global.__demoSupabase = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: "public" },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return global.__demoSupabase;
}

export function nowIso(): string {
  return new Date().toISOString();
}
