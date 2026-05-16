import { useMemo, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Eye,
  CheckCircle2,
  Search,
  Database,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  Clock,
  UserPlus,
  XCircle,
  Check,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { EntityHeader } from '../../components/page/EntityHeader'
import { EntityField } from '../../components/page/EntityField'
import { EntityTable } from '../../components/page/EntityTable'
import { EntityDetailModal } from '../../components/page/EntityDetailModal'
import type { AuthSession, EntityState, EntityRow, ViewKey } from '../../types'
import { normalizeBackendRow } from '../../services'
import { tripsService, requestsService } from '../../services'
import { statusTone } from '../../constants/entities'
import { tripSchema, type TripFormData } from '../../schemas/tripSchema'
import { useState } from 'react'

interface TripsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
}

const config = {
  key: 'trips' as const,
  title: 'Viajes',
  subtitle: 'Publicacion de rutas, cupos, reglas y estado del viaje.',
  endpoint: '/trips',
  columns: [
    'id',
    'conductor_id',
    'origen_zona',
    'destino_zona',
    'fecha_hora',
    'cupos_disponibles',
    'notas_reglas',
    'estado',
  ],
  fields: [
    { key: 'origen_zona', label: 'Origen zona' },
    { key: 'destino_zona', label: 'Destino zona' },
    { key: 'fecha_hora', label: 'Fecha y hora', kind: 'datetime-local' as const },
    { key: 'cupos_disponibles', label: 'Cupos disponibles', kind: 'number' as const },
    { key: 'notas_reglas', label: 'Notas y reglas', kind: 'textarea' as const },
  ],
}

