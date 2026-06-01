import { useEffect } from 'react'
import {
  X, User, FileText, Tag, Gauge, Send, ShieldCheck,
  Ban, RefreshCw, Share2, Check, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatDate, formatDateOnly } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { parseCampaignName } from '@/lib/parseCampaignName'

// Drawer laterale di dettaglio lead (sezione 9.5).
// 7 sezioni: anagrafica, campaign raw, campi parsati, score, distribuzione,
// consenso GDPR, azioni. Slide-over custom (overlay + pannello, niente Radix).
// Props: lead (arricchita) | null, onClose()
export function LeadDrawer({ lead, onClose }) {
  const aperto = !!lead

  // Chiusura con tasto Esc
  useEffect(() => {
    if (!aperto) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aperto, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
          aperto ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      {/* Pannello */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl transition-transform duration-200 ease-out',
          aperto ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Dettaglio lead"
      >
        {lead && <DrawerContent lead={lead} onClose={onClose} />}
      </aside>
    </>
  )
}

function DrawerContent({ lead, onClose }) {
  const parsed = parseCampaignName(lead.campaign_name_raw)

  // Azioni mock (fase UI): mostrano un toast in attesa del collegamento Supabase
  const azioneNonDisponibile = (etichetta) =>
    toast.info(`"${etichetta}" sarà disponibile dopo il collegamento a Supabase.`)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {[lead.nome, lead.cognome].filter(Boolean).join(' ') || 'Lead senza nome'}
            </h2>
            <ScoreBadge fascia={lead.fascia} score={lead.score} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{lead.id}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Chiudi">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Corpo scrollabile */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* 1. Anagrafica */}
        <Section icon={User} titolo="Anagrafica">
          <Campo label="Nome" value={[lead.nome, lead.cognome].filter(Boolean).join(' ')} />
          <Campo label="Telefono" value={lead.telefono} mono />
          <Campo label="Email" value={lead.email} />
          <Campo label="CAP" value={lead.cap} />
          <Campo label="Data ricezione" value={formatDate(lead.created_at)} />
          <Campo label="Stato" value={<StatusBadge stato={lead.stato} />} />
        </Section>

        {/* 2. Campaign name raw + banner parsing */}
        <Section icon={FileText} titolo="Campaign name (raw)">
          <div className="break-all rounded-md bg-muted p-3 font-mono text-xs text-foreground">
            {lead.campaign_name_raw || '—'}
          </div>
          <ParsingBanner ok={parsed.parsing_ok && lead.parsing_ok} />
        </Section>

        {/* 3. Campi parsati */}
        <Section icon={Tag} titolo="Campi parsati">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Campo label="Settore" value={lead.settore} />
            <Campo label="Cliente" value={lead.cliente} />
            <Campo label="Campagna cliente" value={lead.campagna_cliente} />
            <Campo label="Offerta" value={lead.offerta} />
            <Campo label="Creatività" value={lead.creativita} />
            <Campo label="Formato" value={lead.formato} />
            <Campo label="Fonte" value={lead.fonte} />
            <Campo label="Versione" value={lead.versione} />
            <Campo label="Automazione" value={lead.automazione} mono />
            <Campo label="Sub-campagna" value={lead._subCampagnaNome} />
          </div>
        </Section>

        {/* 4. Score + breakdown */}
        <Section icon={Gauge} titolo="Score">
          {lead.score == null ? (
            <p className="text-sm text-muted-foreground">
              Score non calcolato (parsing fallito).
            </p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl font-bold tabular-nums">{lead.score}</span>
                <ScoreBadge fascia={lead.fascia} />
              </div>
              {lead.score_breakdown && (
                <div className="space-y-2">
                  <BreakdownBar label="Fonte" value={lead.score_breakdown.fonte} />
                  <BreakdownBar label="Campagna" value={lead.score_breakdown.campagna} />
                  <BreakdownBar label="Geografica" value={lead.score_breakdown.geo} />
                  <BreakdownBar label="Consenso" value={lead.score_breakdown.consenso} />
                </div>
              )}
            </>
          )}
        </Section>

        {/* 5. Distribuzione */}
        <Section icon={Send} titolo="Distribuzione">
          <Campo label="RDV primaria" value={lead._rdvNome} />
          <Campo label="RDV secondaria" value={lead._rdvSecondariaNome} />
          <Campo label="Consegnata il" value={formatDate(lead.consegnata_at)} />
          <Campo label="Numero ricicli" value={String(lead.riciclo_count ?? 0)} />
          <Campo label="Lista fredda" value={lead.lista_fredda ? 'Sì' : 'No'} />
        </Section>

        {/* 6. Consenso GDPR */}
        <Section icon={ShieldCheck} titolo="Consenso GDPR">
          <Campo label="Consenso prestato" value={lead.consent_given ? 'Sì' : 'No'} />
          <Campo label="Data consenso" value={formatDate(lead.consent_date)} />
          <Campo label="Fonte consenso" value={lead.consent_source} />
          <Campo label="Versione" value={lead.consent_version} />
          <Campo label="Ambito" value={(lead.consent_scope ?? []).join(', ') || null} />
          <Campo label="Prova" value={lead.consent_proof} mono />
          <Campo label="Scadenza" value={formatDateOnly(lead.consent_expires_at)} />
          <Campo
            label="Revoca"
            value={lead.consent_revoked_at ? formatDate(lead.consent_revoked_at) : 'Non revocato'}
          />
        </Section>
      </div>

      {/* 7. Azioni (footer fisso) */}
      <div className="grid grid-cols-3 gap-2 border-t border-border p-4">
        <Button variant="outline" size="sm" onClick={() => azioneNonDisponibile('Forza riassegnazione')}>
          <Share2 className="h-4 w-4" />
          Riassegna
        </Button>
        <Button variant="outline" size="sm" onClick={() => azioneNonDisponibile('Riciclo manuale')}>
          <RefreshCw className="h-4 w-4" />
          Ricicla
        </Button>
        <Button variant="destructive" size="sm" onClick={() => azioneNonDisponibile('Blocca')}>
          <Ban className="h-4 w-4" />
          Blocca
        </Button>
      </div>
    </>
  )
}

// ---------- Sotto-componenti ----------

function Section({ icon: Icon, titolo, children }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-brand-600" />
        {titolo}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  )
}

function Campo({ label, value }) {
  const vuoto = value == null || value === ''
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-right', vuoto && 'text-muted-foreground')}>
        {vuoto ? '—' : value}
      </span>
    </div>
  )
}

function ParsingBanner({ ok }) {
  return (
    <div
      className={cn(
        'mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      )}
    >
      {ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {ok ? 'Parsing riuscito — campi essenziali presenti' : 'Parsing fallito — richiede revisione manuale'}
    </div>
  )
}

function BreakdownBar({ label, value }) {
  const v = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value ?? '—'}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}
