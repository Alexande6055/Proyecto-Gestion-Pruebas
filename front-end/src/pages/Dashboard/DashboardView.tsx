import { Badge } from '../../components/common/Badge'
import { StatCard } from '../../components/common/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import type { EntityRow, ViewKey, EntityState } from '../../types'
import { managedViews, statusTone } from '../../constants/entities'
import { getRelatedName } from '../../utils/entityHelpers'

interface DashboardViewProps {
  data: Record<ViewKey, EntityState>
}

export function DashboardView({ data }: DashboardViewProps) {
  const users = data.users.rows
  const trips = data.trips.rows
  const requests = data.requests.rows
  const ratings = data.ratings.rows
  const reports = data.reports.rows
  const loading = managedViews.some((key) => data[key].loading)
  const activeTrips = trips.filter((trip) => ['abierto', 'completo'].includes(String(trip.estado))).length
  const pendingRequests = requests.filter((request) => request.estado === 'pendiente').length
  const openReports = reports.filter((report) => report.estado !== 'resuelto').length
  const ratingValues = ratings.map((rating) => Number(rating.puntuacion)).filter((value) => Number.isFinite(value))
  const averageRating = ratingValues.length
    ? (ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length).toFixed(1)
    : '0.0'
  const userLabel = (row: EntityRow, relationKey: string, idKey: string) => {
    const id = row[idKey] as string | number | null | undefined
    const user = users.find((item) => String(item.id) === String(id))
    if (user?.nombre) return String(user.nombre)
    return getRelatedName(row, relationKey, id)
  }

  return (
    <div className="view-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">U-Ride</p>
          <h1>Gestion de transporte compartido estudiantil</h1>
          <p className="hero-copy">
            Panel conectado al backend para consultar usuarios, viajes, solicitudes, calificaciones, reportes y auditoria.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button">Nuevo viaje</button>
          <button type="button" className="secondary">Nuevo reporte</button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Usuarios" value={loading ? '...' : String(users.length)} detail="Registros en users" />
        <StatCard label="Viajes activos" value={loading ? '...' : String(activeTrips)} detail="Abiertos o completos" />
        <StatCard label="Solicitudes pendientes" value={loading ? '...' : String(pendingRequests)} detail="Registros en requests" />
        <StatCard label="Reputacion global" value={loading ? '...' : averageRating} detail={`${openReports} reportes abiertos`} />
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>Viajes recientes</h2>
            <Badge tone="info">trips</Badge>
          </div>
          {trips.length ? (
            <div className="timeline">
              {trips.slice(0, 6).map((trip) => (
                <article key={String(trip.id)} className="timeline-item">
                  <time>{String(trip.fecha_hora ?? '')}</time>
                  <strong>{String(trip.origen_zona ?? '')} {'->'} {String(trip.destino_zona ?? '')}</strong>
                  <span>{userLabel(trip, 'conductor', 'conductor_id')} - {String(trip.cupos_disponibles ?? 0)} cupos</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin viajes" message="Cuando el backend devuelva trips, apareceran aqui." />
          )}
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>Reportes activos</h2>
            <Badge tone="warning">reports</Badge>
          </div>
          {reports.length ? (
            <div className="review-list">
              {reports.slice(0, 6).map((report) => (
                <article key={String(report.id)} className="compact-row">
                  <div>
                    <strong>
                      {userLabel(report, 'reportante', 'reportante_id')}
                      {' reporta a '}
                      {userLabel(report, 'reportado', 'reportado_id')}
                    </strong>
                    <span>{String(report.motivo ?? '')}</span>
                  </div>
                  <Badge tone={statusTone[String(report.estado)]}>{String(report.estado ?? '')}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin reportes" message="Cuando el backend devuelva reports, apareceran aqui." />
          )}
        </div>
      </section>
    </div>
  )
}
