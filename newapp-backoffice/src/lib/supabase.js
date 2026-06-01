import { createClient } from '@supabase/supabase-js'

// Client Supabase singleton — leggi le variabili da .env.local
// Le variabili devono iniziare con VITE_ per essere esposte dal bundler Vite
const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(URL, ANON_KEY)

// True solo quando le variabili d'ambiente puntano a un progetto reale
// (non ai placeholder di sviluppo). In mock-mode evitiamo connessioni realtime.
export const isSupabaseConfigured =
  !!URL && !URL.includes('xxxx') && !!ANON_KEY && !ANON_KEY.startsWith('eyJ...')
