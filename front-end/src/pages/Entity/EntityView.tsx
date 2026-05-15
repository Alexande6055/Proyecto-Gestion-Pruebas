import { useState, useMemo, type FormEvent, type ReactNode } from 'react'
import { 
  BadgeCheck, 
  AlertCircle, 
  Loader2, 
  Save, 
  X, 
  Pencil, 
  KeyRound, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Search,
  Database,
  FileText,
  ChevronDown,
  Trash2,
  Plus
} from 'lucide-react'
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
    const newPassword = window.prompt(`Nueva contraseña para ${row.nombre ?? row.correo_institucional ?? 'usuario'}`)
    if (!newPassword) return

    setActionMessage('')
    setSaveError('')

    try {
      await usersService.resetPassword(row.id as string | number, newPassword)
      setActionMessage('Contraseña actualizada correctamente.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña')
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
    if (!window.confirm('¿Finalizar este viaje?')) return

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

  const formTitle = editingUserId ? 'Editar usuario' : 'Crear nuevo registro'

  // Determinar icono según la entidad
  const getEntityIcon = () => {
    switch (config.key) {
      case 'users': return <BadgeCheck className="w-5 h-5 text-uride-600" />
      case 'trips': return <Database className="w-5 h-5 text-blue-600" />
      case 'requests': return <FileText className="w-5 h-5 text-amber-600" />
      case 'ratings': return <BadgeCheck className="w-5 h-5 text-yellow-600" />
      case 'reports': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Database className="w-5 h-5 text-night-500" />
    }
  }

  return (
    <div className="min-h-screen bg-night-50 pb-12">
      {/* HEADER */}
      <header className="bg-white border-b border-night-200 px-6 sm:px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-uride-xs bg-gradient-to-br from-uride-50 to-uride-100 flex items-center justify-center shadow-night">
                {getEntityIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-uride-600 uppercase tracking-widest">Módulo</span>
                  <Badge tone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}>
                    {state.error ? 'sin conexión' : state.loading ? 'cargando' : 'conectado'}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-night-900 tracking-tight">{config.title}</h1>
                <p className="text-sm text-night-500 mt-0.5">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-night-400 bg-night-50 px-4 py-2 rounded-uride-xs">
              <Database className="w-3.5 h-3.5" />
              <span className="font-mono">{config.endpoint}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* MESSAGES */}
        {(actionMessage || saveError) && (
          <div className="mb-6 space-y-3">
            {actionMessage && (
              <div className="alert-uride-info flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-info-700 flex-shrink-0" />
                <span className="font-medium">{actionMessage}</span>
              </div>
            )}
            {saveError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-900 text-sm font-medium">{saveError}</span>
              </div>
            )}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FORM PANEL */}
          <div className="xl:col-span-4">
            <div className="card-uride sticky top-24">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                    {editingUserId ? <Pencil className="w-4 h-4 text-uride-600" /> : <Plus className="w-4 h-4 text-uride-600" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">{formTitle}</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">{editingUserId ? 'Modo edición' : 'Nuevo registro'}</p>
                  </div>
                </div>
                <Badge tone="neutral">{config.key}</Badge>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-4">
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

                <div className="pt-2 flex gap-3">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn-uride-primary flex-1 text-sm py-2.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingUserId ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                  {editingUserId && (
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="btn-uride-ghost"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="xl:col-span-8">
            <div className="card-uride">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-night-100 to-night-200 flex items-center justify-center">
                    <Search className="w-4 h-4 text-night-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">Registros</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">
                      {filteredRows.length} de {state.rows.length} registros
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-night-400">Filtrados:</span>
                  <Badge tone="neutral">{String(filteredRows.length)}</Badge>
                </div>
              </div>

              <div className="p-2">
                {state.loading && (
                  <div className="p-12">
                    <EmptyState 
                      title="Cargando datos" 
                      message={`Consultando ${config.endpoint}...`}
                      icon={Loader2}
                    />
                  </div>
                )}
                {state.error && (
                  <div className="p-8">
                    <EmptyState 
                      title="No se pudo conectar" 
                      message={`Revisa que el backend exponga ${config.endpoint}. Error: ${state.error}`}
                      icon={AlertCircle }
                    />
                  </div>
                )}
                {!state.loading && !state.error && !filteredRows.length && (
                  <div className="p-8">
                    <EmptyState 
                      title="Sin registros" 
                      message="El backend respondió correctamente, pero no envió datos para esta entidad."
                    />
                  </div>
                )}
                {!state.loading && !state.error && Boolean(filteredRows.length) && (
                  <div className="overflow-x-auto">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night-900/40 backdrop-blur-sm">
          <div className="card-uride w-full max-w-2xl max-h-[80vh] overflow-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-night-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-night-900">Detalle de viaje</h2>
                  <p className="text-[10px] text-night-400 uppercase tracking-wider">ID: {String(detailRow.id ?? 'N/A')}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setDetailRow(null)}
                className="p-2 rounded-uride-xs hover:bg-night-100 transition-colors"
              >
                <X className="w-5 h-5 text-night-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(detailRow).map(([key, value]) => (
                  <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                    <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
    <div className="space-y-1.5">
      <label className="label-uride">{field.label}</label>
      {field.kind === 'textarea' ? (
        <textarea 
          value={value} 
          onChange={(event) => onChange(event.target.value)}
          className="input-uride min-h-[80px] resize-y"
          placeholder={`Ingresa ${field.label.toLowerCase()}`}
        />
      ) : field.kind === 'select' ? (
        <div className="relative">
          <select 
            value={value} 
            onChange={(event) => onChange(event.target.value)}
            className="input-uride appearance-none pr-10"
          >
            <option value="">Seleccionar {field.label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400 pointer-events-none" />
        </div>
      ) : (
        <input
          type={field.kind === 'number' || field.kind === 'datetime-local' ? field.kind : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-uride"
          placeholder={`Ingresa ${field.label.toLowerCase()}`}
        />
      )}
    </div>
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
    <table className="w-full">
      <thead>
        <tr className="border-b border-night-100">
          {columns.map((column) => (
            <th 
              key={column} 
              className="text-left px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider"
            >
              {column}
            </th>
          ))}
          {showActions && (
            <th className="text-right px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider">
              acciones
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-night-100">
        {rows.map((row, index) => (
          <tr 
            key={String(row.id ?? JSON.stringify(row))}
            className="hover:bg-uride-50/30 transition-colors duration-150"
          >
            {columns.map((column) => {
              const field = config.fields.find((item) => item.key === column)
              return (
                <td key={column} className="px-4 py-3">
                  {renderCell(row, column, field, data)}
                </td>
              )
            })}
            {showActions && (
              <td className="px-4 py-3">
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
      <div className="flex items-center justify-end gap-2">
        <button 
          type="button" 
          onClick={() => onEditUser(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-uride-600 bg-uride-50 rounded-uride-xs hover:bg-uride-100 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Editar
        </button>
        <button 
          type="button" 
          onClick={() => onResetPassword(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-night-600 bg-night-50 rounded-uride-xs hover:bg-night-100 transition-colors"
        >
          <KeyRound className="w-3 h-3" />
          Clave
        </button>
      </div>
    )
  }

  if (config.key === 'trips') {
    const canComplete = ['abierto', 'completo'].includes(String(row.estado))

    return (
      <div className="flex items-center justify-end gap-2">
        <button 
          type="button" 
          onClick={() => onViewTrip(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-uride-xs hover:bg-blue-100 transition-colors"
        >
          <Eye className="w-3 h-3" />
          Detalle
        </button>
        {canComplete && (
          <button 
            type="button" 
            onClick={() => onCompleteTrip(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-uride-600 bg-uride-50 rounded-uride-xs hover:bg-uride-100 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            Finalizar
          </button>
        )}
      </div>
    )
  }

  if (config.key === 'requests' && row.estado === 'pendiente') {
    return (
      <div className="flex items-center justify-end gap-2">
        <button 
          type="button" 
          onClick={() => onRequestStatus(row, 'aceptada')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-uride-600 bg-uride-50 rounded-uride-xs hover:bg-uride-100 transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" />
          Aceptar
        </button>
        <button 
          type="button" 
          onClick={() => onRequestStatus(row, 'rechazada')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-uride-xs hover:bg-red-100 transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Rechazar
        </button>
      </div>
    )
  }

  return (
    <span className="text-xs text-night-400 italic text-right block">Sin acciones</span>
  )
}

function renderCell(row: EntityRow, column: string, field: FieldConfig | undefined, data: Record<ViewKey, EntityState>): ReactNode {
  const value = row[column]
  const text = String(value ?? '')

  if (field?.relation) {
    const relationKey = column.endsWith('_id') ? column.replace('_id', '') : ''
    const relatedName = relationKey ? getRelatedName(row, relationKey, value as string | number | null | undefined) : ''
    if (relatedName && relatedName !== text) return (
      <span className="text-sm font-medium text-night-700">{relatedName}</span>
    )

    return (
      <span className="text-sm font-medium text-night-700">
        {getRelationLabel(field.relation, data[field.relation].rows, value as string | number | null | undefined)}
      </span>
    )
  }

  if (field?.key === 'estado' || field?.key === 'rol') {
    return <Badge tone={statusTone[text] ?? 'neutral'}>{text}</Badge>
  }

  if (field?.key === 'password_hash' && text) {
    return (
      <code className="text-xs font-mono bg-night-100 text-night-600 px-2 py-1 rounded">
        {text.substring(0, 12)}...
      </code>
    )
  }

  return <span className="text-sm text-night-700">{text}</span>
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