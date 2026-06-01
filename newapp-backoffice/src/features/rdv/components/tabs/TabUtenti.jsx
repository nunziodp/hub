import { toast } from 'sonner'
import { Pause } from 'lucide-react'

import { formatDate } from '@/lib/utils'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRdvUtenti } from '../../hooks/useRdvDetail'

// Tab Utenti (sezione 9.4): tabella sub-account. Read-only per gli operatori,
// con azione "sospendi" prevista per il super admin (qui mock toast).
export function TabUtenti({ rdv }) {
  const { data: utenti = [], isLoading } = useRdvUtenti(rdv.id)

  if (isLoading) return <Skeleton className="h-48 w-full" />

  const columns = [
    { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => <span className="text-sm">{getValue()}</span> },
    {
      accessorKey: 'ruolo',
      header: 'Ruolo',
      cell: ({ getValue }) => (
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
          {getValue()}
        </span>
      ),
    },
    { accessorKey: 'ultimo_accesso', header: 'Ultimo accesso', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    {
      id: 'azioni',
      header: 'Azioni',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.stato === 'attivo' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info('Sospensione utente riservata al super admin (disponibile con Supabase).')}
          >
            <Pause className="h-3.5 w-3.5" />
            Sospendi
          </Button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return <DataTable columns={columns} data={utenti} getRowId={(r) => r.id} />
}
