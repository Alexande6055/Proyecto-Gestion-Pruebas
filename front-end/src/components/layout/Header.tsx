import { useState } from 'react'
import { 
  Search, 
  Bell, 
  UserCircle, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
} from 'lucide-react'
import { Badge, LoadingBadge } from '../common/Badge'
import type { AuthSession, NotificationItem, ViewKey } from '../../types'
import { viewLabels } from '../../constants/entities'

interface HeaderProps {
  activeView: ViewKey
  backendStatus: 'checking' | 'online' | 'offline'
  search: string
  setSearch: (value: string) => void
  session: AuthSession
  notifications: NotificationItem[]
  onNotificationsAction: () => void
  handleLogout: () => void
  isMobile: boolean
  toggleSidebar: () => void
}

export function Header({
  activeView,
  backendStatus,
  search,
  setSearch,
  session,
  notifications,
  onNotificationsAction,
  handleLogout,
  isMobile,
  toggleSidebar,
}: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const unreadCount = notifications.length

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-night-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left: Hamburger (mobile) + Breadcrumb + View title */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-night-400 hover:bg-night-100 hover:text-night-600 transition-colors lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-night-400 text-sm overflow-hidden whitespace-nowrap">
          <span className="font-medium hidden xs:inline">Panel</span>
          <ChevronRight className="w-3.5 h-3.5 hidden xs:inline" />
          <span className="font-semibold text-night-700 truncate">{viewLabels[activeView]}</span>
        </div>
      </div>

      {/* Right: Status + Search + User */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Backend Status - minimized on mobile */}
        {backendStatus === 'checking' ? (
          <div className="hidden sm:block"><LoadingBadge>Verificando</LoadingBadge></div>
        ) : backendStatus === 'online' ? (
          <div className="flex items-center">
             <div className="sm:hidden w-2.5 h-2.5 rounded-full bg-green-500 mr-2" title="Backend online" />
             <Badge tone="ok" className="hidden sm:flex bg-uride-50 text-uride-700 border border-uride-200 text-xs">
                Backend online
             </Badge>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="sm:hidden w-2.5 h-2.5 rounded-full bg-red-500 mr-2" title="Backend offline" />
            <Badge tone="danger" className="hidden sm:flex bg-red-50 text-red-700 border border-red-200 text-xs">
              Backend offline
            </Badge>
          </div>
        )}

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400 pointer-events-none" />
          <input
            aria-label="Buscar"
            placeholder="Buscar por atributo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64 pl-9 pr-4 py-2 bg-night-50 border border-night-200 rounded-uride-xs text-sm text-night-800 placeholder-night-400 focus:outline-none focus:ring-2 focus:ring-uride-500/30 focus:border-uride-500 transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative p-2 rounded-lg text-night-400 hover:bg-night-100 hover:text-night-600 transition-colors"
            aria-label="Abrir notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-uride-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-uride-xs border border-night-100 bg-white shadow-night-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-night-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-night-900">Notificaciones</h3>
                  <p className="text-xs text-night-500">{unreadCount ? `${unreadCount} novedades` : 'Sin novedades pendientes'}</p>
                </div>
                {unreadCount > 0 && <Badge tone="warning">{String(unreadCount)}</Badge>}
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-6 w-6 text-night-300" />
                    <p className="text-sm font-semibold text-night-700">Todo al dia</p>
                    <p className="text-xs text-night-400">Aqui apareceran reservas y cambios importantes.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false)
                        onNotificationsAction()
                      }}
                      className="flex w-full gap-3 rounded-uride-xs px-3 py-3 text-left hover:bg-night-50"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notificationIconClass(item.tone)}`}>
                        {notificationIcon(item.tone)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-night-900">{item.title}</span>
                        <span className="block text-xs leading-relaxed text-night-500">{item.description}</span>
                        {item.createdAt && <span className="mt-1 block text-[10px] font-semibold uppercase text-night-300">{formatNotificationDate(item.createdAt)}</span>}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false)
                  onNotificationsAction()
                }}
                className="w-full border-t border-night-100 px-4 py-3 text-sm font-bold text-uride-600 hover:bg-uride-50"
              >
                Ver viajes y reservas
              </button>
            </div>
          )}
        </div>

        {/* User Session */}
        <div className="flex items-center gap-3 pl-4 border-l border-night-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-uride-500 to-uride-600 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-night-800 leading-tight">{session.user.nombre}</p>
              <p className="text-xs text-night-500 capitalize">{session.user.role}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleLogout}
            className="p-2 rounded-lg text-night-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
            title="Cerrar sesion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

function notificationIcon(tone: NotificationItem['tone']) {
  if (tone === 'ok') return <CheckCircle2 className="h-4 w-4" />
  if (tone === 'danger') return <XCircle className="h-4 w-4" />
  return <Clock className="h-4 w-4" />
}

function notificationIconClass(tone: NotificationItem['tone']) {
  if (tone === 'ok') return 'bg-green-50 text-green-600'
  if (tone === 'danger') return 'bg-red-50 text-red-600'
  return 'bg-amber-50 text-amber-600'
}

function formatNotificationDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
