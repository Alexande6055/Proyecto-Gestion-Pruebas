import { useState, useMemo, type FormEvent, type ReactNode } from 'react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import type { AuthSession, ViewKey, EntityState, EntityConfig, EntityRow, FieldConfig } from '../../types'
import { normalizeBackendRow } from '../../services'
import { usersService, tripsService, requestsService } from '../../services'
import { statusTone } from '../../constants/entities'
import { getRelatedName, getRelationLabel } from '../../utils/entityHelpers'

interface EntityViewProps {
  config: EntityConfig
  state: EntityState
  data: Record<ViewKey, EntityState>
  search: string
  session: AuthSession
  onCreated: () => void
}

export function EntityView({ config, state, data, search, session, onCreated }: EntityViewProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editingUserId, setEditingUserId] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [detailRow, setDetailRow] = useState<EntityRow | null>(null)

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
    setActionMessage('')

    try {
      const payload = buildPayload(config.key, formData, Boolean(editingUserId))
      const isEditingUser = config.key === 'users' && Boolean(editingUserId)

      if (config.key === 'users') {
        if (isEditingUser) {
          await usersService.update(editingUserId, payload)
        } else {
          await usersService.create(payload)
        }
      } else if (config.key === 'trips') {
        const { tripsService: trips } = await import('../../services')
        if (isEditingUser) {
          // En este caso editingUserId es una variable genérica, no es específica de usuarios
          // Por eso el lógica original no soporta edición de viajes
        } else {
          await trips.create(payload)
        }
      } else if (config.key === 'requests') {
        const { requestsService: requests } = await import('../../services')
        await requests.create(payload)
      } else if (config.key === 'ratings') {
        const { ratingsService: ratings } = await import('../../services')
        await ratings.create(payload)
      } else if (config.key === 'reports') {
        const { reportsService: reports } = await import('../../services')
        await reports.create(payload)
      }

      setFormData({})
      setEditingUserId('')
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = (row: EntityRow) => {
    setEditingUserId(String(row.id ?? ''))
    setDetailRow(null)
    setActionMessage('')
    setSaveError('')
    setFormData({
      correo_institucional: String(row.correo_institucional ?? ''),
      password: '',
      nombre: String(row.nombre ?? ''),
      carrera: String(row.carrera ?? ''),
      foto_url: String(row.foto_url ?? ''),
      telefono: String(row.telefono ?? ''),
      zona_barrio: String(row.zona_barrio ?? ''),
      estado: String(row.estado ?? ''),
    })
  }

  const handleResetPassword = async (row: EntityRow) => {
    const newPassword = window.prompt(`Nueva contrasena para ${row.nombre ?? row.correo_institucional ?? 'usuario'}`)
    if (!newPassword) return

    setActionMessage('')
    setSaveError('')

    try {
      await usersService.resetPassword(row.id as string | number, newPassword)
      setActionMessage('Contrasena actualizada correctamente.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo actualizar la contrasena')
    }
  }

  const handleViewTrip = async (row: EntityRow) => {
    setActionMessage('')
    setSaveError('')

    try {
      const detail = await tripsService.getById(row.id as string | number)
      setDetailRow(normalizeBackendRow(detail))
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo consultar el viaje')
    }
  }

  const handleCompleteTrip = async (row: EntityRow) => {
    if (!window.confirm('Finalizar este viaje?')) return

    setActionMessage('')
    setSaveError('')

    try {
      await tripsService.complete(row.id as string | number)
      setActionMessage('Viaje finalizado correctamente.')
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo finalizar el viaje')
    }
  }

  const handleRequestStatus = async (row: EntityRow, estado: 'aceptada' | 'rechazada') => {
    setActionMessage('')
    setSaveError('')

    const trip = data.trips.rows.find((item) => String(item.id) === String(row.viaje_id))

    try {
      const conductorId = trip?.conductor_id ?? session.user.id
      // Asegurar que conductor_id es un tipo válido
      const validConductorId = typeof conductorId === 'string' || typeof conductorId === 'number' || typeof conductorId === 'boolean'
        ? conductorId
        : String(conductorId)

      await requestsService.updateStatus(row.id as string | number, {
        conductor_id: validConductorId,
        estado,
      })
      setActionMessage(`Solicitud ${estado}.`)
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud')
    }
  }

  const cancelEdit = () => {
    setEditingUserId('')
    setFormData({})
    setSaveError('')
  }

  const formTitle = editingUserId ? 'Editar usuario' : 'Formulario'

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
            <h2>{formTitle}</h2>
            <Badge tone="neutral">{editingUserId ? 'edicion' : config.key}</Badge>
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
          {actionMessage && <p className="form-success">{actionMessage}</p>}
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingUserId ? 'Actualizar' : 'Guardar'}</button>
          {editingUserId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancelar edicion
            </button>
          )}
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
            <Table
              columns={config.columns}
              rows={filteredRows}
              config={config}
              data={data}
              onEditUser={handleEditUser}
              onResetPassword={handleResetPassword}
              onViewTrip={handleViewTrip}
              onCompleteTrip={handleCompleteTrip}
              onRequestStatus={handleRequestStatus}
            />
          )}
        </div>
      </section>

      {detailRow && (
        <section className="panel detail-panel">
          <div className="panel-title">
            <h2>Detalle de viaje</h2>
            <button type="button" className="secondary" onClick={() => setDetailRow(null)}>
              Cerrar
            </button>
          </div>
          <div className="detail-grid">
            {Object.entries(detailRow).map(([key, value]) => (
              <div key={key} className="compact-row">
                <strong>{key}</strong>
                <span>{formatCellText(value)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
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
    label: getRelationLabel(field.relation, relationRows, row.id as string | number | null | undefined),
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
  onEditUser,
  onResetPassword,
  onViewTrip,
  onCompleteTrip,
  onRequestStatus,
}: {
  columns: string[]
  rows: EntityRow[]
  config: EntityConfig
  data: Record<ViewKey, EntityState>
  onEditUser: (row: EntityRow) => void
  onResetPassword: (row: EntityRow) => void
  onViewTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
  onRequestStatus: (row: EntityRow, estado: 'aceptada' | 'rechazada') => void
}) {
  const showActions = ['users', 'trips', 'requests'].includes(config.key)

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {showActions && <th>acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id ?? JSON.stringify(row))}>
              {columns.map((column) => {
                const field = config.fields.find((item) => item.key === column)
                return <td key={column}>{renderCell(row, column, field, data)}</td>
              })}
              {showActions && (
                <td>
                  <RowActions
                    config={config}
                    row={row}
                    onEditUser={onEditUser}
                    onResetPassword={onResetPassword}
                    onViewTrip={onViewTrip}
                    onCompleteTrip={onCompleteTrip}
                    onRequestStatus={onRequestStatus}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowActions({
  config,
  row,
  onEditUser,
  onResetPassword,
  onViewTrip,
  onCompleteTrip,
  onRequestStatus,
}: {
  config: EntityConfig
  row: EntityRow
  onEditUser: (row: EntityRow) => void
  onResetPassword: (row: EntityRow) => void
  onViewTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
  onRequestStatus: (row: EntityRow, estado: 'aceptada' | 'rechazada') => void
}) {
  if (config.key === 'users') {
    return (
      <div className="row-actions">
        <button type="button" className="secondary" onClick={() => onEditUser(row)}>Editar</button>
        <button type="button" className="secondary" onClick={() => onResetPassword(row)}>Clave</button>
      </div>
    )
  }

  if (config.key === 'trips') {
    const canComplete = ['abierto', 'completo'].includes(String(row.estado))

    return (
      <div className="row-actions">
        <button type="button" className="secondary" onClick={() => onViewTrip(row)}>Detalle</button>
        {canComplete && <button type="button" className="secondary" onClick={() => onCompleteTrip(row)}>Finalizar</button>}
      </div>
    )
  }

  if (config.key === 'requests' && row.estado === 'pendiente') {
    return (
      <div className="row-actions">
        <button type="button" className="secondary" onClick={() => onRequestStatus(row, 'aceptada')}>Aceptar</button>
        <button type="button" className="secondary" onClick={() => onRequestStatus(row, 'rechazada')}>Rechazar</button>
      </div>
    )
  }

  return <span className="muted-text">Sin acciones</span>
}

function renderCell(row: EntityRow, column: string, field: FieldConfig | undefined, data: Record<ViewKey, EntityState>): ReactNode {
  const value = row[column]
  const text = String(value ?? '')

  if (field?.relation) {
    const relationKey = column.endsWith('_id') ? column.replace('_id', '') : ''
    const relatedName = relationKey ? getRelatedName(row, relationKey, value as string | number | null | undefined) : ''
    if (relatedName && relatedName !== text) return relatedName

    return getRelationLabel(field.relation, data[field.relation].rows, value as string | number | null | undefined)
  }

  if (field?.key === 'estado' || field?.key === 'rol') {
    return <Badge tone={statusTone[text] ?? 'neutral'}>{text}</Badge>
  }

  if (field?.key === 'password_hash' && text) {
    return <code className="hash-cell">{text}</code>
  }

  return text
}

function buildPayload(key: ViewKey, formData: Record<string, string>, editingUser: boolean) {
  const payload = Object.fromEntries(
    Object.entries(formData)
      .map(([fieldKey, value]) => [fieldKey, value.trim()])
      .filter(([, value]) => value),
  ) as Record<string, string | number>

  if (key === 'users') {
    if (editingUser) {
      delete payload.correo_institucional
      delete payload.password
      return payload
    }

    delete payload.estado
    return payload
  }

  if (key === 'trips') {
    if (payload.cupos_disponibles) payload.cupos_disponibles = Number(payload.cupos_disponibles)
    return payload
  }

  if (key === 'ratings') {
    return {
      viajeId: payload.viaje_id,
      calificadoId: payload.calificado_id,
      puntuacion: Number(payload.puntuacion),
      comentario: payload.comentario,
    }
  }

  return payload
}

function formatCellText(value: EntityRow[string]) {
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}
