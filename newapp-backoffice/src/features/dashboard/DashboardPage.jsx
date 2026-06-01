import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { ActiveSourcesTable } from '@/features/dashboard/components/ActiveSourcesTable'
import { ActivityFeed } from '@/features/dashboard/components/ActivityFeed'
import { AlertBanner } from '@/features/dashboard/components/AlertBanner'
import { KpiRow } from '@/features/dashboard/components/KpiRow'
import { SourceChart } from '@/features/dashboard/components/SourceChart'
import { VolumeChart } from '@/features/dashboard/components/VolumeChart'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'

// Dashboard principale — sezione 9.1 della spec.
// Composizione:
//   1. KpiRow (5 card)
//   2. AlertBanner (banner condizionali)
//   3. VolumeChart + SourceChart (50/50)
//   4. ActiveSourcesTable + ActivityFeed (50/50)
export default function DashboardPage() {
  const { kpi, alerts, volume14gg, distribuzioneFonti, topSubCampagne, activityFeed } =
    useDashboardData()

  return (
    <>
      <ScreenHeader
        title="Dashboard"
        subtitle="Panoramica della piattaforma — ultimi 30 giorni"
      />

      <div className="space-y-6">
        <KpiRow kpi={kpi} />

        <AlertBanner alerts={alerts} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VolumeChart data={volume14gg} />
          <SourceChart data={distribuzioneFonti} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ActiveSourcesTable rows={topSubCampagne} />
          <ActivityFeed events={activityFeed} />
        </div>
      </div>
    </>
  )
}
