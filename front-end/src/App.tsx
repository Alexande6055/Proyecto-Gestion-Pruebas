import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

type ViewKey = 'dashboard' | 'users' | 'trips' | 'requests' | 'ratings' | 'reports' | 'audit_logs'
type EntityRow = Record<string, string | number | null | undefined>
type StatusTone = 'ok' | 'warning' | 'danger' | 'info' | 'neutral'
type FieldKind = 'text' | 'number' | 'datetime-local' | 'select' | 'textarea'

type FieldConfig = {
  key: string
  label: string
  kind?: FieldKind
  options?: string[]
  relation?: 'users' | 'trips'
}

type EntityConfig = {
  key: ViewKey
  title: string
  subtitle: string
  endpoint: string
  columns: string[]
  fields: FieldConfig[]
}

type EntityState = {
  rows: EntityRow[]
  loading: boolean
  error: string
}

type AuthMode = 'login' | 'register'

type AuthSession = {
  access_token: string
  user: {
    id: string
    nombre: string
    email: string
    role: string
  }
}

const initialEntityState: EntityState = {
  rows: [],
  loading: true,
  error: '',
}

const entityConfigs: Record<ViewKey, EntityConfig> = {
  dashboard: {
    key: 'dashboard',
    title: 'Resumen',
    subtitle: 'Indicadores calculados con la informacion entregada por el backend.',
    endpoint: '',
    columns: [],
    fields: [],
  },
  users: {
    key: 'users',
    title: 'Usuarios',
    subtitle: 'Registro institucional, seguridad, rol, reputacion y estado.',
    endpoint: '/api/users',
    columns: [
      'id',
      'correo_institucional',
      'password_hash',
      'nombre',
      'carrera',
      'foto_url',
      'telefono',
      'zona_barrio',
      'rol',
      'reputacion_promedio',
      'total_viajes',
      'estado',
      'created_at',
    ],
    fields: [
      { key: 'correo_institucional', label: 'Correo institucional' },
      { key: 'password_hash', label: 'Password hash' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'carrera', label: 'Carrera' },
      { key: 'foto_url', label: 'Foto URL' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'zona_barrio', label: 'Zona o barrio' },
      { key: 'rol', label: 'Rol', kind: 'select', options: ['estudiante', 'admin'] },
      { key: 'reputacion_promedio', label: 'Reputacion promedio', kind: 'number' },
      { key: 'total_viajes', label: 'Total viajes', kind: 'number' },
      { key: 'estado', label: 'Estado', kind: 'select', options: ['activo', 'suspendido', 'advertido'] },
    ],
  },
  trips: {
    key: 'trips',
    title: 'Viajes',
    subtitle: 'Publicacion de rutas, cupos, reglas y estado del viaje.',
    endpoint: '/api/trips',
    columns: [
      'id',
      'conductor_id',
      'origen_zona',
      'destino_zona',
      'fecha_hora',
      'cupos_disponibles',
      'notas_reglas',
      'estado',
      'created_at',
    ],
    fields: [
      { key: 'conductor_id', label: 'Conductor', kind: 'select', relation: 'users' },
      { key: 'origen_zona', label: 'Origen zona' },
      { key: 'destino_zona', label: 'Destino zona' },
      { key: 'fecha_hora', label: 'Fecha y hora', kind: 'datetime-local' },
      { key: 'cupos_disponibles', label: 'Cupos disponibles', kind: 'number' },
      { key: 'notas_reglas', label: 'Notas y reglas', kind: 'textarea' },
      { key: 'estado', label: 'Estado', kind: 'select', options: ['abierto', 'completo', 'cancelado', 'finalizado'] },
    ],
  },
  requests: {
    key: 'requests',
    title: 'Solicitudes',
    subtitle: 'Solicitudes de cupo realizadas por pasajeros.',
    endpoint: '/api/requests',
    columns: ['id', 'viaje_id', 'pasajero_id', 'estado', 'fecha_solicitud'],
    fields: [
      { key: 'viaje_id', label: 'Viaje', kind: 'select', relation: 'trips' },
      { key: 'pasajero_id', label: 'Pasajero', kind: 'select', relation: 'users' },
      { key: 'estado', label: 'Estado', kind: 'select', options: ['pendiente', 'aceptada', 'rechazada'] },
    ],
  },
  ratings: {
    key: 'ratings',
    title: 'Calificaciones',
    subtitle: 'Evaluaciones entre usuarios despues de un viaje.',
    endpoint: '/api/ratings',
    columns: ['id', 'viaje_id', 'calificador_id', 'calificado_id', 'puntuacion', 'comentario', 'created_at'],
    fields: [
      { key: 'viaje_id', label: 'Viaje', kind: 'select', relation: 'trips' },
      { key: 'calificador_id', label: 'Calificador', kind: 'select', relation: 'users' },
      { key: 'calificado_id', label: 'Calificado', kind: 'select', relation: 'users' },
      { key: 'puntuacion', label: 'Puntuacion', kind: 'number' },
      { key: 'comentario', label: 'Comentario', kind: 'textarea' },
    ],
  },
  reports: {
    key: 'reports',
    title: 'Reportes',
    subtitle: 'Incidentes reportados, evidencia, estado y accion tomada.',
    endpoint: '/api/reports',
    columns: [
      'id',
      'reportante_id',
      'reportado_id',
      'viaje_id',
      'motivo',
      'evidencia_url',
      'estado',
      'accion_tomada',
      'created_at',
    ],
    fields: [
      { key: 'reportante_id', label: 'Reportante', kind: 'select', relation: 'users' },
      { key: 'reportado_id', label: 'Reportado', kind: 'select', relation: 'users' },
      { key: 'viaje_id', label: 'Viaje', kind: 'select', relation: 'trips' },
      { key: 'motivo', label: 'Motivo', kind: 'textarea' },
      { key: 'evidencia_url', label: 'Evidencia URL' },
      { key: 'estado', label: 'Estado', kind: 'select', options: ['pendiente', 'revisado', 'resuelto'] },
      { key: 'accion_tomada', label: 'Accion tomada', kind: 'textarea' },
    ],
  },
  audit_logs: {
    key: 'audit_logs',
    title: 'Auditoria',
    subtitle: 'Trazabilidad de acciones importantes dentro del sistema.',
    endpoint: '/api/audit_logs',
    columns: ['id', 'usuario_id', 'accion', 'detalles', 'fecha_hora'],
    fields: [
      { key: 'usuario_id', label: 'Usuario', kind: 'select', relation: 'users' },
      { key: 'accion', label: 'Accion' },
      { key: 'detalles', label: 'Detalles', kind: 'textarea' },
      { key: 'fecha_hora', label: 'Fecha y hora', kind: 'datetime-local' },
    ],
  },
}

