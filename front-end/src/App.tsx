import { lazy, Suspense, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

// Types
import type { ViewKey, EntityState } from './types'

// Constants
import { 
  entityConfigs, 
  viewLabels, 
  managedViews, 
  initialEntityState 
} from './constants/entities'

// Components
import { MainLayout } from './components/layout/MainLayout'

// Hooks & Stores
import { useAuthStore } from './store/useAuthStore'
import { useUIStore } from './store/useUIStore'
import { useBackendStatus } from './hooks/useBackendStatus'
import { useEntityData } from './hooks/useEntityData'

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
  const queryClient = useQueryClient()

  const { session, setSession, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, search, setSearch } = useUIStore()
  
  const { data: backendStatusResponse } = useBackendStatus()
  const backendStatus = backendStatusResponse ?? 'checking'

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

  // Fetch all managed data (This is for the dashboard summary, can be optimized later)
  const usersQuery = useEntityData('users', entityConfigs.users.endpoint)
  const tripsQuery = useEntityData('trips', entityConfigs.trips.endpoint)
  const requestsQuery = useEntityData('requests', entityConfigs.requests.endpoint)
  const ratingsQuery = useEntityData('ratings', entityConfigs.ratings.endpoint)
  const reportsQuery = useEntityData('reports', entityConfigs.reports.endpoint)
  const auditLogsQuery = useEntityData('audit_logs', entityConfigs.audit_logs.endpoint)

  // Map queries to the data structure expected by views
  const data = useMemo<Record<ViewKey, EntityState>>(() => ({
    dashboard: { rows: [], loading: false, error: '' }, // Dashboard processes its own logic usually
    users: { rows: usersQuery.data ?? [], loading: usersQuery.isLoading, error: usersQuery.error?.message ?? '' },
    trips: { rows: tripsQuery.data ?? [], loading: tripsQuery.isLoading, error: tripsQuery.error?.message ?? '' },
    requests: { rows: requestsQuery.data ?? [], loading: requestsQuery.isLoading, error: requestsQuery.error?.message ?? '' },
    ratings: { rows: ratingsQuery.data ?? [], loading: ratingsQuery.isLoading, error: ratingsQuery.error?.message ?? '' },
    reports: { rows: reportsQuery.data ?? [], loading: reportsQuery.isLoading, error: reportsQuery.error?.message ?? '' },
    audit_logs: { rows: auditLogsQuery.data ?? [], loading: auditLogsQuery.isLoading, error: auditLogsQuery.error?.message ?? '' },
    profile: initialEntityState,
  }), [usersQuery, tripsQuery, requestsQuery, ratingsQuery, reportsQuery, auditLogsQuery])

  // Security: redirect if trying to access unauthorized view
  useEffect(() => {
    if (session && !visibleViews.includes(activeView)) {
      if (Object.keys(viewLabels).includes(activeView)) {
        navigate('/')
      }
    }
  }, [activeView, session, visibleViews, navigate])

  const handleLogout = async () => {
    await logout()
    queryClient.clear()
    navigate('/')
  }

  const handleCreated = () => {
    // Invalidate all entity queries to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['entities'] })
  }

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
