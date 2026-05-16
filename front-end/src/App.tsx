import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Star,
  MessageSquareWarning,
  ScrollText,
  UserCircle,
  Search,
  LogOut,
  ChevronRight,
  Bell,
} from 'lucide-react'

// Types
import type { AuthSession, ViewKey, EntityState } from './types'

// Constants
import { 
  entityConfigs, 
  viewLabels, 
  managedViews, 
  initialEntityState 
} from './constants/entities'

// Services
import { requestJson, normalizeRows, authService } from './services'
import { usersService, tripsService, requestsService, ratingsService, reportsService, entityService } from './services'

// Components
import { Badge, LoadingBadge } from './components/common/Badge'

// Pages
import { AuthView } from './pages/Auth/AuthView'
import { DashboardView } from './pages/Dashboard/DashboardView'
import { EntityView } from './pages/Entity/EntityView'
import { TripsView } from './pages/Trips/TripsView'
import { ProfileView } from './pages/Profile/ProfileView'

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

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const storedSession = localStorage.getItem('uride-session')
      return storedSession ? JSON.parse(storedSession) as AuthSession : null
    } catch {
      return null
    }
  })

  const [activeView, setActiveView] = useState<ViewKey>('dashboard')
  const [search, setSearch] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [data, setData] = useState<Record<ViewKey, EntityState>>({
    dashboard: { rows: [], loading: false, error: '' },
    users: initialEntityState,
    trips: initialEntityState,
    requests: initialEntityState,
    ratings: initialEntityState,
    reports: initialEntityState,
    audit_logs: initialEntityState,
    profile: initialEntityState,
  })

  const isAdmin = session?.user.role === 'admin'
  const visibleViews = (Object.keys(viewLabels) as ViewKey[]).filter((key) =>
    isAdmin || !['users', 'audit_logs'].includes(key),
  )
  const loadableViews = managedViews.filter((key) =>
    isAdmin || !['users', 'audit_logs'].includes(key),
  )

  useEffect(() => {
    if (!session) return

    let cancelled = false

    async function loadData() {
      setBackendStatus('checking')

      try {
        await requestJson<unknown>('/api')
      } catch {
        if (cancelled) return
        setBackendStatus('offline')
        setData((current) => {
          const next = { ...current }
          loadableViews.forEach((key) => {
            next[key] = {
              rows: [],
              loading: false,
              error: 'Backend no disponible en http://localhost:3000',
            }
          })
          return next
        })
        return
      }

      if (cancelled) return
      setBackendStatus('online')
      setData((current) => ({
        ...current,
        users: isAdmin ? current.users : { rows: [], loading: false, error: '' },
        audit_logs: isAdmin ? current.audit_logs : { rows: [], loading: false, error: '' },
      }))

      await Promise.all(loadableViews.map(async (key) => {
        const config = entityConfigs[key]
        setData((current) => ({
          ...current,
          [key]: { ...current[key], loading: true, error: '' },
        }))

        try {
          let payload: unknown

          if (key === 'users') {
            payload = await usersService.getAll()
          } else if (key === 'trips') {
            payload = await tripsService.getAll()
          } else if (key === 'requests') {
            payload = await requestsService.getAll()
          } else if (key === 'ratings') {
            payload = await ratingsService.getAll()
          } else if (key === 'reports') {
            payload = await reportsService.getAll()
          } else {
            payload = await entityService.getAll(config.endpoint)
          }

          if (cancelled) return
          setData((current) => ({
            ...current,
            [key]: { rows: normalizeRows(payload), loading: false, error: '' },
          }))
        } catch (error) {
          if (cancelled) return
          setData((current) => ({
            ...current,
            [key]: {
              rows: [],
              loading: false,
              error: error instanceof Error ? error.message : 'Error desconocido',
            },
          }))
        }
      }))
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [refreshToken, session, isAdmin])

  useEffect(() => {
    if (session && !visibleViews.includes(activeView)) {
      setActiveView('dashboard')
    }
  }, [activeView, session, visibleViews])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      authService.clearSession()
      setSession(null)
      setSearch('')
      setActiveView('dashboard')
    }
  }

  if (!session) {
    return <AuthView onAuthenticated={setSession} />
  }

  const currentView = activeView === 'dashboard'
    ? <DashboardView data={data} />
    : activeView === 'profile'
    ? <ProfileView session={session} onSessionUpdate={setSession} />
    : activeView === 'trips'
    ? (
      <TripsView
        state={data[activeView]}
        data={data}
        session={session}
        onCreated={() => setRefreshToken((value) => value + 1)}
      />
    )
    : (
      <EntityView
        config={entityConfigs[activeView]}
        state={data[activeView]}
        data={data}
        search={search}
        session={session}
        onCreated={() => setRefreshToken((value) => value + 1)}
      />
    )

  return (
    <div className="h-screen min-h-screen bg-night-50 flex overflow-hidden">

      {/* SIDEBAR - LIGHT MODE */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-white border-r border-night-100 flex flex-col transition-all duration-300`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-night-100">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-uride-500 to-uride-600 flex items-center justify-center flex-shrink-0 shadow-uride">
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
            const isActive = activeView === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-uride-xs text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-uride-50 text-uride-600 border-l-2 border-uride-500'
                    : 'text-night-500 hover:bg-night-50 hover:text-night-700 border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-uride-500' : 'text-night-400 group-hover:text-night-600'
                }`} />
                {sidebarOpen && (
                  <span className="truncate">{viewLabels[key]}</span>
                )}
                {isActive && sidebarOpen && (
                  <ChevronRight className="w-4 h-4 ml-auto text-uride-500 flex-shrink-0" />
                )}
              </button>
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

      {/* WORKSPACE */}
      <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-night-50">

        {/* TOPBAR - LIGHT MODE */}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-uride-500 to-uride-600 flex items-center justify-center">
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

        {/* MAIN CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {currentView}
        </main>
      </section>
    </div>
  )
}

export default App