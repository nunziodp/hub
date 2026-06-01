import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

// Pagina di login — sezione 6 della spec.
// Nessuna registrazione pubblica: gli account sono creati manualmente in Supabase.
export default function LoginPage() {
  const { user, signInWithPassword, isMock } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Credenziali di default precompilate in modalità sviluppo mock.
  // In produzione (con Supabase configurato) i campi partono comunque vuoti.
  const defaultEmail    = isMock ? 'admin@newapp.test' : ''
  const defaultPassword = isMock ? 'newapp2026'        : ''
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [submitting, setSubmitting] = useState(false)

  // Se già autenticato, redirigi alla dashboard (o alla rotta originaria)
  if (user) {
    const target = location.state?.from?.pathname ?? ROUTES.DASHBOARD
    return <Navigate to={target} replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await signInWithPassword(email, password)
    setSubmitting(false)
    if (error) {
      toast.error(error.message ?? 'Login fallito')
      return
    }
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>NewApp BackOffice</CardTitle>
          <CardDescription>
            Accedi con le tue credenziali aziendali.
            {isMock && (
              <span className="mt-2 block rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Modalità sviluppo: Supabase non configurato.
                Qualsiasi credenziale verrà accettata.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Accedi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
