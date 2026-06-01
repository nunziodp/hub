import { formatDate, maskPhone } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import {
  MonoCell,
  TruncCell,
  TextCell,
  Pill,
  BoolIcon,
  ParsingBadge,
  RicicloBadge,
} from './leadCells'

// Mappa colore per il settore (verticale)
const SETTORE_COLORS = {
  ENERGIA: 'bg-amber-100 text-amber-700',
  TELEFONIA: 'bg-sky-100 text-sky-700',
  FOTOVOLTAICO: 'bg-yellow-100 text-yellow-700',
  DEPURATORI: 'bg-cyan-100 text-cyan-700',
  HOME_IMPROVEMENT: 'bg-lime-100 text-lime-700',
}

// Definizioni delle 31 colonne (sezione 9.5), raggruppate per area logica.
// La tabella scrolla orizzontalmente con whitespace-nowrap (gestito da DataTable).
export const LEAD_COLUMNS = [
  // ── Anagrafica e sistema (7) ──
  { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <MonoCell value={getValue()} copyable /> },
  { accessorKey: 'created_at', header: 'Ricezione', cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'cognome', header: 'Cognome', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
  { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => <TruncCell value={getValue()} width="max-w-[180px]" /> },
  { accessorKey: 'cap', header: 'CAP', cell: ({ getValue }) => <TextCell value={getValue()} /> },

  // ── Consenso GDPR (3) ──
  { accessorKey: 'consent_given', header: 'Consenso', cell: ({ getValue }) => <BoolIcon value={getValue()} />, enableSorting: false },
  { accessorKey: 'consent_date', header: 'Data consenso', cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: 'consent_proof', header: 'Prova consenso', cell: ({ getValue }) => <TruncCell value={getValue()} width="max-w-[160px]" mono /> },

  // ── Campaign name raw (3) ──
  { accessorKey: 'campaign_name_raw', header: 'Campaign name', cell: ({ getValue }) => <TruncCell value={getValue()} width="max-w-[220px]" mono /> },
  { accessorKey: 'campaign_id', header: 'Campaign ID', cell: ({ getValue }) => <MonoCell value={getValue()} /> },
  { accessorKey: 'campaign_child_id', header: 'Child ID', cell: ({ getValue }) => <MonoCell value={getValue()} /> },

  // ── Campi parsati (9) ──
  { accessorKey: 'settore', header: 'Settore', cell: ({ getValue }) => <Pill value={getValue()} colorClass={SETTORE_COLORS[getValue()] ?? 'bg-slate-100 text-slate-600'} /> },
  { accessorKey: 'cliente', header: 'Cliente', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'campagna_cliente', header: 'Campagna cliente', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'offerta', header: 'Offerta', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'creativita', header: 'Creatività', cell: ({ getValue }) => <TruncCell value={getValue()} width="max-w-[140px]" /> },
  { accessorKey: 'formato', header: 'Formato', cell: ({ getValue }) => <Pill value={getValue()} colorClass="bg-indigo-100 text-indigo-700" /> },
  { accessorKey: 'fonte', header: 'Fonte', cell: ({ getValue }) => <Pill value={getValue()} colorClass="bg-purple-100 text-purple-700" /> },
  { accessorKey: 'versione', header: 'Versione', cell: ({ getValue }) => <TextCell value={getValue()} /> },
  { accessorKey: 'automazione', header: 'Automazione', cell: ({ getValue }) => <MonoCell value={getValue()} /> },

  // ── Status e scoring (5) ──
  { accessorKey: 'sub_campagna_id', header: 'Sub-campagna', cell: ({ row }) => <TruncCell value={row.original._subCampagnaNome ?? row.original.sub_campagna_id} width="max-w-[160px]" /> },
  { accessorKey: 'parsing_ok', header: 'Parsing', cell: ({ getValue }) => <ParsingBadge ok={getValue()} />, enableSorting: false },
  { accessorKey: 'score', header: 'Score', cell: ({ getValue }) => (getValue() == null ? <span className="text-muted-foreground">—</span> : <span className="font-semibold tabular-nums">{getValue()}</span>) },
  { accessorKey: 'fascia', header: 'Fascia', cell: ({ getValue }) => <ScoreBadge fascia={getValue()} /> },
  { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },

  // ── Distribuzione (4) ──
  { accessorKey: 'rdv_id', header: 'RDV', cell: ({ row }) => <TruncCell value={row.original._rdvNome ?? row.original.rdv_id} width="max-w-[160px]" /> },
  { accessorKey: 'rdv_secondaria_id', header: 'RDV secondaria', cell: ({ row }) => <TruncCell value={row.original._rdvSecondariaNome ?? row.original.rdv_secondaria_id} width="max-w-[160px]" /> },
  { accessorKey: 'consegnata_at', header: 'Consegnata', cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: 'riciclo_count', header: 'Ricicli', cell: ({ getValue }) => <RicicloBadge n={getValue()} /> },
]
