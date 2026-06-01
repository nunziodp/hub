import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'

import { formatDate, maskPhone } from '@/lib/utils'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Button } from '@/components/ui/button'
import { LeadDrawer } from '@/features/lead/components/LeadDrawer'
import { getLeadEnriched } from '@/features/lead/hooks/useLead'
import { useRdvLeads } from '../../hooks/useRdvDetail'

// Tab Lead ricevute (sezione 9.4): ultime 50 lead della RDV + drawer + link.
export function TabLeadRicevute({ rdv }) {
  const { data: leads = [], isLoading } = useRdvLeads(rdv.id, 50)
  const [leadAperta, setLeadAperta] = useState(null)

  const columns = [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'created_at', header: 'Ricezione', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'nome', header: 'Nome', cell: ({ row }) => [row.original.nome, row.original.cognome].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
    { accessorKey: 'fascia', header: 'Fascia', cell: ({ getValue }) => <ScoreBadge fascia={getValue()} /> },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    {
      accessorKey: 'rdv_secondaria_id',
      header: 'RDV secondaria',
      cell: ({ getValue }) => (getValue() ? <span className="font-mono text-xs">{getValue()}</span> : <span className="text-muted-foreground">—</span>),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to={`/lead/tutte?rdv_id=${rdv.id}`}>
            <ExternalLink className="h-4 w-4" />
            Vedi tutte
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={leads}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={async (l) => setLeadAperta(await getLeadEnriched(l.id))}
      />

      <LeadDrawer lead={leadAperta} onClose={() => setLeadAperta(null)} />
    </div>
  )
}
