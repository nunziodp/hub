import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Megaphone,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useRevisioneCount } from '@/features/lead/hooks/useRevisione'

// Voci di navigazione — sezione 4 della spec
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { label: 'Campagne',  icon: Megaphone,       href: ROUTES.CAMPAGNE },
  {
    label: 'RDV',
    icon: Building2,
    children: [
      { label: 'Tutte le RDV',    href: ROUTES.RDV_TUTTE },
      { label: 'Attive nel mese', href: ROUTES.RDV_ATTIVE },
      { label: 'Fatturazione',    href: ROUTES.RDV_FATTURAZIONE },
    ],
  },
  {
    label: 'Statistiche',
    icon: BarChart3,
    children: [
      { label: 'Performance fonti', href: ROUTES.STAT_FONTI },
      { label: 'Performance RDV',   href: ROUTES.STAT_RDV },
      { label: 'Report GDPR',       href: ROUTES.STAT_GDPR },
    ],
  },
  {
    label: 'Lead',
    icon: Zap,
    children: [
      { label: 'Tutte le lead',  href: ROUTES.LEAD_TUTTE },
      { label: 'In revisione',   href: ROUTES.LEAD_REVISIONE, badge: 'revisioneCount' },
      { label: 'In riciclo',     href: ROUTES.LEAD_RICICLO },
      { label: 'Liste fredde',   href: ROUTES.LEAD_LISTE_FREDDE },
      { label: 'Importa lista',  href: ROUTES.LEAD_IMPORTA },
    ],
  },
]

// Il conteggio del badge "revisioneCount" arriva da useRevisioneCount
// (query ['leads','revisione-count']) così si aggiorna quando una lead viene
// corretta o scartata; in fase Supabase diventerà una subscription realtime.

function getBadgeValue(key, counts) {
  if (!key) return null
  return counts[key] ?? null
}

// Determina se il gruppo (item con children) contiene la route corrente
function isGroupActive(item, pathname) {
  if (!item.children) return false
  return item.children.some((c) => pathname.startsWith(c.href))
}

export function Sidebar() {
  const location = useLocation()
  const counts = { revisioneCount: useRevisioneCount() }

  // Stato espansione dei gruppi; di default si auto-espande il gruppo della route attiva
  const initialOpen = NAV_ITEMS.reduce((acc, item) => {
    if (item.children) acc[item.label] = isGroupActive(item, location.pathname)
    return acc
  }, {})
  const [openGroups, setOpenGroups] = useState(initialOpen)
  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <aside className="fixed inset-y-0 left-0 top-14 hidden w-60 border-r border-border bg-card md:block">
      <nav className="flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <SidebarGroup
                  item={item}
                  isOpen={openGroups[item.label]}
                  onToggle={() => toggleGroup(item.label)}
                  counts={counts}
                  isActive={isGroupActive(item, location.pathname)}
                />
              ) : (
                <SidebarLink item={item} counts={counts} />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function SidebarLink({ item, counts, nested = false }) {
  const Icon = item.icon
  const badgeValue = getBadgeValue(item.badge, counts)
  return (
    <NavLink
      to={item.href}
      end={item.href === ROUTES.DASHBOARD}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          nested ? 'pl-9' : '',
          isActive
            ? 'bg-brand-50 text-brand-600'
            : 'text-foreground/70 hover:bg-muted hover:text-foreground',
        )
      }
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {item.label}
      </span>
      {badgeValue != null && badgeValue > 0 && (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-100 px-1.5 text-xs font-semibold text-rose-700">
          {badgeValue}
        </span>
      )}
    </NavLink>
  )
}

function SidebarGroup({ item, isOpen, onToggle, counts, isActive }) {
  const Icon = item.icon
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-600'
            : 'text-foreground/70 hover:bg-muted hover:text-foreground',
        )}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? 'rotate-180' : '',
          )}
        />
      </button>
      {isOpen && (
        <ul className="mt-1 space-y-1">
          {item.children.map((child) => (
            <li key={child.href}>
              <SidebarLink item={child} counts={counts} nested />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
