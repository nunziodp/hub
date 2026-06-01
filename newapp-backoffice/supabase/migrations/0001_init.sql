-- NewApp BackOffice — schema iniziale (sezione 5 della spec).
-- Ordine di creazione conforme alle foreign key.
-- Le tabelle mandati/contratti sono escluse (rimosse dallo scope).

-- ============ 5.2 verticali ============
create table verticali (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null unique,
  attivo boolean default true,
  peso_fonte        int default 40,
  peso_campagna     int default 30,
  peso_geo          int default 20,
  peso_consenso     int default 10,
  soglia_platinum   int default 80,
  soglia_gold       int default 60,
  soglia_silver     int default 40,
  consenso_scadenza_giorni int default 365
);

insert into verticali (nome) values ('ENERGIA'), ('TELEFONIA');

-- ============ 5.1 rdv ============
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
  verticali             text[] default '{}',
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
  crm_webhook           jsonb,
  wallet_saldo          numeric(10,2) default 0,
  wallet_budget_allocato numeric(10,2) default 0,
  wallet_soglia_alert   numeric(10,2) default 200,
  note_interne          text
);

-- ============ 5.3 sub_campagne ============
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
  lead_30gg       int default 0,
  score_medio     numeric(5,2) default 0,
  tasso_contatto  numeric(5,2) default 0,
  spend_30gg      numeric(10,2) default 0,
  campagne_collegate jsonb default '[]'
);

-- ============ 5.4 leads ============
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  nome                text,
  cognome             text,
  telefono            text,
  email               text,
  cap                 text,
  consent_given       boolean default false,
  consent_date        timestamptz,
  consent_proof       text,
  consent_source      text check (consent_source in ('FORM_NATIVO','TRUSTEDFORM','IMPORT','CHATBOT')),
  consent_version     text,
  consent_scope       text[] default '{}',
  consent_expires_at  timestamptz,
  consent_revoked_at  timestamptz,
  gdpr_audit_log      jsonb default '[]',
  campaign_name_raw   text,
  campaign_id         text,
  campaign_child_id   text,
  settore             text,
  cliente             text,
  campagna_cliente    text,
  offerta             text,
  creativita          text,
  formato             text,
  fonte               text,
  versione            text,
  automazione         text,
  sub_campagna_id     uuid references sub_campagne(id),
  parsing_ok          boolean default true,
  score               int,
  score_breakdown     jsonb,
  fascia              text check (fascia in ('PLATINUM','GOLD','SILVER','RECYCLE')),
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

create index leads_stato_idx on leads(stato);
create index leads_rdv_id_idx on leads(rdv_id);
create index leads_created_at_idx on leads(created_at desc);
create index leads_parsing_ok_idx on leads(parsing_ok) where parsing_ok = false;
create index leads_telefono_hash_idx on leads using hash(telefono);

-- ============ 5.5 wallet_movimenti ============
create table wallet_movimenti (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  rdv_id      uuid references rdv(id) not null,
  tipo        text check (tipo in ('lead_ricevuta','ricarica','rettifica')) not null,
  descrizione text,
  importo     numeric(10,2) not null,
  saldo_post  numeric(10,2) not null,
  lead_id     uuid references leads(id),
  utente_id   uuid references auth.users(id)
);

-- ============ 5.6 pacchetti_freddi ============
create table pacchetti_freddi (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  nome            text not null,
  rdv_id          uuid references rdv(id),
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

-- ============ 5.7 automazioni_lookup ============
create table automazioni_lookup (
  id      uuid primary key default gen_random_uuid(),
  codice  text not null unique,
  nome    text,
  note    text
);

-- ============ 5.8 Row Level Security ============
-- Accesso completo per gli utenti BackOffice (custom claim role = 'backoffice')
do $$
declare t text;
begin
  foreach t in array array[
    'verticali','rdv','sub_campagne','leads','wallet_movimenti',
    'pacchetti_freddi','pacchetti_freddi_leads','automazioni_lookup'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "backoffice_full_access" on %I
        for all
        using (auth.jwt() ->> 'role' = 'backoffice')
        with check (auth.jwt() ->> 'role' = 'backoffice');
    $f$, t);
  end loop;
end $$;
