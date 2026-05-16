import { useState, useMemo, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
  Plus
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { EntityHeader } from '../../components/page/EntityHeader'
import { EntityField } from '../../components/page/EntityField'
import { EntityTable } from '../../components/page/EntityTable'
import { EntityDetailModal } from '../../components/page/EntityDetailModal'
import type { AuthSession, ViewKey, EntityState, EntityConfig, EntityRow, FieldConfig, PageUi } from '../../types'
import { normalizeBackendRow } from '../../services'
import { usersService, tripsService, requestsService } from '../../services'
import { statusTone } from '../../constants/entities'
import { getRelatedName, getRelationLabel } from '../../utils/entityHelpers'

// Schemas
import { userSchema, type UserFormData } from '../../schemas/userSchema'
import { tripSchema } from '../../schemas/tripSchema'

interface EntityViewProps {
  config: EntityConfig
  state: EntityState
  data: Record<ViewKey, EntityState>
  search: string
  session: AuthSession
  onCreated: () => void
  ui?: PageUi
}

export function EntityView({ config, state, data, search, session, onCreated, ui }: EntityViewProps) {
  const [saving, setSaving] = useState(false)
  const [editingUserId, setEditingUserId] = useState('')
  const [detailRow, setDetailRow] = useState<EntityRow | null>(null)

  // Determine which schema to use
  const schema = useMemo(() => {
    if (config.key === 'users') return userSchema
    if (config.key === 'trips') return tripSchema
    return null
  }, [config.key])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: schema ? zodResolver(schema) : undefined,
  })

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return state.rows
    return state.rows.filter((row) =>
      config.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(term)),
    )
  }, [config.columns, search, state.rows])

  const onFormSubmit = async (formData: any) => {
    setSaving(true)

    try {
      const payload = buildPayload(config.key, formData, Boolean(editingUserId))
      const isEditingUser = config.key === 'users' && Boolean(editingUserId)

      if (config.key === 'users') {
        if (isEditingUser) {
          await usersService.update(editingUserId, payload)
          toast.success('Usuario actualizado correctamente.')
        } else {
          await usersService.create(payload)
          toast.success('Usuario creado correctamente.')
        }
      } else if (config.key === 'trips') {
        if (!isEditingUser) {
          await tripsService.create(payload)
          toast.success('Viaje creado correctamente.')
        }
      } else if (config.key === 'requests') {
        await requestsService.create(payload)
        toast.success('Solicitud creada correctamente.')
      } else if (config.key === 'ratings') {
        await (await import('../../services')).ratingsService.create(payload)
        toast.success('Calificación creada correctamente.')
      } else if (config.key === 'reports') {
        await (await import('../../services')).reportsService.create(payload)
        toast.success('Reporte creado correctamente.')
      }

      reset()
      setEditingUserId('')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = (row: EntityRow) => {
    const userId = String(row.id ?? '')
    setEditingUserId(userId)
    setDetailRow(null)
    
    // Fill form with user data
    const fields: (keyof UserFormData)[] = [
      'correo_institucional',
      'nombre',
      'carrera',
      'foto_url',
      'telefono',
      'zona_barrio',
      'estado'
    ]
    
    fields.forEach(field => {
      setValue(field, String(row[field] ?? ''))
    })
    setValue('password', '') // Clear password field on edit
  }

  const handleResetPassword = async (row: EntityRow) => {
    const newPassword = window.prompt(`Nueva contraseña para ${row.nombre ?? row.correo_institucional ?? 'usuario'}`)
    if (!newPassword) return

    try {
      await usersService.resetPassword(row.id as string | number, newPassword)
      toast.success('Contraseña actualizada correctamente.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña')
    }
  }

  const handleViewTrip = async (row: EntityRow) => {
    try {
      const detail = await tripsService.getById(row.id as string | number)
      setDetailRow(normalizeBackendRow(detail))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo consultar el viaje')
    }
  }

  const handleCompleteTrip = async (row: EntityRow) => {
    if (!window.confirm('¿Finalizar este viaje?')) return

    try {
      await tripsService.complete(row.id as string | number)
      toast.success('Viaje finalizado correctamente.')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo finalizar el viaje')
    }
  }

  const handleRequestStatus = async (row: EntityRow, estado: 'aceptada' | 'rechazada') => {
    const trip = data.trips.rows.find((item) => String(item.id) === String(row.viaje_id))

    try {
      const conductorId = trip?.conductor_id ?? session.user.id
      const validConductorId = typeof conductorId === 'string' || typeof conductorId === 'number' || typeof conductorId === 'boolean'
        ? conductorId
        : String(conductorId)

      await requestsService.updateStatus(row.id as string | number, {
        conductor_id: validConductorId,
        estado,
      })
      toast.success(`Solicitud ${estado}.`)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud')
    }
  }

  const cancelEdit = () => {
    setEditingUserId('')
    reset()
  }

  const formTitle = editingUserId ? 'Editar usuario' : 'Crear nuevo registro'

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
      <EntityHeader
        icon={getEntityIcon()}
        title={ui?.title ?? config.title}
        subtitle={ui?.subtitle ?? config.subtitle}
        endpoint={config.endpoint}
        statusText={state.error ? 'sin conexión' : state.loading ? 'cargando' : 'conectado'}
        statusTone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FORM PANEL */}
          <div className="xl:col-span-4">
            <div className="card-uride sticky top-24">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                    {editingUserId ? <Pencil className="w-4 h-4 text-uride-600" /> : <Plus className="w-4 h-4 text-uride-600" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">{formTitle}</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">{editingUserId ? 'Modo edición' : 'Nuevo registro'}</p>
                  </div>
                </div>
                <Badge tone="neutral">{config.key}</Badge>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    <EntityField
                      key={field.key}
                      field={field}
                      data={data}
                      registration={register(field.key)}
                      error={errors[field.key]?.message as string}
                      placeholder={ui?.fieldPlaceholders?.[field.key]}
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
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-night-100 to-night-200 flex items-center justify-center">
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
                    <EntityTable
                      columns={config.columns}
                      columnLabels={Object.fromEntries(config.columns.map((c) => {
                        const uiLabel = ui?.fieldLabels?.[c]
                        const found = config.fields.find((f) => f.key === c)
                        const label = uiLabel ?? found?.label ?? c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
                        return [c, label]
                      }))}
                      rows={filteredRows}
                      renderCell={(row, column) => renderCell(row, column, config.fields.find((item) => item.key === column), data)}
                      renderActions={(row) => (
                        <RowActions
                          config={config}
                          row={row}
                          onEditUser={handleEditUser}
                          onResetPassword={handleResetPassword}
                          onViewTrip={handleViewTrip}
                          onCompleteTrip={handleCompleteTrip}
                          onRequestStatus={handleRequestStatus}
                        />
                      )}
                      showActions={['users', 'trips', 'requests'].includes(config.key)}
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
        <EntityDetailModal
          title="Detalle de viaje"
          subtitle={`ID: ${String(detailRow.id ?? 'N/A')}`}
          icon={<Eye className="w-4 h-4 text-blue-600" />}
          onClose={() => setDetailRow(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(detailRow).map(([key, value]) => (
              <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
              </div>
            ))}
          </div>
        </EntityDetailModal>
      )}
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

function buildPayload(key: ViewKey, formData: any, editingUser: boolean) {
  const payload = Object.fromEntries(
    Object.entries(formData)
      .map(([fieldKey, value]) => [fieldKey, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined)
  ) as Record<string, any>

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

export default EntityView
