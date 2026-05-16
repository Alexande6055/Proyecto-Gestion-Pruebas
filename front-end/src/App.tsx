import { useEffect, useState, lazy, Suspense, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'

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
import { MainLayout } from './components/layout/MainLayout'

// Pages (Lazy loading)
const AuthView = lazy(() => import('./pages/Auth/AuthView'))
const DashboardView = lazy(() => import('./pages/Dashboard/DashboardView'))
const UsersView = lazy(() => import('./pages/Users/UsersView'))
const TripsView = lazy(() => import('./pages/Trips/TripsView'))
const RequestsView = lazy(() => import('./pages/Requests/RequestsView'))
const RatingsView = lazy(() => import('./pages/Ratings/RatingsView'))
const ReportsView = lazy(() => import('./pages/Reports/ReportsView'))
const AuditLogsView = lazy(() => import('./pages/AuditLogs/AuditLogsView'))
const ProfileView = lazy(() => import('./pages/Profile/ProfileView'))
const EntityView = lazy(() => import('./pages/Entity/EntityView'))

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const storedSession = localStorage.getItem('uride-session')
      return storedSession ? JSON.parse(storedSession) as AuthSession : null
    } catch {
      return null
    }
  })

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

  const activeView = useMemo<ViewKey>(() => {
    const path = location.pathname
    if (path === '/') return 'dashboard'
    return path.substring(1).replace('-', '_') as ViewKey
  }, [location.pathname])

  const isAdmin = session?.user.role === 'admin'

  const visibleViews = useMemo(() => 
    (Object.keys(viewLabels) as ViewKey[]).filter((key) =>
      isAdmin || !['users', 'audit_logs'].includes(key),
    ), [isAdmin]
  )

  const loadableViews = useMemo(() => 
    managedViews.filter((key) =>
      isAdmin || !['users', 'audit_logs'].includes(key),
    ), [isAdmin]
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
  }, [refreshToken, session, isAdmin, loadableViews])

  // Security: redirect if trying to access unauthorized view
  useEffect(() => {
    if (session && !visibleViews.includes(activeView)) {
      // Check if it's a valid view at all, if not, it might be a 404
      if (Object.keys(viewLabels).includes(activeView)) {
        navigate('/')
      }
    }
  }, [activeView, session, visibleViews, navigate])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      authService.clearSession()
      setSession(null)
      setSearch('')
      navigate('/')
    }
  }

  const handleCreated = () => setRefreshToken((value) => value + 1)

  if (!session) {
    return (
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Cargando...</div>}>
        <AuthView onAuthenticated={setSession} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Cargando...</div>}>
      <Routes>
        <Route element={
          <MainLayout
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            visibleViews={visibleViews}
            activeView={activeView}
            backendStatus={backendStatus}
            search={search}
            setSearch={setSearch}
            session={session}
            handleLogout={handleLogout}
          />
        }>
          <Route path="/" element={<DashboardView data={data} />} />
          <Route path="/profile" element={<ProfileView session={session} onSessionUpdate={setSession} />} />
          <Route path="/trips" element={<TripsView state={data.trips} data={data} session={session} onCreated={handleCreated} />} />
          <Route path="/users" element={isAdmin ? <UsersView state={data.users} data={data} session={session} onCreated={handleCreated} search={search} /> : <Navigate to="/" />} />
          <Route path="/requests" element={<RequestsView state={data.requests} data={data} session={session} onCreated={handleCreated} search={search} />} />
          <Route path="/ratings" element={<RatingsView state={data.ratings} data={data} session={session} onCreated={handleCreated} search={search} />} />
          <Route path="/reports" element={<ReportsView state={data.reports} data={data} session={session} onCreated={handleCreated} search={search} />} />
          <Route path="/audit-logs" element={isAdmin ? <AuditLogsView state={data.audit_logs} data={data} session={session} onCreated={handleCreated} search={search} /> : <Navigate to="/" />} />
          
          {/* Generic entity views for any other managed views that don't have specialized components yet */}
          {managedViews.map(key => {
            const path = `/${key.replace('_', '-')}`
            if (['users', 'trips', 'requests', 'ratings', 'reports', 'audit_logs'].includes(key)) return null
            return (
              <Route 
                key={key}
                path={path} 
                element={
                  <EntityView
                    config={entityConfigs[key]}
                    state={data[key]}
                    data={data}
                    search={search}
                    session={session}
                    onCreated={handleCreated}
                  />
                } 
              />
            )
          })}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
