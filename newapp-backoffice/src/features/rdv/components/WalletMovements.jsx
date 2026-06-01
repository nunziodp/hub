import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { DataTable } from '@/components/shared/DataTable'

// Etichette tipo movimento
const TIPO_LABEL = {
  lead_ricevuta: 'Lead ricevuta',
  ricarica: 'Ricarica',
  rettifica: 'Rettifica',
}

// Tabella movimenti wallet (sezione 9.4, tab Wallet).
export function WalletMovements({ movimenti, isLoading }) {
  const columns = [
    { accessorKey: 'created_at', header: 'Data', cell: ({ getValue }) => formatDate(getValue()) },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ getValue }) => (
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {TIPO_LABEL[getValue()] ?? getValue()}
        </span>
      ),
    },
    { accessorKey: 'descrizione', header: 'Descrizione', cell: ({ getValue }) => getValue() || '—' },
    {
      accessorKey: 'importo',
      header: 'Importo',
      cell: ({ getValue }) => (
        <span className={cn('font-semibold tabular-nums', getValue() < 0 ? 'text-red-600' : 'text-emerald-600')}>
          {getValue() > 0 ? '+' : ''}
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'saldo_post',
      header: 'Saldo dopo',
      cell: ({ getValue }) => <span className="tabular-nums">{formatCurrency(getValue())}</span>,
    },
  ]

  return <DataTable columns={columns} data={movimenti} isLoading={isLoading} getRowId={(r) => r.id} />
}
