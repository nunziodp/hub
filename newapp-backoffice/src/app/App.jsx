import { Providers } from '@/app/Providers'
import { AppRouter } from '@/app/Router'

// Root dell'applicazione: monta tutti i provider globali e il router.
export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
