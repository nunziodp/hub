import { useEffect } from 'react'
import { toast } from 'sonner'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

// Sottoscrizioni Supabase Realtime (sezione 11), attivate al mount dell'AppShell.
// In mock-mode (Supabase non configurato) è un no-op: gli aggiornamenti live
// avvengono già tramite invalidazione delle query nelle mutation.
export function useRealtime() {
  useEffect(() => {
    if (!isSupabaseConfigured) return

    // 1. Badge revisione (parsing_ok = false): invalida lista e contatore
    const revisioneChannel = supabase
      .channel('revisione-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: 'parsing_ok=eq.false' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leads', 'revisione-count'] })
          queryClient.invalidateQueries({ queryKey: ['leads', 'revisione'] })
        },
      )
      .subscribe()

    // 2. Alert credito esaurito sulle RDV
    const walletChannel = supabase
      .channel('wallet-alerts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rdv' }, (payload) => {
        const r = payload.new
        if (r && r.wallet_saldo < r.wallet_soglia_alert) {
          toast.warning(`RDV ${r.ragione_sociale}: credito in esaurimento`)
        }
        queryClient.invalidateQueries({ queryKey: ['rdv'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(revisioneChannel)
      supabase.removeChannel(walletChannel)
    }
  }, [])
}