const viewLabels: Record<ViewKey, string> = {
  dashboard: 'Resumen',
  users: 'Usuarios',
  trips: 'Viajes',
  requests: 'Solicitudes',
  ratings: 'Calificaciones',
  reports: 'Reportes',
  audit_logs: 'Auditoria',
}

const statusTone: Record<string, StatusTone> = {
  activo: 'ok',
  estudiante: 'ok',
  admin: 'info',
  publicado: 'ok',
  abierto: 'ok',
  aceptada: 'ok',
  finalizado: 'ok',
  resuelto: 'ok',
  revisado: 'info',
  advertido: 'warning',
  completo: 'info',
  pendiente: 'warning',
  'en revision': 'info',
  'en curso': 'info',
  suspendido: 'danger',
  rechazada: 'danger',
  cancelada: 'danger',
  cancelado: 'danger',
}

const managedViews: ViewKey[] = ['users', 'trips', 'requests', 'ratings', 'reports', 'audit_logs']

function normalizeRows(payload: unknown): EntityRow[] {
  if (Array.isArray(payload)) return payload.map(normalizeBackendRow)
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: EntityRow[] }).data.map(normalizeBackendRow)
  }
  return []
}

function normalizeBackendRow(row: EntityRow): EntityRow {
  return {
    ...row,
    conductor_id: row.conductor_id ?? row.conductorId,
    viaje_id: row.viaje_id ?? row.viajeId,
    pasajero_id: row.pasajero_id ?? row.pasajeroId,
    calificador_id: row.calificador_id ?? row.calificadorId,
    calificado_id: row.calificado_id ?? row.calificadoId,
    reportante_id: row.reportante_id ?? row.reportanteId,
    reportado_id: row.reportado_id ?? row.reportadoId,
    usuario_id: row.usuario_id ?? row.usuarioId,
    fecha_solicitud: row.fecha_solicitud ?? row.fechaSolicitud,
    fecha_hora: row.fecha_hora ?? row.fechaHora,
  }
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

function getUserName(users: EntityRow[], id: string | number | null | undefined) {
  const user = users.find((item) => String(item.id) === String(id))
  return user?.nombre ? String(user.nombre) : String(id ?? '')
}

function getTripRoute(trips: EntityRow[], id: string | number | null | undefined) {
  const trip = trips.find((item) => String(item.id) === String(id))
  if (!trip) return String(id ?? '')
  return `${trip.origen_zona ?? ''} -> ${trip.destino_zona ?? ''}`
}

function getRelationLabel(relation: FieldConfig['relation'], rows: EntityRow[], value: string | number | null | undefined) {
  if (relation === 'users') return getUserName(rows, value)
  if (relation === 'trips') return getTripRoute(rows, value)
  return String(value ?? '')
}

function Badge({ children, tone = 'neutral' }: { children: string; tone?: StatusTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}

function DashboardView({ data }: { data: Record<ViewKey, EntityState> }) {
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
                  <strong>{trip.origen_zona} {'->'} {trip.destino_zona}</strong>
                  <span>{getUserName(users, trip.conductor_id)} - {trip.cupos_disponibles ?? 0} cupos</span>
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
                    <strong>{getUserName(users, report.reportante_id)} reporta a {getUserName(users, report.reportado_id)}</strong>
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

function EntityView({
  config,
  state,
  data,
  search,
  onCreated,
}: {
  config: EntityConfig
  state: EntityState
  data: Record<ViewKey, EntityState>
  search: string
  onCreated: () => void
}) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return state.rows
    return state.rows.filter((row) =>
      config.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(term)),
    )
  }, [config.columns, search, state.rows])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')

    try {
      await requestJson(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setFormData({})
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="view-stack">
      <section className="section-head">
        <div>
          <p className="eyebrow">Modulo</p>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <Badge tone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}>
          {state.error ? 'sin conexion' : state.loading ? 'cargando' : 'backend'}
        </Badge>
      </section>

      <section className="entity-layout">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-title">
            <h2>Formulario</h2>
            <Badge tone="neutral">{config.key}</Badge>
          </div>
          <div className="form-grid">
            {config.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                data={data}
                value={formData[field.key] ?? ''}
                onChange={(value) => setFormData((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </form>

        <div className="panel content-panel">
          <div className="panel-title">
            <h2>Registros</h2>
            <Badge tone="neutral">{String(filteredRows.length)}</Badge>
          </div>
          {state.loading && <EmptyState title="Cargando datos" message={`Consultando ${config.endpoint}.`} />}
          {state.error && <EmptyState title="No se pudo conectar" message={`Revisa que el backend exponga ${config.endpoint}. Error: ${state.error}`} />}
          {!state.loading && !state.error && !filteredRows.length && (
            <EmptyState title="Sin registros" message="El backend respondio correctamente, pero no envio datos para esta entidad." />
          )}
          {!state.loading && !state.error && Boolean(filteredRows.length) && (
            <Table columns={config.columns} rows={filteredRows} config={config} data={data} />
          )}
        </div>
      </section>
    </div>
  )
}

function Field({
  field,
  data,
  value,
  onChange,
}: {
  field: FieldConfig
  data: Record<ViewKey, EntityState>
  value: string
  onChange: (value: string) => void
}) {
  const relationRows = field.relation ? data[field.relation].rows : []
  const options = field.relation ? relationRows.map((row) => ({
    value: String(row.id ?? ''),
    label: getRelationLabel(field.relation, relationRows, row.id),
  })) : field.options?.map((option) => ({ value: option, label: option })) ?? []

  return (
    <label className="field">
      <span>{field.label}</span>
      {field.kind === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : field.kind === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.kind === 'number' || field.kind === 'datetime-local' ? field.kind : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

function Table({
  columns,
  rows,
  config,
  data,
}: {
  columns: string[]
  rows: EntityRow[]
  config: EntityConfig
  data: Record<ViewKey, EntityState>
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id ?? JSON.stringify(row))}>
              {columns.map((column) => {
                const field = config.fields.find((item) => item.key === column)
                return <td key={column}>{renderCell(row[column], field, data)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderCell(value: EntityRow[string], field: FieldConfig | undefined, data: Record<ViewKey, EntityState>): ReactNode {
  const text = String(value ?? '')

  if (field?.relation) {
    return getRelationLabel(field.relation, data[field.relation].rows, value)
  }

  if (field?.key === 'estado' || field?.key === 'rol') {
    return <Badge tone={statusTone[text] ?? 'neutral'}>{text}</Badge>
  }

  if (field?.key === 'password_hash' && text) {
    return <code className="hash-cell">{text}</code>
  }

  return text
}

function AuthView({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateField = (key: string, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (mode === 'login') {
        const session = await requestJson<AuthSession>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            correo_institucional: formData.correo_institucional,
            password: formData.password,
          }),
        })
        localStorage.setItem('uride-session', JSON.stringify(session))
        onAuthenticated(session)
      } else {
        await requestJson<{ message: string }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            correo_institucional: formData.correo_institucional,
            password: formData.password,
            nombre: formData.nombre,
            carrera: formData.carrera,
            zona_barrio: formData.zona_barrio,
            telefono: formData.telefono || undefined,
          }),
        })
        setMessage('Cuenta creada. Ahora puedes iniciar sesion.')
        setMode('login')
        setFormData({
          correo_institucional: formData.correo_institucional,
          password: '',
        })
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand auth-brand">
          <span>UR</span>
          <div>
            <strong>U-Ride</strong>
            <small>Comunidad estudiantil verificada</small>
          </div>
        </div>
        <div>
          <p className="eyebrow">Transporte compartido</p>
          <h1>Coordina viajes seguros desde una sola interfaz.</h1>
          <p className="hero-copy">
            Acceso institucional, gestion de rutas, solicitudes, reputacion y reportes con una experiencia clara para web y movil.
          </p>
        </div>
        <div className="auth-highlights">
          <span>Correo institucional</span>
          <span>Roles y trazabilidad</span>
          <span>Reputacion comunitaria</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Autenticacion">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Registro
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <h2>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h2>
            <p>{mode === 'login' ? 'Usa tu correo institucional registrado.' : 'Registra tu perfil basico de estudiante.'}</p>
          </div>

          <label className="field">
            <span>Correo institucional</span>
            <input
              type="email"
              required
              value={formData.correo_institucional ?? ''}
              onChange={(event) => updateField('correo_institucional', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Contrasena</span>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password ?? ''}
              onChange={(event) => updateField('password', event.target.value)}
            />
          </label>

          {mode === 'register' && (
            <>
              <label className="field">
                <span>Nombre completo</span>
                <input
                  required
                  value={formData.nombre ?? ''}
                  onChange={(event) => updateField('nombre', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Carrera</span>
                <input
                  required
                  value={formData.carrera ?? ''}
                  onChange={(event) => updateField('carrera', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Zona o barrio</span>
                <input
                  required
                  value={formData.zona_barrio ?? ''}
                  onChange={(event) => updateField('zona_barrio', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Telefono</span>
                <input
                  value={formData.telefono ?? ''}
                  onChange={(event) => updateField('telefono', event.target.value)}
                />
              </label>
            </>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
        </form>
      </section>
    </main>
  )
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
  const [data, setData] = useState<Record<ViewKey, EntityState>>({
    dashboard: { rows: [], loading: false, error: '' },
    users: initialEntityState,
    trips: initialEntityState,
    requests: initialEntityState,
    ratings: initialEntityState,
    reports: initialEntityState,
    audit_logs: initialEntityState,
  })

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
          managedViews.forEach((key) => {
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

      await Promise.all(managedViews.map(async (key) => {
        const config = entityConfigs[key]
        setData((current) => ({
          ...current,
          [key]: { ...current[key], loading: true, error: '' },
        }))

        try {
          const payload = await requestJson<unknown>(config.endpoint)
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
  }, [refreshToken, session])

  const handleLogout = async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem('uride-session')
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
    : (
      <EntityView
        config={entityConfigs[activeView]}
        state={data[activeView]}
        data={data}
        search={search}
        onCreated={() => setRefreshToken((value) => value + 1)}
      />
    )

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>UR</span>
          <div>
            <strong>U-Ride</strong>
            <small>Gestion de viajes</small>
          </div>
        </div>
        <nav aria-label="Vistas del sistema">
          {(Object.keys(viewLabels) as ViewKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={activeView === key ? 'active' : ''}
              onClick={() => setActiveView(key)}
            >
              <span>{viewLabels[key].slice(0, 2)}</span>
              {viewLabels[key]}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span>Vista actual</span>
            <strong>{viewLabels[activeView]}</strong>
          </div>
          <Badge tone={backendStatus === 'online' ? 'ok' : backendStatus === 'checking' ? 'info' : 'danger'}>
            {backendStatus === 'online' ? 'backend online' : backendStatus === 'checking' ? 'verificando backend' : 'backend offline'}
          </Badge>
          <div className="session-box">
            <span>{session.user.nombre}</span>
            <button type="button" className="secondary" onClick={handleLogout}>Salir</button>
          </div>
          <div className="search-box">
            <input
              aria-label="Buscar"
              placeholder="Buscar por atributo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </header>
        {currentView}
      </section>
    </main>
  )
}

export default App
