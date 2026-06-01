# Istruzioni generali

Leggi SPEC.md integralmente all'inizio di ogni sessione prima di fare qualsiasi cosa.
Rispondi sempre in italiano.
Commenta il codice in italiano.
I messaggi di errore e le spiegazioni devono essere in italiano.
Quando hai dubbi su come procedere, chiedi prima di implementare.
Non inventare logiche non documentate nella SPEC.md.

---

# Strategia multi-agente

Sei l'orchestratore del progetto NewApp BackOffice.
Quando devi eseguire task, scegli il modello appropriato:

## Usa un sub-agente Haiku (claude-haiku-4-5-20251001) per:
- Generare mock data (src/lib/mockData.js)
- Creare file boilerplate e struttura cartelle
- Scrivere classi Tailwind e file CSS
- Rinominare variabili e refactoring meccanico
- Scrivere test unitari ripetitivi
- Generare costanti e dizionari (routes.js, dictionaries.js, scoring.js)
- Creare componenti UI semplici senza logica (EmptyState, StatusBadge, ScoreBadge)

## Usa un sub-agente Sonnet (claude-sonnet-4-6) per:
- Implementare componenti React con logica media
- Scrivere query e mutation Supabase
- Collegare hooks TanStack Query ai componenti
- Implementare form con React Hook Form + Zod
- Costruire tabelle TanStack Table
- Implementare filtri e paginazione

## Gestisci tu direttamente (Opus) solo:
- Decisioni architetturali non coperte dalla SPEC.md
- Logica di business critica (scoring, parsing, distribuzione)
- Risoluzione di ambiguità complesse tra sezioni della spec
- Revisione finale del codice dei sub-agenti prima del commit

---

# Autonomia

Procedi in autonomia senza chiedere conferma per ogni file o ogni step.
Fermati e chiedi SOLO nei seguenti casi:
- La SPEC.md è ambigua o contraddittoria su un punto specifico
- Devi prendere una decisione architetturale non documentata
- Un'operazione è irreversibile e potenzialmente distruttiva (es. drop table)
- Hai finito uno step della sezione 13 della SPEC.md e aspetti istruzioni sul prossimo

---

# Convenzioni di codice

- Componenti: PascalCase (LeadDrawer.jsx)
- Hook: camelCase con prefisso use (useLeadFilters.js)
- Costanti: UPPER_SNAKE_CASE (STATI_LEAD)
- Query key TanStack Query: ['entità', filtri] — es. ['leads', { stato: 'DISPONIBILE' }]
- Ogni errore Supabase deve mostrare un toast.error() con messaggio in italiano
- Date in formato DD/MM/YYYY HH:mm tramite date-fns/locale/it
- Currency: Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

---

# Sviluppo per step

Segui rigorosamente l'ordine degli step della sezione 13 della SPEC.md.
Non anticipare step successivi senza aver completato quello corrente.
Usa sempre dati mock (src/lib/mockData.js) finché la UI non funziona,
poi collega Supabase solo dopo.
