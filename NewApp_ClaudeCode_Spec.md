# NewApp BackOffice — Specifica per Claude Code

> **Documento di lavoro per Claude Code.**
> Leggi tutto prima di scrivere una riga di codice.
> Questo file è la fonte di verità: architettura, struttura cartelle, convenzioni, schema DB, routing e comportamento di ogni schermata.

---

## 0. Contesto di progetto

NewApp è una piattaforma B2B per la distribuzione di lead nei mercati Energia, Telefonia e verticali adiacenti (Fotovoltaico, Depuratori, Home Improvement).

Si posiziona come hub tra chi genera lead (Athenix) e chi le acquista (RDV/call center).

Questa specifica copre **solo il BackOffice** — il pannello amministrativo usato dagli operatori NGroup/Athenix. Il portale RDV sarà sviluppato in una fase successiva.

---

## 1. Stack tecnico

| Layer | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| UI Components | shadcn/ui + Tailwind CSS v3 |
| Icone | lucide-react |
| Grafici | Recharts |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State management | Zustand (global) + TanStack Query v5 (server state) |
| Form | React Hook Form + Zod |
| Date | date-fns |
| Tabelle | TanStack Table v8 |
| Notifiche toast | sonner |
| Lingua UI | Italiano (tutta l'interfaccia in italiano) |

### Setup iniziale

```bash
npm create vite@latest newapp-backoffice -- --template react
cd newapp-backoffice
npm install

# UI
npx shadcn-ui@latest init
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# Data & state
npm install @supabase/supabase-js @tanstack/react-query @tanstack/react-table zustand

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install recharts lucide-react date-fns sonner
```

### Variabili d'ambiente (.env.local)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 2. Struttura cartelle

```
src/
├── app/                        # Entry point e providers
│   ├── App.jsx
│   ├── Router.jsx
│   └── Providers.jsx           # QueryClient, Supabase, Zustand
│
├── components/
│   ├── ui/                     # shadcn/ui (auto-generati, non toccare)
│   ├── layout/
│   │   ├── AppShell.jsx        # Topbar + Sidebar + main content
│   │   ├── Topbar.jsx
│   │   └── Sidebar.jsx
│   └── shared/                 # Componenti riutilizzabili business-logic
│       ├── KpiCard.jsx
│       ├── DataTable.jsx       # Wrapper TanStack Table
│       ├── StatusBadge.jsx     # Pill colorata per stati lead/RDV
│       ├── ScoreBadge.jsx      # Badge PLATINUM/GOLD/SILVER/RECYCLE
│       ├── ScreenHeader.jsx    # H1 + pulsante azione primaria
│       └── EmptyState.jsx
│
├── features/                   # Un folder per sezione sidebar
│   ├── dashboard/
│   │   ├── DashboardPage.jsx
│   │   ├── components/
│   │   │   ├── KpiRow.jsx
│   │   │   ├── AlertBanner.jsx
│   │   │   ├── VolumeChart.jsx
│   │   │   ├── SourceChart.jsx
│   │   │   ├── ActiveSourcesTable.jsx
│   │   │   └── ActivityFeed.jsx
│   │   └── hooks/
│   │       └── useDashboardData.js
│   │
│   ├── campagne/
│   │   ├── CampagnePage.jsx
│   │   ├── components/
│   │   │   ├── VerticaleAccordion.jsx
│   │   │   ├── SubCampagnaRow.jsx
│   │   │   ├── SubCampagnaDetail.jsx
│   │   │   ├── WebhookConfig.jsx
│   │   │   └── NuovaSubCampagnaForm.jsx
│   │   └── hooks/
│   │       └── useCampagne.js
│   │
│   ├── rdv/
│   │   ├── RdvListPage.jsx
│   │   ├── RdvActivePage.jsx
│   │   ├── RdvDetailPage.jsx
│   │   ├── FatturazionePage.jsx
│   │   ├── components/
│   │   │   ├── RdvTable.jsx
│   │   │   ├── SchedaRdvHeader.jsx
│   │   │   ├── tabs/
│   │   │   │   ├── TabAnagrafica.jsx
│   │   │   │   ├── TabConfigurazione.jsx
│   │   │   │   ├── TabLeadRicevute.jsx
│   │   │   │   ├── TabWallet.jsx
│   │   │   │   ├── TabPerformance.jsx
│   │   │   │   └── TabUtenti.jsx
│   │   │   ├── SubCampagneConfig.jsx
│   │   │   ├── CrmWebhookConfig.jsx
│   │   │   └── WalletMovements.jsx
│   │   └── hooks/
│   │       ├── useRdvList.js
│   │       └── useRdvDetail.js
│   │
│   ├── statistiche/
│   │   ├── StatFontiPage.jsx
│   │   ├── StatRdvPage.jsx
│   │   ├── StatGdprPage.jsx
│   │   └── components/
│   │
│   └── lead/
│       ├── LeadPage.jsx         # Layout con sub-nav interno
│       ├── TutteLeLead.jsx
│       ├── RiciclaInvia.jsx
│       ├── ImportaListe.jsx
│       ├── InAttesaRevisione.jsx
│       ├── InRiciclo.jsx
│       ├── ListeFredde.jsx
│       ├── components/
│       │   ├── LeadTable.jsx
│       │   ├── LeadDrawer.jsx
│       │   ├── LeadFilters.jsx
│       │   ├── RiciclaPopup.jsx
│       │   └── ImportWizard.jsx
│       └── hooks/
│           └── useLead.js
│
├── lib/
│   ├── supabase.js             # Client Supabase singleton
│   ├── queryClient.js          # TanStack Query config
│   └── utils.js                # cn(), formatCurrency(), formatDate(), ecc.
│
├── hooks/
│   ├── useAuth.js              # Supabase Auth
│   └── useRealtime.js          # Supabase Realtime subscriptions
│
├── stores/
│   └── uiStore.js              # Zustand: sidebar, drawer, alert state
│
└── constants/
    ├── routes.js               # Tutte le route come costanti
    ├── scoring.js              # FASCE, PESI_SCORING, PENALITA
    └── dictionaries.js         # STATI_LEAD, FONTI, FORMATI, SETTORI
```

---

## 3. Routing

```jsx
// src/app/Router.jsx
// Tutte le route sono protette da AuthGuard
// L'utente non autenticato viene rimandato a /login

const routes = [
  { path: '/login',                    element: <LoginPage /> },
  {
    path: '/',
    element: <AppShell />,             // Layout con topbar + sidebar
    children: [
      { index: true,                   element: <Navigate to="/dashboard" /> },
      { path: 'dashboard',             element: <DashboardPage /> },

      // Campagne
      { path: 'campagne',              element: <CampagnePage /> },

      // RDV
      { path: 'rdv',                   element: <Navigate to="/rdv/tutte" /> },
      { path: 'rdv/tutte',             element: <RdvListPage /> },
      { path: 'rdv/attive',            element: <RdvActivePage /> },
      { path: 'rdv/:id',               element: <RdvDetailPage /> },
      { path: 'rdv/fatturazione',      element: <FatturazionePage /> },

      // Statistiche
      { path: 'statistiche/fonti',     element: <StatFontiPage /> },
      { path: 'statistiche/rdv',       element: <StatRdvPage /> },
      { path: 'statistiche/gdpr',      element: <StatGdprPage /> },

      // Lead
      { path: 'lead',                  element: <LeadPage /> },         // sub-nav interno
      { path: 'lead/tutte',            element: <TutteLeLead /> },
      { path: 'lead/revisione',        element: <InAttesaRevisione /> },
      { path: 'lead/riciclo',          element: <InRiciclo /> },
      { path: 'lead/liste-fredde',     element: <ListeFredde /> },
      { path: 'lead/importa',          element: <ImportaListe /> },
    ]
  }
]
```

---

## 4. Layout — AppShell

Il layout è fisso e condiviso da tutte le schermate.

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR  (h-14, sticky top-0, z-50)                         │
│  Logo | Breadcrumb           Notifiche | Nome utente | Logout│
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│   SIDEBAR    │   CONTENT AREA                               │
│   (w-60)     │   (flex-1, overflow-y-auto, p-6)             │
│   fixed      │                                               │
│   left       │   <ScreenHeader title="..." action={...} />  │
│              │   — contenuto specifico schermata —           │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

### Sidebar — voci e sottovoci

```jsx
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Campagne',
    icon: Megaphone,
    href: '/campagne',
  },
  {
    label: 'RDV',
    icon: Building2,
    children: [
      { label: 'Tutte le RDV',       href: '/rdv/tutte' },
      { label: 'Attive nel mese',    href: '/rdv/attive' },
      { label: 'Fatturazione',       href: '/rdv/fatturazione' },
    ]
  },
  {
    label: 'Statistiche',
    icon: BarChart3,
    children: [
      { label: 'Performance fonti',  href: '/statistiche/fonti' },
      { label: 'Performance RDV',    href: '/statistiche/rdv' },
      { label: 'Report GDPR',        href: '/statistiche/gdpr' },
    ]
  },
  {
    label: 'Lead',
    icon: Zap,
    children: [
      { label: 'Tutte le lead',      href: '/lead/tutte' },
      { label: 'In revisione',       href: '/lead/revisione', badge: 'revisioneCount' },
      { label: 'In riciclo',         href: '/lead/riciclo' },
      { label: 'Liste fredde',       href: '/lead/liste-fredde' },
      { label: 'Importa lista',      href: '/lead/importa' },
    ]
  },
]
```

Il badge `revisioneCount` mostra il numero di lead con `parsing_ok = false`. Va recuperato da Supabase con un count query e aggiornato tramite Realtime.

---

## 5. Schema database Supabase

Crea queste tabelle in Supabase. Ordine di creazione: rispetta le FK (prima le tabelle referenziate).

### 5.1 Tabella `rdv`

```sql
create table rdv (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  ragione_sociale       text not null,
  piva                  text,
  codice_fiscale        text,
  sdi                   text,
  pec                   text,
  sede_via              text,
  sede_cap              text,
  sede_citta            text,
  telefono              text,
  email_amministrativa  text,
  referente_nome        text,
  referente_email       text,
  referente_telefono    text,
  commerciale_id        uuid references auth.users(id),
  tier                  text check (tier in ('A','B','C')) default 'C',
  stato                 text check (stato in ('attiva','sospesa','in_prova','archiviata')) default 'in_prova',
  verticali             text[] default '{}',         -- ['ENERGIA','TELEFONIA']
  sub_campagne_attive   uuid[] default '{}',
  volume_max_giornaliero int default 100,
  score_minimo          int default 0,
  algoritmo_distribuzione text check (algoritmo_distribuzione in ('proporzionale','priority','esclusivo')) default 'proporzionale',
  distribuzione_attiva  boolean default true,
  riattivazione_at      timestamptz,
  fonti_accettate       text[] default '{}',
  webhook_url           text,
  webhook_auth_type     text check (webhook_auth_type in ('bearer','hmac','none')) default 'none',
  webhook_auth_token    text,
  metodo_integrazione   text check (metodo_integrazione in ('webhook','api_pull','portale','email')) default 'portale',
  crm_webhook           jsonb,                       -- vedi struttura sotto
  wallet_saldo          numeric(10,2) default 0,
  wallet_budget_allocato numeric(10,2) default 0,
  wallet_soglia_alert   numeric(10,2) default 200,
  note_interne          text
);

-- crm_webhook jsonb struttura:
-- {
--   url, method, auth_type, auth_token, headers: {},
--   mapping: {nome, cognome, telefono, email, verticale, fascia},
--   attivo: bool, ultimo_invio: timestamp, ultimo_esito: int,
--   invii_oggi: int, errori_oggi: int
-- }
```

### 5.2 Tabella `verticali`

```sql
create table verticali (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null unique,        -- 'ENERGIA', 'TELEFONIA', 'FOTOVOLTAICO', ecc.
  attivo boolean default true,
  -- Configurazione scoring per questo verticale
  peso_fonte        int default 40,   -- % peso dimensione 1
  peso_campagna     int default 30,   -- % peso dimensione 2
  peso_geo          int default 20,   -- % peso dimensione 3
  peso_consenso     int default 10,   -- % peso dimensione 4
  -- Soglie fasce
  soglia_platinum   int default 80,
  soglia_gold       int default 60,
  soglia_silver     int default 40,
  -- Scadenza consenso
  consenso_scadenza_giorni int default 365
);

insert into verticali (nome) values ('ENERGIA'), ('TELEFONIA');
```

### 5.3 Tabella `sub_campagne`

```sql
create table sub_campagne (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  verticale_id    uuid references verticali(id),
  nome            text not null,
  formato         text check (formato in ('LEADADS','LANDING','CHATBOT','IVR','ALTRO')),
  punteggio_base  int default 50 check (punteggio_base between 1 and 100),
  soglia_alert_ore int default 4,
  stato           text check (stato in ('attiva','in_pausa')) default 'attiva',
  webhook_url     text,
  webhook_secret  text,
  webhook_ultimo_test timestamptz,
  webhook_ultimo_esito boolean,
  -- Stats cache (aggiornate periodicamente)
  lead_30gg       int default 0,
  score_medio     numeric(5,2) default 0,
  tasso_contatto  numeric(5,2) default 0,
  spend_30gg      numeric(10,2) default 0,
  -- Campagne collegate (array di oggetti)
  campagne_collegate jsonb default '[]'
  -- struttura elemento: {piattaforma, campaign_id, spend, lead_generate}
);
```

### 5.4 Tabella `leads`

```sql
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),

  -- Anagrafica
  nome                text,
  cognome             text,
  telefono            text,
  email               text,
  cap                 text,

  -- Consenso GDPR
  consent_given       boolean default false,
  consent_date        timestamptz,
  consent_proof       text,
  consent_source      text check (consent_source in ('FORM_NATIVO','TRUSTEDFORM','IMPORT','CHATBOT')),
  consent_version     text,
  consent_scope       text[] default '{}',
  consent_expires_at  timestamptz,
  consent_revoked_at  timestamptz,
  gdpr_audit_log      jsonb default '[]',  -- array append-only

  -- Campaign name
  campaign_name_raw   text,
  campaign_id         text,
  campaign_child_id   text,

  -- Campi parsati
  settore             text,
  cliente             text,
  campagna_cliente    text,
  offerta             text,
  creativita          text,
  formato             text,
  fonte               text,
  versione            text,
  automazione         text,

  -- Scoring
  sub_campagna_id     uuid references sub_campagne(id),
  parsing_ok          boolean default true,
  score               int,
  score_breakdown     jsonb,  -- {fonte: int, campagna: int, geo: int, consenso: int}
  fascia              text check (fascia in ('PLATINUM','GOLD','SILVER','RECYCLE')),

  -- Stato e distribuzione
  stato               text check (stato in (
    'RICEVUTA','DISPONIBILE','ASSEGNATA','CONSEGNATA',
    'ERRORE_CONSEGNA','IN_LAVORAZIONE','CONTATTATA',
    'CHIUSA_WON','CHIUSA_LOST','NON_CONTATTATA',
    'IN_RICICLO','RICICLATA','LISTA_FREDDA','SCADUTA','BLOCCATA'
  )) default 'RICEVUTA',
  rdv_id              uuid references rdv(id),
  rdv_secondaria_id   uuid references rdv(id),
  consegnata_at       timestamptz,
  riciclo_count       int default 0,
  lista_fredda        boolean default false,
  lista_fredda_at     timestamptz
);

-- Indici critici per performance
create index leads_stato_idx on leads(stato);
create index leads_rdv_id_idx on leads(rdv_id);
create index leads_created_at_idx on leads(created_at desc);
create index leads_parsing_ok_idx on leads(parsing_ok) where parsing_ok = false;
create index leads_telefono_hash_idx on leads using hash(telefono);
```

### 5.5 Tabella `wallet_movimenti`

```sql
create table wallet_movimenti (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  rdv_id      uuid references rdv(id) not null,
  tipo        text check (tipo in ('lead_ricevuta','ricarica','rettifica')) not null,
  descrizione text,
  importo     numeric(10,2) not null,    -- negativo per addebiti, positivo per ricariche
  saldo_post  numeric(10,2) not null,
  lead_id     uuid references leads(id),
  utente_id   uuid references auth.users(id)
);
```

> Nota: le tabelle `mandati` e `contratti` sono state rimosse dallo scope del
> progetto. Non vanno più create né referenziate in alcuna sezione.

### 5.6 Tabella `pacchetti_freddi`

```sql
create table pacchetti_freddi (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  nome            text not null,
  rdv_id          uuid references rdv(id),          -- null = aperto a tutte
  prezzo_per_lead numeric(8,2) not null,
  scadenza_at     timestamptz,
  stato           text check (stato in ('attivo','venduto','scaduto')) default 'attivo',
  note            text
);

create table pacchetti_freddi_leads (
  pacchetto_id uuid references pacchetti_freddi(id),
  lead_id      uuid references leads(id),
  primary key (pacchetto_id, lead_id)
);
```

### 5.7 Tabella `automazioni_lookup`

```sql
create table automazioni_lookup (
  id      uuid primary key default gen_random_uuid(),
  codice  text not null unique,    -- es. 'ELEFANTE'
  nome    text,
  note    text
);
```

### 5.8 Row Level Security

Abilita RLS su tutte le tabelle. Per il BackOffice (solo utenti autenticati con ruolo `backoffice`):

```sql
-- Esempio pattern per ogni tabella
alter table leads enable row level security;

create policy "backoffice_full_access" on leads
  for all
  using (auth.jwt() ->> 'role' = 'backoffice')
  with check (auth.jwt() ->> 'role' = 'backoffice');
```

Il ruolo viene impostato nel JWT custom claim tramite Supabase Edge Functions o Database Functions al momento del login.

---

## 6. Autenticazione

```jsx
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// src/hooks/useAuth.js
// - Login con email/password via supabase.auth.signInWithPassword()
// - Logout via supabase.auth.signOut()
// - AuthGuard: HOC che verifica session e redirige a /login se non autenticato
// - La sessione viene persistita automaticamente da Supabase
```

Pagina di login `/login`: form email + password, nessuna registrazione pubblica (gli account sono creati manualmente da Supabase Dashboard).

---

## 7. Convenzioni di codice

### Naming
- Componenti: PascalCase (`LeadDrawer.jsx`)
- Hook: camelCase con prefisso `use` (`useLeadFilters.js`)
- Costanti: UPPER_SNAKE_CASE (`STATI_LEAD`)
- File: corrispondono al componente esportato

### Componenti
- Funzionali con hooks, mai class components
- Props destructuring inline
- Default export per componenti pagina, named export per componenti condivisi

### Query Supabase
- Ogni hook `useXxx.js` in `features/xxx/hooks/` contiene le query della feature
- Usa sempre TanStack Query: `useQuery` per read, `useMutation` per write
- Query key convention: `['entità', filtri]` es. `['leads', { stato: 'DISPONIBILE' }]`
- Invalidazione dopo mutazione: `queryClient.invalidateQueries(['leads'])`

### Gestione errori
- Ogni query con `onError` che chiama `toast.error(message)`
- Form con Zod schema + React Hook Form `handleSubmit`
- Loading state con skeleton components (shadcn/ui `Skeleton`)

### Internazionalizzazione UI
- Tutta la UI in **italiano**
- Date in formato `DD/MM/YYYY HH:mm` tramite `date-fns/locale/it`
- Currency: `new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })`

---

## 8. Design system

### Palette colori (Tailwind custom in tailwind.config.js)

```js
colors: {
  brand: {
    50:  '#eef2ff',
    500: '#6366f1',   // indigo — colore primario
    600: '#4f46e5',
    900: '#1e1b4b',
  },
  slate: { /* Tailwind default */ }
}
```

### Componenti condivisi chiave

#### KpiCard
```jsx
// props: label, value, icon, delta, deltaPositive
// delta: stringa es. "+12% vs mese prec."
// deltaPositive: bool per colore verde/rosso
<KpiCard
  label="Lead prodotte"
  value="8.190"
  icon={<Zap className="h-4 w-4 text-violet-500" />}
  delta="+12% vs mese prec."
  deltaPositive={true}
/>
```

#### StatusBadge
```jsx
// Mappa stato → colore pill
const STATO_COLORS = {
  attiva: 'bg-green-100 text-green-700',
  sospesa: 'bg-amber-100 text-amber-700',
  in_prova: 'bg-blue-100 text-blue-700',
  archiviata: 'bg-slate-100 text-slate-600',
  CONSEGNATA: 'bg-green-100 text-green-700',
  ERRORE_CONSEGNA: 'bg-red-100 text-red-700',
  IN_RICICLO: 'bg-violet-100 text-violet-700',
  LISTA_FREDDA: 'bg-slate-100 text-slate-600',
  // ... tutti gli stati lead
}
```

#### ScoreBadge
```jsx
const FASCIA_COLORS = {
  PLATINUM: 'bg-violet-100 text-violet-700 border border-violet-300',
  GOLD:     'bg-amber-100  text-amber-700  border border-amber-300',
  SILVER:   'bg-slate-100  text-slate-600  border border-slate-300',
  RECYCLE:  'bg-red-50     text-red-600    border border-red-200',
}
```

#### DataTable (wrapper TanStack Table)
```jsx
// Supporta: paginazione, ordinamento colonne, filtro globale,
//           selezione multipla con checkbox, scroll orizzontale
// Props: columns, data, isLoading, onRowClick, enableSelection
```

#### ScreenHeader
```jsx
// H1 + sottotitolo opzionale + pulsante azione primaria opzionale
<ScreenHeader
  title="Tutte le lead"
  subtitle="31 colonne · aggiornamento real-time"
  action={<Button onClick={...}>Importa lista</Button>}
/>
```

---

## 9. Schermate — specifiche dettagliate

### 9.1 Dashboard (`/dashboard`)

**Struttura pagina:**
1. `KpiRow` — 5 card affiancate (su mobile: 2 colonne)
2. `AlertBanner` — banner colorati condizionali
3. Due grafici affiancati (50% + 50%)
4. Due colonne affiancate: fonti attive + activity feed

**KPI row — dati da Supabase:**
```js
// Lead prodotte 30gg
const { count: leadProdotte } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', thirtyDaysAgo)

// Lead distribuite 30gg
const { count: leadDistribuite } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', thirtyDaysAgo)
  .not('rdv_id', 'is', null)

// Budget attivo (somma wallet_budget_allocato RDV attive)
const { data: budgetData } = await supabase
  .from('rdv')
  .select('wallet_budget_allocato, wallet_saldo')
  .eq('stato', 'attiva')

// CPL globale = budget_distribuito / lead_distribuite
```

**Alert banner — condizioni:**
- RDV con `wallet_saldo < wallet_soglia_alert` → warning arancione con link a `/rdv/fatturazione`
- Lead con `parsing_ok = false` → warning rosso con link a `/lead/revisione`
- Errori consegna webhook nelle ultime 24h → warning rosso con link a `/lead/riciclo`

**Grafici (Recharts):**
- Volume 14gg: `LineChart` con due serie — `lead_ricevute` (blu) e `lead_distribuite` (verde). Dati: count per giorno da tabella `leads`.
- Distribuzione per fonte: `BarChart` orizzontale con percentuale per `fonte`. Dati: group by `fonte` su `leads` ultimi 30gg.

**Activity feed — ultimi 20 eventi:**
```js
// Query supabase con join leads + rdv
// Tipi evento: lead_consegnata, parsing_fallito, lead_riciclata, credito_esaurito, ricarica_wallet
// Recupera da tabella dedicata `activity_log` oppure costruisci da query composite
// Ogni riga cliccabile → naviga alla risorsa
```

---

### 9.2 Campagne (`/campagne`)

**Layout accordion a due livelli:**

```
KPI row globali (4 card)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ ENERGIA                    [5 sub-campagne | 3 attive]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ▶ Energia Lead Ads Simple    [LEADADS] [128 lead] [CPL €5.20]
  ▼ Energia Chatbot Standard   [CHATBOT] [312 lead] [CPL €4.80]
    ┌─────────────────────────────┐
    │  SubCampagnaDetail          │
    │  Sezione 1: KPI             │
    │  Sezione 2: Webhook config  │
    │  Sezione 3: Sorgenti        │
    └─────────────────────────────┘
  ▶ Energia Landing Pro         [LANDING] [⚠ nessuna lead 8h]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ TELEFONIA                  [3 sub-campagne | 3 attive]
```

**Animazione espansione:** `transition-all duration-200 ease-out` con `opacity-0 → opacity-100` e `translateY(-4px) → translateY(0)`.

**Alert anomalia:** se `(now() - ultimo_lead_ricevuta) > soglia_alert_ore` → icona `AlertTriangle` ambra sulla riga con tooltip timestamp.

**Form nuova sub-campagna:** Dialog (shadcn/ui) con campi: nome, formato (Select), punteggio_base (Slider 1-100), soglia_alert_ore (Input number), stato (Switch).

---

### 9.3 RDV — Lista (`/rdv/tutte`)

**Tabella con colonne:**
ragione_sociale | tier (badge) | stato (pill) | piva | referente_nome | verticali (chip) | created_at | azioni

**Filtri:** Select per tier, stato, verticale. Input ricerca testo (ragione_sociale, piva).

**Click su riga:** navigate a `/rdv/:id`

**Toggle sospendi:** `AlertDialog` di conferma con messaggio dinamico sul numero di lead in coda.

---

### 9.4 RDV — Scheda (`/rdv/:id`)

**Header:**
- Avatar cerchio con iniziali (2 lettere da ragione_sociale)
- Ragione sociale + Tier badge + Stato pill
- Meta: P.IVA | data iscrizione | referente | commerciale
- Pulsanti: Modifica | Sospendi/Riattiva | Archivia (visibile solo se 0 lead consegnate)

**KPI row sopra i tab (sempre visibili):**
- Lead questo mese
- Budget residuo (con progress bar colorata: verde >50%, amber 20-50%, rosso <20%)
- Score medio
- Tasso conversione

**6 Tab (shadcn/ui Tabs):**

`TabAnagrafica`: form con tutti i campi identificativi. Editing inline con pulsante Salva.

`TabConfigurazione`: tre blocchi
  1. Parametri base: verticali toggle, limiti, algoritmo, fonti chip
  2. SubCampagneConfig: sezioni per verticale abilitato con toggle per ogni sub-campagna
  3. CrmWebhookConfig: toggle master, URL, tipo auth, field mapping, payload preview

`TabLeadRicevute`: ultime 50 lead (pre-filtrate su rdv_id). Colonne: id, created_at, nome, telefono, fascia, stato, rdv_secondaria_id. Click riga → drawer dettaglio. Link "Vedi tutte" → `/lead/tutte?rdv_id=:id`

`TabWallet`: alert credito + KPI + tabella movimenti + pulsanti azione

`TabPerformance`: KPI 30gg + distribuzione fasce + LineChart andamento

`TabUtenti`: tabella sub-account (read-only per operatori, sospendi per super admin)

---

### 9.5 Lead — Tutte le lead (`/lead/tutte`)

**Tabella con 31 colonne** (scroll orizzontale, whitespace-nowrap):

Gruppo | Colonne
---|---
Anagrafica e sistema | id (mono, copy), created_at, nome, cognome, telefono (mascherato \*\*\*1234), email, cap
Consenso GDPR | consent_given (icona bool), consent_date, consent_proof (troncato + tooltip)
Campaign name raw | campaign_name_raw (troncato + tooltip), campaign_id (mono), campaign_child_id (mono)
Campi parsati | settore (badge colore), cliente, campagna_cliente, offerta, creativita (troncata), formato (pill), fonte (pill), versione, automazione (mono)
Status e scoring | sub_campagna_id (mono), parsing_ok (badge verde/rosso), score, fascia (pill), stato (pill)
Distribuzione | rdv_id (mono), rdv_secondaria_id (mono), consegnata_at, riciclo_count (badge)

**Filtri base:** Stato, Fonte, Fascia, Verticale (settore), Sub-campagna, RDV, Parsing OK.

**Filtri avanzati (accordion):** Settore (pos.2), Cliente (pos.3), Campagna Cliente (pos.4), Formato (pos.7), Automazione (pos.10). Tutti Select popolati dinamicamente.

**Selezione multipla:** checkbox colonna sinistra → barra azioni sticky in basso: "Invia/Ricicla", "Esporta", "Blocca".

**Click su riga:** apre `LeadDrawer` laterale.

**LeadDrawer — sezioni:**
1. Anagrafica (nome, telefono intero, email, CAP, data ricezione)
2. Campaign name raw (blocco monospaciato + banner parsing OK/FAIL)
3. Grid campi parsati (10 campi con badge)
4. Score (valore + fascia + breakdown barre per dimensione)
5. Distribuzione (RDV primaria, secondaria, riciclo_count, consegnata_at)
6. Consenso GDPR (tutti i campi)
7. Azioni: "Forza riassegnazione" | "Blocca" | "Riciclo manuale"

---

### 9.6 Lead — In attesa di revisione (`/lead/revisione`)

Counter badge dinamico in sidebar (aggiornato via Realtime su `parsing_ok = false`).

**Tabella:** id | created_at | campaign_name_raw (mono) | motivo_flag | azioni

**Azione Correggi:** Dialog con form 10 campi CAMPAIGN_FIELDS precompilati. Al salvataggio:
```js
await supabase.from('leads').update({
  parsing_ok: true,
  settore, cliente, campagna_cliente, offerta,
  creativita, formato, fonte, versione, automazione,
  // ricalcola score
}).eq('id', leadId)
```

**Azione Scarta:** AlertDialog con campo motivazione obbligatorio → stato `BLOCCATA`.

---

### 9.7 Lead — Liste fredde (`/lead/liste-fredde`)

**KPI in cima:** Lead disponibili | Valore potenziale | Pacchetti venduti mese | Ricavo generato

**Tab "Pool disponibile":** tabella lead con `lista_fredda = true` e stato `DISPONIBILE`. Selezione multipla → pulsante "Crea pacchetto".

**Dialog Crea pacchetto:** nome, RDV destinataria (Select, opzione "Tutte"), prezzo_per_lead, scadenza_at, note.

**Tab "Pacchetti attivi":** tabella `pacchetti_freddi` con stato, n lead, prezzo, scadenza, azioni.

**Tab "Storico vendite":** movimenti da `wallet_movimenti` tipo `lead_ricevuta` + `pacchetti_freddi`.

---

### 9.8 Statistiche — Report GDPR (`/statistiche/gdpr`)

**KPI:** consensi validi | in scadenza 30gg | scaduti | richieste accesso aperte

**Tabella scadenze:** lead con `consent_expires_at` entro 30 giorni.

**Form revoca:** input telefono/email → query lead del contatto → pulsante "Esegui revoca totale" → `AlertDialog` → aggiorna `consent_revoked_at = now()` e `stato = 'BLOCCATA'` su tutte le lead trovate.

**Export soggetto interessato:** input telefono → genera e scarica PDF con tutti i dati (usa `window.print()` su una pagina dedicata oppure libreria `jspdf`).

**Audit trail:** tabella paginata con tutti i `gdpr_audit_log` flattened, filtri per tipo azione e periodo.

---

## 10. Logica di business critica

### 10.1 Parsing campaign_name

```js
// src/lib/parseCampaignName.js
export function parseCampaignName(raw) {
  if (!raw) return { parsing_ok: false, fields: {} }

  const parts = raw.split(' | ').map(p => p.trim())

  if (parts.length < 4) return { parsing_ok: false, fields: {} }

  const [idFull, settore, cliente, campagna_cliente, offerta, creativita, formato, fonte, versione, automazione] = parts

  const [campaign_id, campaign_child_id] = (idFull || '').split('.')

  const clean = v => (!v || v === '-' || v === '') ? null : v

  return {
    parsing_ok: !!(settore && cliente && campagna_cliente && formato && fonte),
    fields: {
      campaign_id: clean(campaign_id),
      campaign_child_id: clean(campaign_child_id),
      settore: clean(settore),
      cliente: clean(cliente),
      campagna_cliente: clean(campagna_cliente),
      offerta: clean(offerta),
      creativita: clean(creativita),
      formato: clean(formato),
      fonte: clean(fonte),
      versione: clean(versione),
      automazione: clean(automazione),
    }
  }
}
```

### 10.2 Calcolo score

```js
// src/lib/scoring.js
export function calcolaScore(lead, subCampagna, verticale) {
  const pesi = {
    fonte:    verticale?.peso_fonte    ?? 40,
    campagna: verticale?.peso_campagna ?? 30,
    geo:      verticale?.peso_geo      ?? 20,
    consenso: verticale?.peso_consenso ?? 10,
  }

  // Dimensione 1 — Qualità fonte
  const SCORE_FORMATO = { CHATBOT: 90, LANDING: 70, LEADADS: 50, IVR: 60, ALTRO: 40 }
  const SCORE_CANALE  = { GOOGLE: 90, META: 75, TIKTOK: 65, AFFILIATO: 55, ROBOCALL: 45, IMPORT: 30 }
  const scoreFonte = subCampagna
    ? subCampagna.punteggio_base
    : ((SCORE_FORMATO[lead.formato] ?? 50) + (SCORE_CANALE[lead.fonte] ?? 50)) / 2

  // Dimensione 2 — Qualità campagna (storico, aggiornato periodicamente)
  const scoreCampagna = subCampagna?.score_storico ?? 50

  // Dimensione 3 — Qualità geografica (tabella cap_coefficienti o default 50)
  const scoreGeo = 50  // placeholder, da implementare con tabella lookup

  // Dimensione 4 — Qualità consenso
  const SCORE_CONSENSO_SOURCE = { TRUSTEDFORM: 90, FORM_NATIVO: 70, CHATBOT: 65, IMPORT: 30 }
  const scoreConsenso = SCORE_CONSENSO_SOURCE[lead.consent_source] ?? 50

  const scoreBase =
    (scoreFonte    * pesi.fonte    / 100) +
    (scoreCampagna * pesi.campagna / 100) +
    (scoreGeo      * pesi.geo      / 100) +
    (scoreConsenso * pesi.consenso / 100)

  // Penalità
  let penalita = 0
  if (lead.riciclo_count > 0)     penalita += lead.riciclo_count * 10
  // Telefono VoIP, CAP non valido, ecc.: aggiungere validazioni
  
  const score = Math.max(0, Math.min(100, Math.round(scoreBase - penalita)))

  const soglie = {
    platinum: verticale?.soglia_platinum ?? 80,
    gold:     verticale?.soglia_gold     ?? 60,
    silver:   verticale?.soglia_silver   ?? 40,
  }

  const fascia =
    score >= soglie.platinum ? 'PLATINUM' :
    score >= soglie.gold     ? 'GOLD'     :
    score >= soglie.silver   ? 'SILVER'   : 'RECYCLE'

  return {
    score,
    fascia,
    breakdown: { fonte: scoreFonte, campagna: scoreCampagna, geo: scoreGeo, consenso: scoreConsenso }
  }
}
```

### 10.3 Deduplicazione

```js
// Controlla duplicati su finestra mobile 30 giorni tramite hash telefono
// In Supabase: query con .eq('telefono', normalizedPhone) + .gte('created_at', thirtyDaysAgo)
// Se trovato → aggiungi penalità -20 al score, non bloccare
```

### 10.4 Wallet scalare al momento della consegna

```js
// Supabase Database Function (RPC) per atomicità:
// 1. Verifica rdv.wallet_saldo >= prezzo_fascia
// 2. Aggiorna rdv.wallet_saldo -= prezzo_fascia
// 3. Inserisce riga in wallet_movimenti (tipo: 'lead_ricevuta', importo: -prezzo)
// 4. Aggiorna lead.stato = 'CONSEGNATA', lead.consegnata_at = now()
// Chiamata: await supabase.rpc('consegna_lead', { lead_id, rdv_id })
```

---

## 11. Realtime (Supabase)

Sottoscrizioni da attivare al mount dell'AppShell:

```js
// src/hooks/useRealtime.js
export function useRealtime() {
  useEffect(() => {
    // 1. Badge revisione (parsing_ok = false count)
    const revisioneChannel = supabase
      .channel('revisione-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: 'parsing_ok=eq.false'
      }, () => {
        queryClient.invalidateQueries(['leads', 'revisione-count'])
      })
      .subscribe()

    // 2. Alert credito esaurito
    const walletChannel = supabase
      .channel('wallet-alerts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rdv'
      }, (payload) => {
        if (payload.new.wallet_saldo < payload.new.wallet_soglia_alert) {
          toast.warning(`RDV ${payload.new.ragione_sociale}: credito in esaurimento`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(revisioneChannel)
      supabase.removeChannel(walletChannel)
    }
  }, [])
}
```

---

## 12. Webhook ingestion endpoint

Il sistema riceve lead da piattaforme esterne (Meta, Google, TikTok) tramite webhook.
Implementa come **Supabase Edge Function**:

```typescript
// supabase/functions/ingest-lead/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Verifica HMAC-SHA256 se secret configurato per la sub-campagna
  // 2. Leggi payload JSON
  // 3. Normalizza: telefono E.164, uppercase nome/cognome
  // 4. Controlla duplicati (finestra 30gg su telefono)
  // 5. Parsa campaign_name con parseCampaignName()
  // 6. Trova sub_campagna corrispondente (verticale + formato)
  // 7. Calcola score con calcolaScore()
  // 8. Determina consent_expires_at in base a verticale
  // 9. Salva in tabella leads con stato = 'DISPONIBILE' (o 'RICEVUTA' se parsing fallito)
  // 10. Risponde 200 OK
})
```

URL pattern: `https://<project>.supabase.co/functions/v1/ingest-lead/<sub_campagna_id>`

---

## 13. MVP — ordine di sviluppo consigliato

Segui questo ordine per avere sempre qualcosa di funzionante:

1. **Setup progetto** — Vite + React + Tailwind + shadcn/ui + Supabase client
2. **Schema DB** — crea tutte le tabelle in Supabase (sezione 5)
3. **Auth** — login page + AuthGuard + session persistence
4. **AppShell** — Topbar + Sidebar navigazione + routing base
5. **Dashboard** — KPI row con dati mock → poi collegare Supabase
6. **Lead > Tutte le lead** — tabella 31 colonne + filtri + drawer (cuore del sistema)
7. **Lead > In attesa di revisione** — badge realtime + modal correggi/scarta
8. **Campagne** — accordion verticali + SubCampagnaDetail
9. **RDV > Lista** — tabella + filtri
10. **RDV > Scheda** — header + 7 tab
11. **Lead > In riciclo** — contatori live
12. **Lead > Liste fredde** — pool + crea pacchetto
13. **Statistiche** — fonti + RDV + GDPR
14. **Webhook ingestion** — Edge Function Supabase
15. **Polish** — realtime alerts, toast notifications, empty states, loading skeletons

---

## 14. Note finali per Claude Code

- **Non inventare** logiche non documentate qui. Se qualcosa non è specificato, chiedi prima di implementare.
- **Dati mock** per lo sviluppo UI: crea un file `src/lib/mockData.js` con dati realistici per ogni entità. Collega Supabase solo dopo che la UI funziona con i mock.
- **Nessuna traduzione** — l'intera UI è in italiano. Nessun file i18n necessario.
- **Responsive** — il BackOffice è desktop-first (min-width 1280px). Mobile non è priorità per questa fase.
- **Accessibilità** — usa le prop `aria-label` sui pulsanti icon-only, focus ring visibili.
- **Performance** — abilita paginazione su tutte le tabelle (default 50 righe). Usa `React.memo` e `useMemo` solo dove misuri un problema reale.
- **Errori Supabase** — ogni errore di query deve mostrare un `toast.error()` con messaggio leggibile in italiano.
