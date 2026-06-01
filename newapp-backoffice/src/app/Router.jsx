import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import CampagnePage from '@/features/campagne/CampagnePage'
import RdvListPage from '@/features/rdv/RdvListPage'
import RdvActivePage from '@/features/rdv/RdvActivePage'
import RdvDetailPage from '@/features/rdv/RdvDetailPage'
import FatturazionePage from '@/features/rdv/FatturazionePage'
import StatFontiPage from '@/features/statistiche/StatFontiPage'
import StatRdvPage from '@/features/statistiche/StatRdvPage'
import StatGdprPage from '@/features/statistiche/StatGdprPage'
import LeadPage from '@/features/lead/LeadPage'
import TutteLeLead from '@/features/lead/TutteLeLead'
import InAttesaRevisione from '@/features/lead/InAttesaRevisione'
import InRiciclo from '@/features/lead/InRiciclo'
import ListeFredde from '@/features/lead/ListeFredde'
import ImportaListe from '@/features/lead/ImportaListe'
import { ROUTES } from '@/constants/routes'

// Router principale — sezione 3 della spec.
// AppShell ospita l'AuthGuard: gli utenti non autenticati vengono redirect a /login.
export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Campagne */}
        <Route path="campagne" element={<CampagnePage />} />

        {/* RDV */}
        <Route path="rdv" element={<Navigate to={ROUTES.RDV_TUTTE} replace />} />
        <Route path="rdv/tutte" element={<RdvListPage />} />
        <Route path="rdv/attive" element={<RdvActivePage />} />
        <Route path="rdv/fatturazione" element={<FatturazionePage />} />
        <Route path="rdv/:id" element={<RdvDetailPage />} />

        {/* Statistiche */}
        <Route path="statistiche/fonti" element={<StatFontiPage />} />
        <Route path="statistiche/rdv" element={<StatRdvPage />} />
        <Route path="statistiche/gdpr" element={<StatGdprPage />} />

        {/* Lead */}
        <Route path="lead" element={<LeadPage />} />
        <Route path="lead/tutte" element={<TutteLeLead />} />
        <Route path="lead/revisione" element={<InAttesaRevisione />} />
        <Route path="lead/riciclo" element={<InRiciclo />} />
        <Route path="lead/liste-fredde" element={<ListeFredde />} />
        <Route path="lead/importa" element={<ImportaListe />} />
      </Route>

      {/* Catch-all → dashboard */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  )
}
