import { 
  Car, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Star, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Shield,
  Activity,
  MessageSquare,
  Route,
  ChevronRight,
  Loader2,
  Filter
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import type { AuthSession, EntityRow, ViewKey, EntityState } from '../../types'
import { managedViews, statusTone } from '../../constants/entities'
import { getRelatedName } from '../../utils/entityHelpers'

interface DashboardViewProps {
  data: Record<ViewKey, EntityState>
  session: AuthSession
}

export function DashboardView({ data, session }: DashboardViewProps) {
  const navigate = useNavigate()
  const isAdmin = session.user.role === 'admin'
  const userId = session.user.id
  const allUsers = data.users.rows
  const allTrips = data.trips.rows
  const allRequests = data.requests.rows

  const isTripMine = (trip: EntityRow) => String(trip.conductor_id) === String(userId)
  const requestTrip = (request: EntityRow) => allTrips.find((trip) => String(trip.id) === String(request.viaje_id))
  const isRequestMine = (request: EntityRow) => {
    const trip = requestTrip(request)
    return String(request.pasajero_id) === String(userId) || (trip ? isTripMine(trip) : false)
  }

  const requests = isAdmin ? allRequests : allRequests.filter(isRequestMine)
  const requestTripIds = new Set(requests.map((request) => String(request.viaje_id)))
  const trips = isAdmin
    ? allTrips
    : allTrips.filter((trip) => isTripMine(trip) || requestTripIds.has(String(trip.id)))
  const ratings = isAdmin
    ? data.ratings.rows
    : data.ratings.rows.filter((rating) => (
      String(rating.calificador_id) === String(userId)
      || String(rating.calificado_id) === String(userId)
      || requestTripIds.has(String(rating.viaje_id))
    ))
  const reports = isAdmin
    ? data.reports.rows
    : data.reports.rows.filter((report) => (
      String(report.reportante_id) === String(userId)
      || String(report.reportado_id) === String(userId)
      || requestTripIds.has(String(report.viaje_id))
    ))
  const users = isAdmin ? allUsers : [{ id: userId, nombre: session.user.nombre, correo_institucional: session.user.email }]
  const loading = managedViews.some((key) => data[key].loading)

  const activeTrips = trips.filter((trip) => ['abierto', 'completo'].includes(String(trip.estado))).length
  const pendingRequests = requests.filter((request) => request.estado === 'pendiente').length
  const openReports = reports.filter((report) => report.estado !== 'resuelto').length

  const currentUser = allUsers.find(u => String(u.id) === String(userId))
  const isBlocked = currentUser && Number(currentUser.reputacion_promedio) < 3.0

  // Usar la reputación real de la DB (que incluye penalizaciones) en lugar de un promedio local parcial
  const averageRating = currentUser ? Number(currentUser.reputacion_promedio).toFixed(1) : '5.0'

  const userLabel = (row: EntityRow, relationKey: string, idKey: string) => {
    const id = row[idKey] as string | number | null | undefined
    const user = allUsers.find((item) => String(item.id) === String(id))
    if (user?.nombre) return String(user.nombre)
    return getRelatedName(row, relationKey, id)
  }

  return (
    <div className="min-h-screen bg-night-50">
      {isBlocked && (
          <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-center gap-3 animate-pulse">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div className="text-center">
                  <p className="font-black text-sm uppercase tracking-widest">CUENTA RESTRINGIDA</p>
                  <p className="text-xs font-bold opacity-90">Tu reputación ha bajado a {averageRating}. No puedes crear ni unirte a viajes hasta mejorarla.</p>
              </div>
          </div>
      )}

      {/* HERO PANEL - Modo Claro */}
      <section className="relative overflow-hidden bg-white border-b border-night-200 px-6 py-10 sm:px-8 lg:px-12">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-72 h-72 bg-uride-100 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-info-100 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="badge-uride">{isAdmin ? 'Panel Administrativo' : 'Mi actividad'}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  En linea
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-night-900 tracking-tight">
                Gestion de <span className="text-gradient-uride">transporte compartido</span> estudiantil
              </h1>
              <p className="text-night-500 text-base leading-relaxed max-w-2xl">
                {isAdmin
                  ? 'Panel conectado al backend para consultar usuarios, viajes, solicitudes, calificaciones, reportes y auditoria en tiempo real.'
                  : 'Panel conectado al backend con tus viajes, reservas, calificaciones y reportes en tiempo real.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                type="button"
                onClick={() => navigate('/trips')}
                className="btn-uride-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo viaje
              </button>
              <button 
                type="button"
                onClick={() => navigate('/reports')}
                className="btn-uride-secondary"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Nuevo reporte
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS GRID - Modo Claro */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 -mt-6 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Users Stat */}
          <div className="card-uride p-5 hover:shadow-night-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-uride-xs bg-linear-to-br from-uride-50 to-uride-100 flex items-center justify-center shadow-night">
                <Users className="w-5 h-5 text-uride-600" />
              </div>
              <span className="badge-uride">{isAdmin ? 'Usuarios' : 'Cuenta'}</span>
            </div>
            <div className="text-3xl font-extrabold text-night-900">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-uride-500" />
              ) : (
                users.length
              )}
            </div>
            <p className="text-sm text-night-500 mt-1">{isAdmin ? 'Registros activos en el sistema' : 'Tu perfil activo'}</p>
            <div className="mt-3 h-1.5 bg-night-100 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-uride-400 to-uride-500 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>

          {/* Active Trips Stat */}
          <div className="card-uride p-5 hover:shadow-night-xl hover:-translate-y-0.5 transition-all duration-300 pointer-events-none">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-uride-xs bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-night">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-full">
                Viajes
              </span>
            </div>
            <div className="text-3xl font-extrabold text-night-900">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-uride-500" />
              ) : (
                activeTrips
              )}
            </div>
            <p className="text-sm text-night-500 mt-1">Viajes abiertos o completos</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Activity className="w-3.5 h-3.5" />
              <span>{trips.length} total registrados</span>
            </div>
          </div>

          {/* Pending Requests Stat */}
          <div className="card-uride p-5 hover:shadow-night-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => navigate('/requests')}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-uride-xs bg-linear-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-night">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full">
                Solicitudes
              </span>
            </div>
            <div className="text-3xl font-extrabold text-night-900">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-uride-500" />
              ) : (
                pendingRequests
              )}
            </div>
            <p className="text-sm text-night-500 mt-1">Pendientes de aprobacion</p>
            {pendingRequests > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Requieren atencion inmediata</span>
              </div>
            )}
          </div>

          {/* Rating Stat */}
          <div className="card-uride p-5 hover:shadow-night-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => navigate('/ratings')}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-uride-xs bg-linear-to-br from-yellow-50 to-yellow-100 flex items-center justify-center shadow-night">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-500" />
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider rounded-full">
                Ratings
              </span>
            </div>
            <div className="text-3xl font-extrabold text-night-900 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-uride-500" />
              ) : (
                <>
                  {averageRating}
                  <span className="text-lg text-yellow-500 font-bold">/5</span>
                </>
              )}
            </div>
            <p className="text-sm text-night-500 mt-1">Calificacion promedio</p>
            {Number(averageRating) >= 4 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-uride-600">
                <Shield className="w-3.5 h-3.5" />
                <span>Excelente reputacion</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SPLIT GRID - Trips & Reports - Modo Claro */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Trips Panel */}
          <div className="card-uride hover:shadow-night-xl transition-shadow duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-night-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-linear-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                  <Car className="w-4 h-4 text-uride-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-night-900">Viajes recientes</h2>
                  <p className="text-xs text-night-500">Ultimos 6 registros activos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-uride-xs hover:bg-night-100 transition-colors">
                  <Filter className="w-4 h-4 text-night-400" />
                </button>
                <Badge tone="info">trips</Badge>
              </div>
            </div>

            <div className="p-2">
              {trips.length ? (
                <div className="space-y-1">
                  {trips.slice(0, 6).map((trip, index) => (
                    <article 
                      key={String(trip.id)} 
                      onClick={() => navigate('/trips')}
                      className="group flex items-center gap-4 p-3 rounded-uride-xs hover:bg-uride-50/60 transition-all duration-200 cursor-pointer"
                    >
                      {/* Trip number indicator */}
                      <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-night-100 to-night-200 flex items-center justify-center text-xs font-bold text-night-600">
                        {index + 1}
                      </div>

                      {/* Trip details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-night-900">
                          <MapPin className="w-3.5 h-3.5 text-uride-500 shrink-0" />
                          <span className="truncate">{String(trip.origen_zona ?? 'Sin origen')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-night-300 shrink-0" />
                          <MapPin className="w-3.5 h-3.5 text-uride-600 shrink-0" />
                          <span className="truncate">{String(trip.destino_zona ?? 'Sin destino')}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-night-500">
                          <span className="flex items-center gap-1 bg-night-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {String(trip.fecha_hora ?? 'Sin fecha')}
                          </span>
                          <span className="flex items-center gap-1 bg-night-50 px-2 py-0.5 rounded-full">
                            <Users className="w-3 h-3" />
                            {String(trip.cupos_disponibles ?? 0)} cupos
                          </span>
                          <span className="flex items-center gap-1 text-uride-600 font-semibold bg-uride-50 px-2 py-0.5 rounded-full">
                            <Car className="w-3 h-3" />
                            {userLabel(trip, 'conductor', 'conductor_id')}
                          </span>
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <ChevronRight className="w-4 h-4 text-night-300 group-hover:text-uride-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState 
                    title="Sin viajes" 
                    message="Cuando el backend devuelva trips, apareceran aqui." 
                  />
                </div>
              )}
            </div>

            {trips.length > 6 && (
              <div className="px-6 py-3 border-t border-night-100">
                <button onClick={() => navigate('/trips')} className="link-uride text-sm flex items-center gap-1">
                  Ver todos los viajes
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Active Reports Panel */}
          <div className="card-uride hover:shadow-night-xl transition-shadow duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-night-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-linear-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-night-900">Reportes activos</h2>
                  <p className="text-xs text-night-500">{openReports} abiertos de {reports.length} total</p>
                </div>
              </div>
              <Badge tone="warning">reports</Badge>
            </div>

            <div className="p-2">
              {reports.length ? (
                <div className="space-y-1">
                  {reports.slice(0, 6).map((report) => (
                    <article 
                      key={String(report.id)} 
                      onClick={() => navigate('/reports')}
                      className="group flex items-start gap-3 p-3 rounded-uride-xs hover:bg-red-50/40 transition-all duration-200 cursor-pointer"
                    >
                      {/* Status indicator */}
                      <div className={`shrink-0 w-2.5 h-2.5 mt-2 rounded-full ${
                        report.estado === 'resuelto' ? 'bg-uride-500' : 'bg-red-500 animate-pulse'
                      }`} />

                      {/* Report content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-night-900">
                            {userLabel(report, 'reportante', 'reportante_id')}
                          </span>
                          <span className="text-xs text-night-400 bg-night-50 px-1.5 py-0.5 rounded">reporta a</span>
                          <span className="text-sm font-bold text-night-900">
                            {userLabel(report, 'reportado', 'reportado_id')}
                          </span>
                        </div>
                        <p className="text-xs text-night-500 mt-1.5 line-clamp-1 bg-night-50 px-2 py-1 rounded">
                          {String(report.motivo ?? 'Sin motivo especificado')}
                        </p>
                      </div>

                      {/* Status badge */}
                      <Badge tone={statusTone[String(report.estado)]}>
                        {String(report.estado ?? '')}
                      </Badge>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState 
                    title="Sin reportes" 
                    message="Cuando el backend devuelva reports, apareceran aqui." 
                  />
                </div>
              )}
            </div>

            {reports.length > 6 && (
              <div className="px-6 py-3 border-t border-night-100">
                <button onClick={() => navigate('/reports')} className="text-red-600 font-bold text-sm hover:text-red-700 flex items-center gap-1 transition-colors">
                  Ver todos los reportes
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ACTIVITY CHART SECTION - Nueva seccion modo claro */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-6">
        <div className="card-uride p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-linear-to-br from-info-100 to-info-200 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-info-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-night-900">{isAdmin ? 'Actividad del sistema' : 'Mi actividad'}</h2>
                <p className="text-xs text-night-500">{isAdmin ? 'Resumen general de todas las entidades' : 'Resumen filtrado por tu cuenta'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-night-500 bg-night-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-uride-500" />
                {isAdmin ? 'Usuarios' : 'Cuenta'}: {users.length}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-night-500 bg-night-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => navigate('/trips')}>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Viajes: {trips.length}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-night-500 bg-night-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => navigate('/requests')}>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Solicitudes: {requests.length}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-night-500 bg-night-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-yellow-50 transition-colors" onClick={() => navigate('/ratings')}>
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Calificaciones: {ratings.length}
              </span>
            </div>
          </div>

          {/* Visual bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: isAdmin ? 'Usuarios' : 'Cuenta', count: users.length, color: 'from-uride-400 to-uride-500', icon: Users, path: isAdmin ? '/users' : '/profile' },
              { label: 'Viajes', count: trips.length, color: 'from-blue-400 to-blue-500', icon: Route, path: '/trips' },
              { label: 'Solicitudes', count: requests.length, color: 'from-amber-400 to-amber-500', icon: Clock, path: '/requests' },
              { label: 'Calificaciones', count: ratings.length, color: 'from-yellow-400 to-yellow-500', icon: Star, path: '/ratings' },
            ].map((item) => {
              const maxVal = Math.max(users.length, trips.length, requests.length, ratings.length, 1)
              const percentage = maxVal > 0 ? (item.count / maxVal) * 100 : 0
              return (
                <div key={item.label} className="bg-night-50 rounded-uride-xs p-4 cursor-pointer hover:bg-night-100 transition-colors" onClick={() => navigate(item.path)}>
                  <div className="flex items-center gap-2 mb-3">
                    <item.icon className="w-4 h-4 text-night-400" />
                    <span className="text-xs font-semibold text-night-500 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-night-900 mb-2">{item.count}</div>
                  <div className="h-2 bg-night-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-linear-to-r ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS BAR - Modo Claro */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-12">
        <div className="card-uride p-6 bg-linear-to-r from-night-800 to-night-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-uride-xs bg-uride-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-uride-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Resumen de actividad</h3>
                <p className="text-sm text-night-400">
                  {users.length} usuarios · {trips.length} viajes · {requests.length} solicitudes · {ratings.length} calificaciones
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {isAdmin && <button onClick={() => navigate('/users')} className="btn-uride-secondary text-sm py-2.5 px-5">
                <Users className="w-4 h-4 mr-2" />
                Gestionar usuarios
              </button>}
              <button onClick={() => navigate('/trips')} className="btn-uride-primary text-sm py-2.5 px-5">
                <Car className="w-4 h-4 mr-2" />
                Ver viajes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-night-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-uride-500" />
              <span className="text-sm font-bold text-night-700">U-Ride</span>
              <span className="text-sm text-night-400">| {isAdmin ? 'Panel Administrativo' : 'Panel personal'}</span>
            </div>
            <p className="text-xs text-night-400">
              Sistema de gestion de transporte compartido estudiantil
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default DashboardView
