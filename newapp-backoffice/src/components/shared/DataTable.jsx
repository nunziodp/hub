import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

// Wrapper riusabile su TanStack Table v8 (sezione 8 della spec).
// Supporta: paginazione (default 50), ordinamento colonne, selezione multipla
// con checkbox, scroll orizzontale, click su riga, stato di caricamento.
//
// Props:
// - columns: definizioni colonna TanStack
// - data: array di righe
// - isLoading: bool → mostra skeleton
// - onRowClick: (rowOriginal) => void
// - enableSelection: bool → aggiunge colonna checkbox a sinistra
// - rowSelection / onRowSelectionChange: stato selezione controllato (opzionale)
// - getRowId: (row) => string (necessario per selezione stabile)
// - pageSize: righe per pagina (default 50)
export function DataTable({
  columns,
  data,
  isLoading = false,
  onRowClick,
  enableSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  pageSize = 50,
}) {
  const [sorting, setSorting] = useState([])
  const [internalSelection, setInternalSelection] = useState({})

  // Selezione: usa lo stato controllato dal parent se fornito, altrimenti interno
  const selection = rowSelection ?? internalSelection
  const setSelection = onRowSelectionChange ?? setInternalSelection

  // Colonna checkbox iniettata quando enableSelection è attivo
  const selectionColumn = {
    id: '__select',
    size: 40,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleziona tutte le righe"
      />
    ),
    cell: ({ row }) => (
      // stopPropagation evita di aprire il drawer cliccando la checkbox
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleziona riga"
        />
      </div>
    ),
  }

  const finalColumns = enableSelection ? [selectionColumn, ...columns] : columns

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { sorting, rowSelection: selection },
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: setSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  const totaleRighe = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize: ps } = table.getState().pagination
  const da = totaleRighe === 0 ? 0 : pageIndex * ps + 1
  const a = Math.min((pageIndex + 1) * ps, totaleRighe)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b border-border bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2.5 text-left align-middle text-xs font-semibold text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={finalColumns.length}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  Nessun risultato con i filtri selezionati.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'border-b border-border/60 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                    row.getIsSelected() && 'bg-brand-50',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-3 py-2 align-middle text-foreground"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer paginazione */}
      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        <span>
          {totaleRighe > 0
            ? `${formatNumber(da)}–${formatNumber(a)} di ${formatNumber(totaleRighe)}`
            : '0 risultati'}
        </span>
        <div className="flex items-center gap-2">
          <span>
            Pagina {pageIndex + 1} di {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Pagina precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Pagina successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