export function TripsView({ state, data, session, onCreated }: TripsViewProps) {
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [detailRow, setDetailRow] = useState<EntityRow | null>(null)
  const [requests, setRequests] = useState<EntityRow[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  })

  const filteredRows = useMemo(() => {
    return state.rows
  }, [state.rows])

  const onFormSubmit = async (formData: TripFormData) => {
    setSaving(true)

    try {
      if (editingId) {
        await tripsService.update(editingId, formData)
        toast.success('Viaje actualizado correctamente.')
      } else {
        await tripsService.create(formData)
        toast.success('Viaje creado correctamente.')
      }
      reset()
      setEditingId(null)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTrip = (row: EntityRow) => {
    setEditingId(row.id as string | number)
    config.fields.forEach(field => {
        let value = row[field.key];
        if (field.key === 'fecha_hora' && value) {
            value = new Date(String(value)).toISOString().slice(0, 16);
        }
        setValue(field.key as keyof TripFormData, value as any);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleDeleteTrip = async (row: EntityRow) => {
    if (!window.confirm('¿Estás seguro de eliminar este viaje?')) return

    try {
      await tripsService.delete(row.id as string | number)
      toast.success('Viaje eliminado.')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar')
    }
  }

  const handleViewTrip = async (row: EntityRow) => {
    try {
      const detail = await tripsService.getById(row.id as string | number)
      setDetailRow(normalizeBackendRow(detail))
      
      setLoadingRequests(true)
      const allRequests = await requestsService.getAll();
      if (row.conductor_id === session.user.id || session.user.role === 'admin') {
          setRequests(allRequests.filter(r => r.viaje_id === row.id));
      } else {
          setRequests(allRequests.filter(r => r.viaje_id === row.id && r.pasajero_id === session.user.id));
      }
      setLoadingRequests(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo consultar el viaje')
    }
  }

  const handleStartTrip = async (row: EntityRow) => {
    if (!window.confirm('¿Iniciar este viaje ahora?')) return

    try {
      await tripsService.start(row.id as string | number)
      toast.success('Viaje iniciado. ¡Buen viaje!')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el viaje')
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

  const handleBookTrip = async (row: EntityRow) => {
    if (!window.confirm('¿Solicitar unirse a este viaje?')) return

    try {
      await requestsService.create({ viaje_id: row.id, pasajero_id: session.user.id })
      toast.success('Solicitud enviada.')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud')
    }
  }

  const handleManageRequest = async (requestId: string | number, status: 'aceptada' | 'rechazada') => {
      try {
          await requestsService.updateStatus(requestId, { 
              conductor_id: session.user.id,
              estado: status
          });
          toast.success(`Solicitud ${status}.`);
          if (detailRow) handleViewTrip(detailRow);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo gestionar la solicitud')
      }
  }

  const handleCancelRequest = async (requestId: string | number) => {
      const reason = window.prompt('Motivo de la cancelación:');
      if (reason === null) return;

      try {
          await requestsService.cancel(requestId, reason || 'Cancelado por el usuario');
          toast.success('Reserva cancelada.');
          if (detailRow) handleViewTrip(detailRow);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo cancelar la reserva')
      }
  }

  return (
    <div className="min-h-screen bg-night-50 pb-12">
      <EntityHeader
        icon={<Database className="w-5 h-5 text-blue-600" />}
        title={config.title}
        subtitle={config.subtitle}
        endpoint={config.endpoint}
        statusText={state.error ? 'sin conexión' : state.loading ? 'cargando' : 'conectado'}
        statusTone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4">
            <div className="card-uride sticky top-24">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                    {editingId ? <Edit className="w-4 h-4 text-uride-600" /> : <Plus className="w-4 h-4 text-uride-600" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">{editingId ? 'Editar viaje' : 'Crear nuevo viaje'}</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">{editingId ? 'Modificando' : 'Nuevo registro'}</p>
                  </div>
                </div>
                {editingId && (
                    <button onClick={() => { setEditingId(null); reset(); }} className="text-xs text-red-500 hover:underline">Cancelar</button>
                )}
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    <EntityField
                      key={field.key}
                      field={field}
                      data={data}
                      registration={register(
                        field.key as keyof TripFormData,
                        field.kind === 'number' ? { valueAsNumber: true } : undefined
                        )}
                      error={errors[field.key as keyof TripFormData]?.message}
                    />
                  ))}
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="submit" disabled={saving} className="btn-uride-primary flex-1 text-sm py-2.5">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {editingId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="card-uride">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-night-100 to-night-200 flex items-center justify-center">
                    <Search className="w-4 h-4 text-night-600" />
                  </div>
                  <h2 className="text-base font-bold text-night-900">Registros</h2>
                </div>
              </div>

              <div className="p-2">
                {state.loading && <div className="p-12"><EmptyState title="Cargando" message="Por favor, espere..." icon={Loader2} /></div>}
                {!state.loading && !filteredRows.length && <div className="p-8"><EmptyState title="Sin registros" message="No se encontraron registros que coincidan con la búsqueda." /></div>}
                {!state.loading && Boolean(filteredRows.length) && (
                  <div className="overflow-x-auto">
                    <EntityTable
                      columns={config.columns}
                      columnLabels={Object.fromEntries(config.columns.map((c) => {
                        const found = config.fields.find((f) => f.key === c)
                        return [c, found?.label ?? c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())]
                      }))}
                      rows={filteredRows}
                      renderCell={renderCell}
                      renderActions={(row) => (
                        <TripRowActions
                          row={row}
                          userId={session.user.id}
                          onViewTrip={handleViewTrip}
                          onEditTrip={handleEditTrip}
                          onDeleteTrip={handleDeleteTrip}
                          onStartTrip={handleStartTrip}
                          onCompleteTrip={handleCompleteTrip}
                          onBookTrip={handleBookTrip}
                        />
                      )}
                      showActions
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {detailRow && (
        <EntityDetailModal
          title="Detalle de viaje"
          subtitle={`Estado: ${String(detailRow.estado ?? 'N/A')}`}
          icon={<Eye className="w-4 h-4 text-blue-600" />}
          onClose={() => { setDetailRow(null); setRequests([]); }}
        >
          <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(detailRow).map(([key, value]) => (
                  <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                    <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
                  </div>
                ))}
              </div>

              {(detailRow.conductor_id === session.user.id || session.user.role === 'admin') && (
                  <div className="border-t border-night-100 pt-4">
                      <h3 className="text-sm font-bold text-night-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-uride-600" />Solicitudes de Pasajeros</h3>
                      {loadingRequests ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-uride-600" /> : requests.length === 0 ? <p className="text-xs text-night-400 text-center italic">Sin solicitudes.</p> : (
                          <div className="space-y-2">
                              {requests.map(req => (
                                  <div key={req.id as string} className="flex items-center justify-between p-3 bg-white border border-night-100 rounded-lg">
                                      <div>
                                          <p className="text-sm font-semibold text-night-900">ID Pasajero: {String(req.pasajero_id).slice(0, 8)}</p>
                                          <p className="text-[10px] text-night-400">{new Date(String(req.fecha_solicitud)).toLocaleString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Badge tone={statusTone[String(req.estado)] ?? 'neutral'}>{String(req.estado)}</Badge>
                                          {req.estado === 'pendiente' && (
                                              <>
                                                <button onClick={() => handleManageRequest(req.id as string, 'aceptada')} className="p-1.5 text-green-600 bg-green-50 rounded-md hover:bg-green-100" title="Aceptar"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => handleManageRequest(req.id as string, 'rechazada')} className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100" title="Rechazar"><XCircle className="w-4 h-4" /></button>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {detailRow.conductor_id !== session.user.id && requests.length > 0 && (
                  <div className="border-t border-night-100 pt-4">
                      <h3 className="text-sm font-bold text-night-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-uride-600" />Tu Solicitud</h3>
                      <div className="space-y-2">
                          {requests.map(req => (
                              <div key={req.id as string} className="flex items-center justify-between p-3 bg-white border border-night-100 rounded-lg">
                                  <div>
                                      <p className="text-sm font-semibold text-night-900">Estado: {String(req.estado)}</p>
                                      <p className="text-[10px] text-night-400">Enviada el {new Date(String(req.fecha_solicitud)).toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Badge tone={statusTone[String(req.estado)] ?? 'neutral'}>{String(req.estado)}</Badge>
                                      {(req.estado === 'pendiente' || req.estado === 'aceptada') && (
                                          <button 
                                            onClick={() => handleCancelRequest(req.id as string)} 
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                          >
                                              <XCircle className="w-3.5 h-3.5" />
                                              Cancelar
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
        </EntityDetailModal>
      )}
    </div>
  )
}

function TripRowActions({
  row,
  userId,
  onViewTrip,
  onEditTrip,
  onDeleteTrip,
  onStartTrip,
  onCompleteTrip,
  onBookTrip,
}: {
  row: EntityRow
  userId: string
  onViewTrip: (row: EntityRow) => void
  onEditTrip: (row: EntityRow) => void
  onDeleteTrip: (row: EntityRow) => void
  onStartTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
  onBookTrip: (row: EntityRow) => void
}) {
  const isConductor = row.conductor_id === userId
  const status = String(row.estado)
  
  const canEdit = isConductor && status === 'abierto'
  const canStart = isConductor && (status === 'abierto' || status === 'completo')
  const canComplete = isConductor && status === 'en_curso'
  const canBook = !isConductor && status === 'abierto' && Number(row.cupos_disponibles) > 0

  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={() => onViewTrip(row)} className="p-1.5 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100" title="Detalles"><Eye className="w-4 h-4" /></button>
      {canEdit && (
          <>
            <button type="button" onClick={() => onEditTrip(row)} className="p-1.5 text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100" title="Editar"><Edit className="w-4 h-4" /></button>
            <button type="button" onClick={() => onDeleteTrip(row)} className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
          </>
      )}
      {canStart && <button type="button" onClick={() => onStartTrip(row)} className="p-1.5 text-uride-600 bg-uride-50 rounded-md hover:bg-uride-100" title="Iniciar viaje"><PlayCircle className="w-4 h-4" /></button>}
      {canComplete && <button type="button" onClick={() => onCompleteTrip(row)} className="p-1.5 text-green-600 bg-green-50 rounded-md hover:bg-green-100" title="Finalizar viaje"><CheckCircle2 className="w-4 h-4" /></button>}
      {canBook && (
        <button type="button" onClick={() => onBookTrip(row)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-uride-600 bg-uride-50 rounded-uride-xs hover:bg-uride-100 transition-colors"><UserPlus className="w-3.5 h-3.5" />Reservar</button>
      )}
    </div>
  )
}

function renderCell(row: EntityRow, column: string): ReactNode {
  const value = row[column]
  const text = String(value ?? '')
  if (column === 'estado') {
    const displayStatus = text.replace(/_/g, ' ')
    return <Badge tone={statusTone[displayStatus] ?? statusTone[text] ?? 'neutral'}>{displayStatus}</Badge>
  }
  if (column === 'fecha_hora') return <span className="text-xs text-night-500 font-medium">{new Date(text).toLocaleString()}</span>
  return <span className="text-sm text-night-700">{text}</span>
}

function formatCellText(value: EntityRow[string]) {
  if (value instanceof Date) return value.toLocaleString()
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}

export default TripsView
