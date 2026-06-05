import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Star,
  MessageSquareWarning,
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
  profile: UserCircle,
}

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isMobile: boolean
  visibleViews: ViewKey[]
}

export function Sidebar({ sidebarOpen, setSidebarOpen, isMobile, visibleViews }: SidebarProps) {
  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20'
  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
    : `${sidebarWidth} shrink-0`

  return (
    <aside 
      className={`${mobileClasses} bg-white border-r border-night-100 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-night-100">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-uride-500 to-uride-600 flex items-center justify-center shrink-0 shadow-uride">
          <Car className="w-5 h-5 text-white" />
        </div>
        {(sidebarOpen || isMobile) && (
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
              onClick={() => isMobile && setSidebarOpen(false)}
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
                  {(sidebarOpen || isMobile) && (
                    <span className="truncate">{viewLabels[key]}</span>
                  )}
                  {isActive && (sidebarOpen || isMobile) && (
                    <ChevronRight className="w-4 h-4 ml-auto text-uride-500 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar footer / toggle - only visible on desktop */}
      {!isMobile && (
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
      )}
    </aside>
  )
}
