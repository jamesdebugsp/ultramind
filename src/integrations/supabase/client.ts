import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Lovable Cloud fornece estas variáveis automaticamente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Preferir VITE_SUPABASE_ANON_KEY; manter compatibilidade com VITE_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string | undefined;

export const isBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isBackendConfigured) {
  console.error("❌ Backend env vars missing", {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
  });
}

// Nunca aponta para localhost; fallback só evita crash em tempo de importação
const SAFE_URL = SUPABASE_URL ?? "https://placeholder.supabase.co";
const SAFE_KEY = SUPABASE_ANON_KEY ?? "placeholder-key";

export const supabase = createClient<Database>(SAFE_URL, SAFE_KEY);

