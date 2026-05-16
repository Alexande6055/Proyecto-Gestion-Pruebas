import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Star,
  MessageSquareWarning,
  ScrollText,
  UserCircle,
  ChevronRight,
} from 'lucide-react'
import type { ViewKey } from '../../types'
import { viewLabels } from '../../constants/entities'

const viewIcons: Record<ViewKey, React.ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  trips: Car,
  requests: ClipboardList,
  ratings: Star,
  reports: MessageSquareWarning,
  audit_logs: ScrollText,
  profile: UserCircle,
}

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  visibleViews: ViewKey[]
}

export function Sidebar({ sidebarOpen, setSidebarOpen, visibleViews }: SidebarProps) {
  return (
    <aside 
      className={`${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 bg-white border-r border-night-100 flex flex-col transition-all duration-300`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-night-100">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-uride-500 to-uride-600 flex items-center justify-center shrink-0 shadow-uride">
          <Car className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-extrabold text-night-900 tracking-tight leading-none">U-Ride</h1>
            <p className="text-[10px] text-night-400 font-medium uppercase tracking-wider">Gestion de viajes</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Vistas del sistema">
        {visibleViews.map((key) => {
          const Icon = viewIcons[key]
          const path = key === 'dashboard' ? '/' : `/${key.replace('_', '-')}`
          
          return (
            <NavLink
              key={key}
              to={path}
              className={({ isActive }) => `
                w-full flex items-center gap-3 px-3 py-2.5 rounded-uride-xs text-sm font-semibold transition-all duration-200 group
                ${isActive
                  ? 'bg-uride-50 text-uride-600 border-l-2 border-uride-500'
                  : 'text-night-500 hover:bg-night-50 hover:text-night-700 border-l-2 border-transparent'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-uride-500' : 'text-night-400 group-hover:text-night-600'
                  }`} />
                  {sidebarOpen && (
                    <span className="truncate">{viewLabels[key]}</span>
                  )}
                  {isActive && sidebarOpen && (
                    <ChevronRight className="w-4 h-4 ml-auto text-uride-500 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar footer / toggle */}
      <div className="p-3 border-t border-night-100">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-uride-xs text-night-400 hover:bg-night-50 hover:text-night-600 transition-all duration-200 text-xs font-medium"
        >
          {sidebarOpen ? (
            <>
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Colapsar menu</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
