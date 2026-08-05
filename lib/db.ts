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
    });
  }
  return global.__demoSupabase;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
