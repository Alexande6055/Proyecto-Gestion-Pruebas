import { 
  Search, 
  Bell, 
  UserCircle, 
  LogOut, 
  ChevronRight 
} from 'lucide-react'
import { Badge, LoadingBadge } from '../common/Badge'
import type { AuthSession, ViewKey } from '../../types'
import { viewLabels } from '../../constants/entities'

interface HeaderProps {
  activeView: ViewKey
  backendStatus: 'checking' | 'online' | 'offline'
  search: string
  setSearch: (value: string) => void
  session: AuthSession
  handleLogout: () => void
}

export function Header({
  activeView,
  backendStatus,
  search,
  setSearch,
  session,
  handleLogout,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-night-100 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Breadcrumb + View title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-night-400 text-sm">
          <span className="font-medium">Panel</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-night-700">{viewLabels[activeView]}</span>
        </div>
      </div>

      {/* Right: Status + Search + User */}
      <div className="flex items-center gap-4">
        {/* Backend Status */}
        {backendStatus === 'checking' ? (
          <LoadingBadge>Verificando backend</LoadingBadge>
        ) : backendStatus === 'online' ? (
          <Badge tone="ok" className="bg-uride-50 text-uride-700 border border-uride-200">
            Backend online
          </Badge>
        ) : (
          <Badge tone="danger" className="bg-red-50 text-red-700 border border-red-200">
            Backend offline
          </Badge>
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
        <button className="relative p-2 rounded-lg text-night-400 hover:bg-night-100 hover:text-night-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-uride-500 rounded-full" />
        </button>

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
