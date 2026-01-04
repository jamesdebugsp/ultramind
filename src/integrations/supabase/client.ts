import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Lovable Cloud fornece a chave publicável (anon) neste env var
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Nunca quebra o app por env ausente (mostra erro no console e mantém client "noop")
const SAFE_URL = SUPABASE_URL ?? "http://localhost:54321";
const SAFE_KEY = SUPABASE_ANON_KEY ?? "public-anon-key";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Backend env vars missing", {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_ANON_KEY,
  });
}

export const supabase = createClient<Database>(SAFE_URL, SAFE_KEY);

