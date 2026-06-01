import { useState } from 'react'
import { Link2, Check, X, Copy, Play } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

// Blocco configurazione webhook di ingestion della sub-campagna (sezione 9.2).
// In mock-mode il test mostra solo un toast; con Supabase chiamerà l'endpoint.
export function WebhookConfig({ subCampagna }) {
  const [testing, setTesting] = useState(false)

  const url =
    subCampagna.webhook_url ??
    `https://<project>.supabase.co/functions/v1/ingest-lead/${subCampagna.id}`

  const copia = (valore) => {
    navigator.clipboard?.writeText(valore)
    toast.success('Copiato negli appunti.')
  }

  const testaWebhook = async () => {
    setTesting(true)
    await new Promise((r) => setTimeout(r, 600))
    setTesting(false)
    toast.info('Test webhook disponibile dopo il collegamento a Supabase.')
  }

  return (
    <div className="space-y-3">
      <Riga label="Endpoint ingestion">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">{url}</code>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copia(url)} aria-label="Copia URL">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </Riga>

      <Riga label="Secret HMAC">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
          {subCampagna.webhook_secret ?? 'Non configurato'}
        </code>
        {subCampagna.webhook_secret && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copia(subCampagna.webhook_secret)} aria-label="Copia secret">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </Riga>

      <Riga label="Ultimo test">
        <span className="flex items-center gap-2 text-sm">
          {subCampagna.webhook_ultimo_test ? (
            <>
              {subCampagna.webhook_ultimo_esito ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              {formatDate(subCampagna.webhook_ultimo_test)}
            </>
          ) : (
            <span className="text-muted-foreground">Mai testato</span>
          )}
        </span>
      </Riga>

      <Button variant="outline" size="sm" onClick={testaWebhook} disabled={testing}>
        {testing ? <Link2 className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
        {testing ? 'Test in corso…' : 'Testa webhook'}
      </Button>
    </div>
  )
}

function Riga({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center gap-1 overflow-hidden">{children}</div>
    </div>
  )
}
