import { useMemo, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  MapPin,
  CalendarDays,
  Users,
  CreditCard,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { ActionModal } from '../../components/common/ActionModal'
import { EntityHeader } from '../../components/page/EntityHeader'
import { EntityField } from '../../components/page/EntityField'
import { EntityDetailModal } from '../../components/page/EntityDetailModal'
import GoogleMapPicker from '../../components/page/GoogleMapPicker'
import type { AuthSession, EntityState, EntityRow, ViewKey } from '../../types'
import { normalizeBackendRow } from '../../services'
import { tripsService, requestsService, payphoneService } from '../../services'
import { getSocket } from '../../services/socket'
import { statusTone } from '../../constants/entities'
import { tripSchema, type TripFormData } from '../../schemas/tripSchema'
import { useState } from 'react'

type TripFilter = 'upcoming' | 'today' | 'tomorrow' | 'mine' | 'booked' | 'history'

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
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTripRow, setDeleteTripRow] = useState<EntityRow | null>(null)
  const [startTripRow, setStartTripRow] = useState<EntityRow | null>(null)
  const [completeTripRow, setCompleteTripRow] = useState<EntityRow | null>(null)
  const [bookTripRow, setBookTripRow] = useState<EntityRow | null>(null)
  const [paymentTripRow, setPaymentTripRow] = useState<EntityRow | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [showPayPhoneModal, setShowPayPhoneModal] = useState(false)
  const [cancelRequestId, setCancelRequestId] = useState<string | number | null>(null)
  const [activeFilter, setActiveFilter] = useState<TripFilter>('upcoming')
  
  // Real-time states
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [etaInfo, setEtaInfo] = useState<{ toPassenger?: { duration: string; distance: string }; toDestination?: { duration: string; distance: string } } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      cupos_disponibles: 4,
    }
  })

  // Capturar ubicación del pasajero si está viendo un detalle
  useEffect(() => {
    if (detailRow && detailRow.conductor_id !== session.user.id && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setPassengerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Error watchPosition passenger:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setPassengerLocation(null);
    }
  }, [detailRow, session]);

  // Socket logic
  useEffect(() => {
    const socket = getSocket(session.user.id, session.access_token);
    if (!socket) return;

    if (detailRow) {
      socket.emit('join_trip', { tripId: detailRow.id });
      
      const handleLocationUpdate = (data: { tripId: string, lat: number, lng: number }) => {
        if (data.tripId === detailRow.id) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      };

      socket.on('trip_location_updated', handleLocationUpdate);

      return () => {
        socket.emit('leave_trip', { tripId: detailRow.id });
        socket.off('trip_location_updated', handleLocationUpdate);
        setDriverLocation(null);
      };
    }
  }, [detailRow, session]);

  // Geolocation logic for drivers
  useEffect(() => {
    const activeTrip = state.rows.find(r => r.conductor_id === session.user.id && r.estado === 'en_curso');
    
    if (activeTrip && navigator.geolocation) {
      const socket = getSocket(session.user.id, session.access_token);
      
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          socket?.emit('update_trip_location', {
            tripId: activeTrip.id,
            lat: latitude,
            lng: longitude
          });
        },
        (err) => console.error('Error watchPosition:', err),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [state.rows, session]);

  // Watch coordinates for the map
  const origin_lat = useWatch({ control, name: 'origen_lat' });
  const origin_lng = useWatch({ control, name: 'origen_lng' });
  const destination_lat = useWatch({ control, name: 'destino_lat' });
  const destination_lng = useWatch({ control, name: 'destino_lng' });

  const currentOrigin = useMemo(() => 
    origin_lat && origin_lng ? { lat: origin_lat, lng: origin_lng } : null
  , [origin_lat, origin_lng]);

  const currentDestination = useMemo(() => 
    destination_lat && destination_lng ? { lat: destination_lat, lng: destination_lng } : null
  , [destination_lat, destination_lng]);

  const userRequestTripIds = useMemo(() => new Set(
    data.requests.rows
      .filter((request) => String(request.pasajero_id) === String(session.user.id))
      .map((request) => String(request.viaje_id)),
  ), [data.requests.rows, session.user.id])

  const sortedRows = useMemo(() => {
    return [...state.rows].sort((a, b) => getTripTime(a) - getTripTime(b))
  }, [state.rows])

  const filterCounts = useMemo(() => ({
    upcoming: sortedRows.filter((row) => isUpcomingTrip(row)).length,
    today: sortedRows.filter((row) => isSameLocalDay(row.fecha_hora, new Date()) && !isHistoryTrip(row)).length,
    tomorrow: sortedRows.filter((row) => isTomorrow(row.fecha_hora) && !isHistoryTrip(row)).length,
    mine: sortedRows.filter((row) => String(row.conductor_id) === String(session.user.id) && !isHistoryTrip(row)).length,
    booked: sortedRows.filter((row) => userRequestTripIds.has(String(row.id)) && !isHistoryTrip(row)).length,
    history: sortedRows.filter((row) => isHistoryTrip(row)).length,
  }), [session.user.id, sortedRows, userRequestTripIds])

  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return sortedRows.filter((row) => isSameLocalDay(row.fecha_hora, new Date()) && !isHistoryTrip(row))
      case 'tomorrow':
        return sortedRows.filter((row) => isTomorrow(row.fecha_hora) && !isHistoryTrip(row))
      case 'mine':
        return sortedRows.filter((row) => String(row.conductor_id) === String(session.user.id) && !isHistoryTrip(row))
      case 'booked':
        return sortedRows.filter((row) => userRequestTripIds.has(String(row.id)) && !isHistoryTrip(row))
      case 'history':
        return sortedRows.filter((row) => isHistoryTrip(row)).reverse()
      default:
        return sortedRows.filter((row) => isUpcomingTrip(row))
    }
  }, [activeFilter, session.user.id, sortedRows, userRequestTripIds])

  const pendingDriverRequests = useMemo(() => {
    return data.requests.rows
      .filter((request) => String(request.estado) === 'pendiente')
      .map((request) => {
        const passengerFromRequest = request.pasajero && typeof request.pasajero === 'object' && !Array.isArray(request.pasajero)
          ? request.pasajero as EntityRow
          : null

        return {
          request,
          trip: data.trips.rows.find((trip) => String(trip.id) === String(request.viaje_id)),
          passenger: passengerFromRequest ?? data.users.rows.find((user) => String(user.id) === String(request.pasajero_id)),
        }
      })
      .filter((item) => item.trip && String(item.trip.conductor_id) === String(session.user.id))
  }, [data.requests.rows, data.trips.rows, data.users.rows, session.user.id])

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
        const fieldKey = field.key as 'origen_zona' | 'destino_zona' | 'fecha_hora' | 'cupos_disponibles' | 'notas_reglas'
        let value = row[field.key];
        if (field.key === 'fecha_hora' && value) {
            value = new Date(String(value)).toISOString().slice(0, 16);
        }
        if (fieldKey === 'cupos_disponibles') {
            setValue(fieldKey, Number(value ?? 1));
        } else {
            setValue(fieldKey, String(value ?? ''));
        }
    });
    
    if (row.origen_lat) setValue('origen_lat', Number(row.origen_lat));
    if (row.origen_lng) setValue('origen_lng', Number(row.origen_lng));
    if (row.destino_lat) setValue('destino_lat', Number(row.destino_lat));
    if (row.destino_lng) setValue('destino_lng', Number(row.destino_lng));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleDeleteTrip = (row: EntityRow) => {
    setDeleteTripRow(row)
  }

  const confirmDeleteTrip = async () => {
    if (!deleteTripRow) return
    setActionLoading(true)
    try {
      await tripsService.delete(deleteTripRow.id as string | number)
      toast.success('Viaje eliminado.')
      setDeleteTripRow(null)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar')
    } finally {
      setActionLoading(false)
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

  const handleStartTrip = (row: EntityRow) => {
    setStartTripRow(row)
  }

  const confirmStartTrip = async () => {
    if (!startTripRow) return
    setActionLoading(true)
    try {
      await tripsService.start(startTripRow.id as string | number)
      toast.success('Viaje iniciado. ¡Buen viaje!')
      setStartTripRow(null)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el viaje')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteTrip = (row: EntityRow) => {
    setCompleteTripRow(row)
  }

  const confirmCompleteTrip = async () => {
    if (!completeTripRow) return
    setActionLoading(true)
    try {
      await tripsService.complete(completeTripRow.id as string | number)
      toast.success('Viaje finalizado correctamente.')
      setCompleteTripRow(null)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo finalizar el viaje')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBookTrip = (row: EntityRow) => {
    setBookTripRow(row)
  }

  const confirmBookTrip = async () => {
    if (!bookTripRow) return
    setActionLoading(true)
    try {
      await requestsService.create({ viaje_id: bookTripRow.id, pasajero_id: session.user.id })
      toast.success('Solicitud enviada.')
      setBookTripRow(null)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayTrip = (row: EntityRow) => {
    setPaymentTripRow(row)
  }

  const confirmPaymentAmount = async (amount: string) => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    
    const tripId = paymentTripRow?.id
    setPaymentAmount(numAmount)
    setPaymentTripRow(null)
    setShowPayPhoneModal(true)
    
    // Pequeño delay para asegurar que el div esté en el DOM
    setTimeout(() => {
      payphoneService.renderButton("pp-button", {
      amount: 115,
      amountWithTax: 100,
      tax: 15,
      clientTransactionId: crypto.randomUUID(),
      reference: "Compra Orden #1001",
    });
    }, 300)
  }

  const handleManageRequest = async (requestId: string | number, status: 'aceptada' | 'rechazada') => {
      try {
          await requestsService.updateStatus(requestId, { 
              conductor_id: session.user.id,
              estado: status
          });
          toast.success(status === 'aceptada'
            ? 'Reserva aceptada. Se desconto un cupo del viaje.'
            : 'Reserva rechazada. El pasajero recibira una notificacion.'
          );
          if (detailRow) handleViewTrip(detailRow);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo gestionar la solicitud')
      }
  }

  const handleCancelRequest = (requestId: string | number) => {
      setCancelRequestId(requestId);
  }

  const confirmCancelRequest = async (reason: string) => {
      if (!cancelRequestId) return;
      setActionLoading(true);
      try {
          await requestsService.cancel(cancelRequestId, reason.trim());
          toast.success('Reserva cancelada.');
          setCancelRequestId(null);
          if (detailRow) handleViewTrip(detailRow);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo cancelar la reserva')
      } finally {
          setActionLoading(false);
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
          <div className="xl:col-span-5">
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

              <div className="p-5">
                <div className="mb-6">
                    <GoogleMapPicker 
                        initialOrigin={currentOrigin}
                        initialDestination={currentDestination}
                        onOriginChange={(loc, addr) => {
                            setValue('origen_lat', loc.lat);
                            setValue('origen_lng', loc.lng);
                            if (addr) setValue('origen_zona', addr);
                        }}
                        onDestinationChange={(loc, addr) => {
                            setValue('destino_lat', loc.lat);
                            setValue('destino_lng', loc.lng);
                            if (addr) setValue('destino_zona', addr);
                        }}
                    />
                    {(errors.origen_lat || errors.destino_lat) && (
                        <p className="mt-2 text-xs text-red-500 font-medium">Debes seleccionar origen y destino en el mapa.</p>
                    )}
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <EntityField
                            field={config.fields[0]} // Origen
                            data={data}
                            registration={register('origen_zona')}
                            error={errors.origen_zona?.message}
                        />
                        <EntityField
                            field={config.fields[1]} // Destino
                            data={data}
                            registration={register('destino_zona')}
                            error={errors.destino_zona?.message}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <EntityField
                            field={config.fields[2]} // Fecha
                            data={data}
                            registration={register('fecha_hora')}
                            error={errors.fecha_hora?.message}
                        />
                        <EntityField
                            field={config.fields[3]} // Cupos
                            data={data}
                            registration={register('cupos_disponibles', { valueAsNumber: true })}
                            error={errors.cupos_disponibles?.message}
                        />
                    </div>
                    <EntityField
                        field={config.fields[4]} // Notas
                        data={data}
                        registration={register('notas_reglas')}
                        error={errors.notas_reglas?.message}
                    />
                    <div className="pt-2 flex gap-3">
                    <button type="submit" disabled={saving} className="btn-uride-primary flex-1 text-sm py-2.5">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {editingId ? 'Actualizar' : 'Guardar'}
                    </button>
                    </div>
                </form>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7">
            {pendingDriverRequests.length > 0 && (
              <div className="card-uride mb-6 border-amber-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-night-900">Reservas pendientes</h2>
                      <p className="text-xs text-night-500">Solicitudes listas para aceptar o rechazar.</p>
                    </div>
                  </div>
                  <Badge tone="warning">{pendingDriverRequests.length}</Badge>
                </div>
                <div className="p-4 space-y-3">
                  {pendingDriverRequests.map(({ request, trip, passenger }) => (
                    <div key={String(request.id)} className="flex flex-col gap-3 rounded-uride-xs border border-amber-100 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-night-900">{String(passenger?.nombre ?? 'Pasajero')}</p>
                        <p className="text-sm text-night-600">{String(trip?.origen_zona ?? 'Origen')} - {String(trip?.destino_zona ?? 'Destino')}</p>
                        <p className="text-xs text-night-400">{formatDateTime(request.fecha_solicitud)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleManageRequest(request.id as string | number, 'aceptada')}
                          className="inline-flex items-center gap-1.5 rounded-uride-xs bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManageRequest(request.id as string | number, 'rechazada')}
                          className="inline-flex items-center gap-1.5 rounded-uride-xs bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-uride">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-night-100 to-night-200 flex items-center justify-center">
                    <Search className="w-4 h-4 text-night-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">Viajes</h2>
                    <p className="text-xs text-night-500">Ordenados por fecha y filtrados por utilidad.</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-night-100 px-4 py-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {([
                    ['upcoming', 'Proximos', filterCounts.upcoming],
                    ['today', 'Hoy', filterCounts.today],
                    ['tomorrow', 'Mañana', filterCounts.tomorrow],
                    ['mine', 'Mis viajes', filterCounts.mine],
                    ['booked', 'Mis reservas', filterCounts.booked],
                    ['history', 'Historial', filterCounts.history],
                  ] satisfies Array<[TripFilter, string, number]>).map(([key, label, count]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFilter(key)}
                      className={`shrink-0 rounded-uride-xs px-3 py-2 text-xs font-bold transition-colors ${
                        activeFilter === key
                          ? 'bg-uride-600 text-white'
                          : 'bg-night-50 text-night-600 hover:bg-night-100'
                      }`}
                    >
                      {label} <span className={activeFilter === key ? 'text-white/80' : 'text-night-400'}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2">
                {state.loading && <div className="p-12"><EmptyState title="Cargando" message="Por favor, espere..." icon={Loader2} /></div>}
                {!state.loading && !filteredRows.length && <div className="p-8"><EmptyState title="Sin registros" message="No se encontraron registros que coincidan con la búsqueda." /></div>}
                {!state.loading && Boolean(filteredRows.length) && (
                  <div className="grid grid-cols-1 gap-3 p-2">
                    {filteredRows.map((row) => (
                      <TripCard
                        key={String(row.id)}
                        row={row}
                        data={data}
                        userId={session.user.id}
                        onViewTrip={handleViewTrip}
                        onEditTrip={handleEditTrip}
                        onDeleteTrip={handleDeleteTrip}
                        onStartTrip={handleStartTrip}
                        onCompleteTrip={handleCompleteTrip}
                        onBookTrip={handleBookTrip}
                        onCancelRequest={handleCancelRequest}
                        onPayTrip={handlePayTrip}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        open={Boolean(deleteTripRow)}
        title="Eliminar viaje"
        description="Esta acción eliminará el viaje seleccionado. Confirma solo si ya no debe aparecer en el sistema."
        icon={<Trash2 className="w-5 h-5 text-red-600" />}
        confirmLabel="Eliminar"
        tone="danger"
        loading={actionLoading}
        onClose={() => setDeleteTripRow(null)}
        onConfirm={confirmDeleteTrip}
      />

      <ActionModal
        open={Boolean(startTripRow)}
        title="Iniciar viaje"
        description="Confirma que deseas iniciar este viaje ahora."
        icon={<PlayCircle className="w-5 h-5 text-uride-600" />}
        confirmLabel="Iniciar"
        loading={actionLoading}
        onClose={() => setStartTripRow(null)}
        onConfirm={confirmStartTrip}
      />

      <ActionModal
        open={Boolean(completeTripRow)}
        title="Finalizar viaje"
        description="Confirma que este viaje ya terminó. Esta acción actualizará su estado."
        icon={<CheckCircle2 className="w-5 h-5 text-uride-600" />}
        confirmLabel="Finalizar"
        loading={actionLoading}
        onClose={() => setCompleteTripRow(null)}
        onConfirm={confirmCompleteTrip}
      />

      <ActionModal
        open={Boolean(bookTripRow)}
        title="Solicitar reserva"
        description="Se enviará una solicitud al conductor para unirte a este viaje."
        icon={<UserPlus className="w-5 h-5 text-uride-600" />}
        confirmLabel="Solicitar"
        loading={actionLoading}
        onClose={() => setBookTripRow(null)}
        onConfirm={confirmBookTrip}
      />

      <ActionModal
        open={Boolean(cancelRequestId)}
        title="Cancelar reserva"
        description="Indica el motivo para cancelar esta reserva. Se actualizará el estado de la solicitud."
        icon={<XCircle className="w-5 h-5 text-red-600" />}
        confirmLabel="Cancelar reserva"
        tone="danger"
        inputLabel="Motivo de cancelación"
        inputPlaceholder="Ej. Ya no necesito el cupo"
        inputType="textarea"
        inputRequired
        loading={actionLoading}
        onClose={() => setCancelRequestId(null)}
        onConfirm={confirmCancelRequest}
      />

      <ActionModal
        open={Boolean(paymentTripRow)}
        title="Realizar pago"
        description="Ingresa el monto a pagar por este viaje."
        icon={<CreditCard className="w-5 h-5 text-uride-600" />}
        confirmLabel="Continuar"
        inputLabel="Monto (USD)"
        inputPlaceholder="0.00"
        inputType="text"
        inputRequired
        onClose={() => setPaymentTripRow(null)}
        onConfirm={confirmPaymentAmount}
      />

      {showPayPhoneModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-night-900/60 backdrop-blur-sm">
          <div className="card-uride w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <CreditCard className="w-12 h-12 text-uride-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-night-900 mb-2">Finalizar Pago</h2>
            <p className="text-sm text-night-500 mb-6">Monto a pagar: <span className="font-bold text-night-900">${paymentAmount.toFixed(2)}</span></p>
            
            <div id="pp-button" className="flex justify-center mb-6 min-h-[50px]">
                <div className="animate-pulse bg-night-100 rounded-lg w-full h-12 flex items-center justify-center text-[10px] text-night-400 uppercase tracking-widest font-bold">Cargando PayPhone...</div>
            </div>

            <button 
              onClick={() => setShowPayPhoneModal(false)}
              className="text-sm text-night-400 hover:text-night-600 underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {detailRow && (
        <EntityDetailModal
          title="Detalle de viaje"
          subtitle={`Estado: ${String(detailRow.estado ?? 'N/A')}`}
          icon={<Eye className="w-4 h-4 text-blue-600" />}
          onClose={() => { setDetailRow(null); setRequests([]); setEtaInfo(null); }}
        >
          <div className="space-y-6">
              {detailRow.estado === 'en_curso' && etaInfo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {etaInfo.toPassenger && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-blue-500 uppercase">El chofer llega a ti en</p>
                              <p className="text-lg font-bold text-blue-700">{etaInfo.toPassenger.duration}</p>
                              <p className="text-[10px] text-blue-400">{etaInfo.toPassenger.distance} de distancia</p>
                          </div>
                      )}
                      {etaInfo.toDestination && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-green-500 uppercase">Llegada al destino en</p>
                              <p className="text-lg font-bold text-green-700">{etaInfo.toDestination.duration}</p>
                              <p className="text-[10px] text-green-400">{etaInfo.toDestination.distance} restante</p>
                          </div>
                      )}
                  </div>
              )}

              {(detailRow.origen_lat && detailRow.destino_lat) || driverLocation ? (
                  <div className="rounded-lg overflow-hidden border border-night-100">
                      <GoogleMapPicker 
                        readOnly 
                        initialOrigin={detailRow.origen_lat ? { lat: Number(detailRow.origen_lat), lng: Number(detailRow.origen_lng) } : null}
                        initialDestination={detailRow.destino_lat ? { lat: Number(detailRow.destino_lat), lng: Number(detailRow.destino_lng) } : null}
                        driverLocation={driverLocation}
                        passengerLocation={passengerLocation}
                        onEtaChange={setEtaInfo}
                      />
                  </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getTripDetailItems(detailRow).map((item) => (
                  <div key={item.label} className="bg-night-50 rounded-uride-xs p-3">
                    <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{item.label}</span>
                    <span className="text-sm font-semibold text-night-900">{item.value}</span>
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

function TripCard({
  row,
  data,
  userId,
  onViewTrip,
  onEditTrip,
  onDeleteTrip,
  onStartTrip,
  onCompleteTrip,
  onBookTrip,
  onCancelRequest,
  onPayTrip,
}: {
  row: EntityRow
  data: Record<ViewKey, EntityState>
  userId: string
  onViewTrip: (row: EntityRow) => void
  onEditTrip: (row: EntityRow) => void
  onDeleteTrip: (row: EntityRow) => void
  onStartTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
  onBookTrip: (row: EntityRow) => void
  onCancelRequest: (requestId: string | number) => void
  onPayTrip: (row: EntityRow) => void
}) {
  const isConductor = String(row.conductor_id) === String(userId)
  const status = String(row.estado)
  const conductor = row.conductor && typeof row.conductor === 'object' && !Array.isArray(row.conductor)
    ? row.conductor as EntityRow
    : data.users.rows.find((user) => String(user.id) === String(row.conductor_id))
  const passengerRequest = data.requests.rows.find((request) => (
    String(request.viaje_id) === String(row.id)
    && String(request.pasajero_id) === String(userId)
    && ['pendiente', 'aceptada'].includes(String(request.estado))
  ))
  const pendingCount = data.requests.rows.filter((request) => (
    String(request.viaje_id) === String(row.id) && String(request.estado) === 'pendiente'
  )).length
  
  const canEdit = isConductor && status === 'abierto'
  const canStart = isConductor && (status === 'abierto' || status === 'completo')
  const canComplete = isConductor && status === 'en_curso'
  const canBook = !isConductor && !passengerRequest && status === 'abierto' && Number(row.cupos_disponibles) > 0
  const canPay = !isConductor && passengerRequest && String(passengerRequest.estado) === 'aceptada'
  const dayLabel = getRelativeDayLabel(row.fecha_hora)

  return (
    <article className="rounded-uride-xs border border-night-100 bg-white p-4 transition-colors hover:border-uride-100 hover:bg-uride-50/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>
            {dayLabel && <Badge tone="info">{dayLabel}</Badge>}
            {isConductor && pendingCount > 0 && <Badge tone="warning">{pendingCount} pendiente{pendingCount === 1 ? '' : 's'}</Badge>}
            {passengerRequest && <Badge tone={statusTone[String(passengerRequest.estado)] ?? 'neutral'}>Reserva {String(passengerRequest.estado)}</Badge>}
          </div>

          <h3 className="text-base font-bold text-night-900">
            {String(row.origen_zona ?? 'Origen')} - {String(row.destino_zona ?? 'Destino')}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-night-600 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-night-400" />{formatDateTime(row.fecha_hora)}</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-night-400" />{String(row.cupos_disponibles ?? 0)} cupos</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-night-400" />{String(conductor?.nombre ?? 'Sin conductor')}</span>
          </div>
          {row.notas_reglas && <p className="mt-3 text-sm text-night-500">{String(row.notas_reglas)}</p>}
          {passengerRequest && (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              {String(passengerRequest.estado) === 'aceptada'
                ? 'Reserva aceptada. Tu cupo ya esta confirmado.'
                : 'Viaje solicitado, pendiente de confirmacion de la reserva.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button type="button" onClick={() => onViewTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100">
            <Eye className="h-4 w-4" />
            Ver
          </button>
          {canEdit && (
            <>
              <button type="button" onClick={() => onEditTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100">
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button type="button" onClick={() => onDeleteTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </>
          )}
          {canStart && (
            <button type="button" onClick={() => onStartTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-uride-50 px-3 py-2 text-xs font-bold text-uride-600 hover:bg-uride-100">
              <PlayCircle className="h-4 w-4" />
              Iniciar
            </button>
          )}
          {canComplete && (
            <button type="button" onClick={() => onCompleteTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-green-50 px-3 py-2 text-xs font-bold text-green-600 hover:bg-green-100">
              <CheckCircle2 className="h-4 w-4" />
              Finalizar
            </button>
          )}
          {canBook && (
            <button type="button" onClick={() => onBookTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-uride-600 px-3 py-2 text-xs font-bold text-white hover:bg-uride-700">
              <UserPlus className="h-4 w-4" />
              Reservar
            </button>
          )}
          {canPay && (
            <button type="button" onClick={() => onPayTrip(row)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700">
              <CreditCard className="h-4 w-4" />
              Pagar
            </button>
          )}
          {passengerRequest && (
            <button type="button" onClick={() => onCancelRequest(passengerRequest.id as string | number)} className="inline-flex items-center gap-1.5 rounded-uride-xs bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
              <XCircle className="h-4 w-4" />
              Cancelar reserva
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function getTripDetailItems(row: EntityRow) {
  const conductor = row.conductor && typeof row.conductor === 'object' && !Array.isArray(row.conductor)
    ? row.conductor as EntityRow
    : null

  return [
    {
      label: 'Conductor',
      value: String(conductor?.nombre ?? 'Sin conductor asignado'),
    },
    {
      label: 'Ruta',
      value: `${String(row.origen_zona ?? 'Origen')} -> ${String(row.destino_zona ?? 'Destino')}`,
    },
    {
      label: 'Fecha y hora',
      value: formatDateTime(row.fecha_hora),
    },
    {
      label: 'Cupos disponibles',
      value: String(row.cupos_disponibles ?? '0'),
    },
    {
      label: 'Estado',
      value: String(row.estado ?? 'sin estado').replace(/_/g, ' '),
    },
    {
      label: 'Notas',
      value: String(row.notas_reglas ?? 'Sin notas registradas'),
    },
  ]
}

function formatDateTime(value: EntityRow[string]) {
  if (!value) return 'Sin fecha'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getTripTime(row: EntityRow) {
  const date = new Date(String(row.fecha_hora ?? ''))
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime()
}

function isHistoryTrip(row: EntityRow) {
  const status = String(row.estado)
  const tripTime = getTripTime(row)
  return ['finalizado', 'cancelado'].includes(status) || tripTime < startOfToday().getTime()
}

function isUpcomingTrip(row: EntityRow) {
  return !isHistoryTrip(row) && ['abierto', 'completo', 'en_curso'].includes(String(row.estado))
}

function isSameLocalDay(value: EntityRow[string], target: Date) {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return false

  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate()
}

function isTomorrow(value: EntityRow[string]) {
  const tomorrow = startOfToday()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameLocalDay(value, tomorrow)
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function getRelativeDayLabel(value: EntityRow[string]) {
  if (isSameLocalDay(value, new Date())) return 'Hoy'
  if (isTomorrow(value)) return 'Mañana'
  return ''
}

export default TripsView
