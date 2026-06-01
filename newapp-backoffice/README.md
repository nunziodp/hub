# NewApp BackOffice

Pannello amministrativo per la distribuzione di lead (Energia, Telefonia e
verticali adiacenti). Stack: React 18 + Vite, React Router, Tailwind + shadcn/ui,
TanStack Query/Table, Zustand, React Hook Form + Zod, Recharts, Supabase.

La specifica completa è in [`../NewApp_ClaudeCode_Spec.md`](../NewApp_ClaudeCode_Spec.md).

## Avvio

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build di produzione
npm run lint
```

## Stato

UI completa e funzionante in **mock-first** (dati in `src/lib/mockData.js`):

- **Dashboard** — KPI, alert, grafici volume/fonti, fonti attive, activity feed
- **Campagne** — accordion verticali → sub-campagne, dettaglio KPI/webhook/sorgenti, nuova sub-campagna
- **RDV** — lista con filtri e sospendi/riattiva; scheda con 6 tab (Anagrafica,
  Configurazione, Lead ricevute, Wallet, Performance, Utenti); Fatturazione; Attive nel mese
- **Statistiche** — Performance fonti, Performance RDV, Report GDPR (revoca, export PDF, audit trail)
- **Lead** — Tutte le lead (31 colonne, filtri, drawer), In revisione, In riciclo,
  Liste fredde, Importa lista (wizard CSV)
- **Realtime/Polish** — `useRealtime` (sez. 11), toast, empty/loading states

> Nota: le tabelle `mandati`/`contratti` sono fuori scope (rimosse dalla spec).

## Attivazione Supabase (fase finale)

Lo strato dati è mock-first. Per passare al backend reale:

1. Crea il progetto Supabase ed esegui la migration `supabase/migrations/0001_init.sql`.
2. Imposta in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
   Con valori reali, `isSupabaseConfigured` diventa `true` e `useRealtime` si attiva.
3. Deploy della Edge Function di ingestion:
   ```bash
   supabase functions deploy ingest-lead
   ```
   Endpoint: `https://<project>.supabase.co/functions/v1/ingest-lead/<sub_campagna_id>`
4. Sostituisci nei vari `useXxx.js` (features) le `queryFn`/`mutationFn` mock con le
   query/mutation Supabase (l'interfaccia restituita ai componenti resta invariata).
5. Configura il custom claim `role = 'backoffice'` nel JWT per le policy RLS.
