import { useEffect, useState } from 'react'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// In sviluppo offline le credenziali Supabase nel .env.local sono dei placeholder
// non validi (https://xxxx.supabase.co). Per non bloccare la UI mock-first
// usiamo una sessione fittizia finché VITE_SUPABASE_URL non punta a un progetto reale.
const MOCK_USER = {
  id: 'mock-admin',
  email: 'admin@newapp.test',
  user_metadata: { full_name: 'Admin NewApp' },
}

// Hook principale: espone user, loading e signOut().
// Quando Supabase è configurato delega a supabase.auth.getSession(); altrimenti
// ritorna l'utente mock (per sviluppo UI senza backend).
export function useAuth() {
  const [user, setUser] = useState(isSupabaseConfigured ? null : MOCK_USER)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInWithPassword(email, password) {
    if (!isSupabaseConfigured) {
      // In modalità mock accettiamo qualsiasi credenziale
      setUser(MOCK_USER)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithPassword, signOut, isMock: !isSupabaseConfigured }
}
