import { lazy, Suspense, useMemo, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
import type { ViewKey, EntityState, EntityRow, NotificationItem } from './types'

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
import { getSocket, disconnectSocket } from './services/socket'

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
  const requestStatusRef = useRef<Map<string, string>>(new Map())
  const notificationsReadyRef = useRef(false)
  
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
  const auditLogsQuery = useEntityData('audit_logs', isAdmin ? entityConfigs.audit_logs.endpoint : '')

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

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!session) return []

    const tripById = new Map(data.trips.rows.map((trip) => [String(trip.id), trip]))
    const passengerName = (request: EntityRow) => {
      const passenger = request.pasajero && typeof request.pasajero === 'object' && !Array.isArray(request.pasajero)
        ? request.pasajero as EntityRow
        : data.users.rows.find((user) => String(user.id) === String(request.pasajero_id))
      return String(passenger?.nombre ?? 'Pasajero')
    }
    const tripRoute = (trip?: EntityRow) => trip
      ? `${String(trip.origen_zona ?? 'Origen')} - ${String(trip.destino_zona ?? 'Destino')}`
      : 'Viaje'

    return data.requests.rows
      .map<NotificationItem | null>((request) => {
        const trip = tripById.get(String(request.viaje_id))
        const status = String(request.estado)
        const isDriver = trip && String(trip.conductor_id) === String(session.user.id)
        const isPassenger = String(request.pasajero_id) === String(session.user.id)

        if (isDriver && status === 'pendiente') {
          return {
            id: String(request.id),
            title: 'Reserva pendiente',
            description: `${passengerName(request)} solicita cupo en ${tripRoute(trip)}.`,
            tone: 'warning',
            createdAt: String(request.fecha_solicitud ?? ''),
          } satisfies NotificationItem
        }

        if (isPassenger && ['aceptada', 'rechazada', 'cancelada'].includes(status)) {
          const title = status === 'aceptada'
            ? 'Reserva aceptada'
            : status === 'rechazada'
              ? 'Reserva rechazada'
              : 'Reserva cancelada'

          const description = status === 'aceptada'
            ? `Tu cupo en ${tripRoute(trip)} fue confirmado.`
            : status === 'rechazada'
              ? `Tu solicitud para ${tripRoute(trip)} fue rechazada.`
              : `Tu reserva en ${tripRoute(trip)} fue cancelada.`

          return {
            id: String(request.id),
            title,
            description,
            tone: status === 'aceptada' ? 'ok' : 'danger',
            createdAt: String(request.fecha_solicitud ?? ''),
          } satisfies NotificationItem
        }

        return null
      })
      .filter((item): item is NotificationItem => Boolean(item))
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
      .slice(0, 8)
  }, [data.requests.rows, data.trips.rows, data.users.rows, session])

  useEffect(() => {
    if (!session) return

    const socket = getSocket(session.user.id, session.access_token)
    if (!socket) return

    const refreshEntities = () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    }

    const handleNewRequest = () => {
      toast.info('Nueva reserva pendiente.')
      refreshEntities()
    }

    const handleRequestUpdated = (payload?: { status?: string }) => {
      toast.info(payload?.status ? `Reserva ${payload.status}.` : 'Reserva actualizada.')
      refreshEntities()
    }

    const handleRequestCancelled = () => {
      toast.info('Una reserva fue cancelada.')
      refreshEntities()
    }

    socket.on('new_request', handleNewRequest)
    socket.on('request_updated', handleRequestUpdated)
    socket.on('request_cancelled', handleRequestCancelled)
    socket.on('new_report_notification', (payload?: { reason?: string }) => {
      toast.error('Has recibido un nuevo reporte. Tu reputación ha sido afectada.', {
          description: payload?.reason ? `Motivo: ${payload.reason}` : undefined,
          duration: 10000,
      });
      refreshEntities();
    })

    return () => {
      socket.off('new_request', handleNewRequest)
      socket.off('request_updated', handleRequestUpdated)
      socket.off('request_cancelled', handleRequestCancelled)
      socket.off('new_report_notification')
    }
  }, [queryClient, session])

  useEffect(() => {
    if (!session || data.requests.loading || data.trips.loading) return

    const tripById = new Map(data.trips.rows.map((trip) => [String(trip.id), trip]))
    const nextStatuses = new Map<string, string>()

    for (const request of data.requests.rows) {
      const requestId = String(request.id ?? '')
      const status = String(request.estado ?? '')
      if (!requestId || !status) continue

      nextStatuses.set(requestId, status)

      if (!notificationsReadyRef.current) continue

      const previousStatus = requestStatusRef.current.get(requestId)
      const trip = tripById.get(String(request.viaje_id))
      const isDriverRequest = trip && String(trip.conductor_id) === String(session.user.id)
      const isPassengerRequest = String(request.pasajero_id) === String(session.user.id)

      if (!previousStatus && isDriverRequest && status === 'pendiente') {
        toast.info('Nueva reserva pendiente para uno de tus viajes.')
      } else if (previousStatus && previousStatus !== status && isPassengerRequest) {
        if (status === 'aceptada') toast.success('Tu reserva fue aceptada. Cupo confirmado.')
        else if (status === 'rechazada') toast.error('Tu reserva fue rechazada.')
        else if (status === 'cancelada') toast.info('Tu reserva fue cancelada.')
        else toast.info(`Tu reserva fue ${status}.`)
      }
    }

    requestStatusRef.current = nextStatuses
    notificationsReadyRef.current = true
  }, [data.requests.loading, data.requests.rows, data.trips.loading, data.trips.rows, session])

  // Security: redirect if trying to access unauthorized view
  useEffect(() => {
    if (session && !visibleViews.includes(activeView)) {
      if (Object.keys(viewLabels).includes(activeView)) {
        navigate('/')
      }
    }
  }, [activeView, session, visibleViews, navigate])

  const handleLogout = async () => {
    disconnectSocket()
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
            notifications={notifications}
            onNotificationsAction={() => navigate('/trips')}
            handleLogout={handleLogout}
          />
        }>
          <Route path="/" element={<DashboardView data={data} session={session} />} />
          <Route path="/profile" element={<ProfileView session={session} onSessionUpdate={setSession} />} />
          <Route path="/trips" element={<TripsView state={data.trips} data={data} session={session} onCreated={handleCreated} />} />
          <Route path="/users" element={isAdmin ? <UsersView state={data.users} data={data} session={session} onCreated={handleCreated} search={search} /> : <Navigate to="/" />} />
          <Route path="/requests" element={<RequestsView state={data.requests} data={data} session={session} onCreated={handleCreated} search={search} />} />
          <Route path="/ratings" element={<RatingsView state={data.ratings} data={data} session={session} onCreated={handleCreated} search={search} />} />
          <Route path="/reports" element={<ReportsView state={data.reports} data={data} session={session} onCreated={handleCreated} />} />
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
