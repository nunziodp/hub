import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/constants/routes'

// Index di /lead — redirige a "Tutte le lead"
export default function LeadPage() {
  return <Navigate to={ROUTES.LEAD_TUTTE} replace />
}
