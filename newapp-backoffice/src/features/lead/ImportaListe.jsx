import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { ImportWizard } from './components/ImportWizard'

// Schermata "Importa lista" (sezione 13, step 6): wizard CSV → parsing → validazione → import.
export default function ImportaListe() {
  return (
    <>
      <ScreenHeader
        title="Importa lista"
        subtitle="Carica un CSV di lead: parsing campaign_name, scoring e dedup automatici"
      />
      <ImportWizard />
    </>
  )
}
