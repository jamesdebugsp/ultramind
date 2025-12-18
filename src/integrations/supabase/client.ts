console.log('SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
console.log('SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)


import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// NÃO QUEBRA A TELA
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase env vars missing', {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  })
}

export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? ''
)
