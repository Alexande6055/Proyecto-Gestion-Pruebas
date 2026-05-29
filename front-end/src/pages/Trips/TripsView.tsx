import { useMemo, type ReactNode, useEffect } from 'react'
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
  XCircle,
  Check,
  AlertTriangle,
  Star,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { EntityHeader } from '../../components/page/EntityHeader'
import { EntityField } from '../../components/page/EntityField'
import { EntityTable } from '../../components/page/EntityTable'
import { EntityDetailModal } from '../../components/page/EntityDetailModal'
import { RatingModal } from '../../components/common/RatingModal'
import GoogleMapPicker from '../../components/page/GoogleMapPicker'
import type { AuthSession, EntityState, EntityRow, ViewKey } from '../../types'
import { normalizeBackendRow } from '../../services'
import { tripsService, requestsService, reportsService, ratingsService } from '../../services'
import { getSocket } from '../../services/socket'
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
  
  // Real-time states
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [etaInfo, setEtaInfo] = useState<{ toPassenger?: { duration: string; distance: string }; toDestination?: { duration: string; distance: string } } | null>(null);

  // Rating Modal state
  const [ratingData, setRatingData] = useState<{ reportedId: string, reportedName: string, tripId: string } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

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

  // Proactive Rating Check
  useEffect(() => {
    const checkPendingRatings = async () => {
        const myRatings = (await ratingsService.getAll()).filter(r => String(r.calificador_id) === String(session.user.id));
        const ratedTripIds = new Set(myRatings.map(r => String(r.viaje_id)));

        const myTripsToRate = state.rows.filter(trip => 
            String(trip.estado) === 'finalizado' && 
            String(trip.conductor_id) === String(session.user.id)
        );

        const myReservations = data.requests.rows.filter(req => 
            String(req.pasajero_id) === String(session.user.id) && 
            String(req.estado) === 'aceptada'
        );
        const tripsIParticipatedIn = state.rows.filter(trip => 
            String(trip.estado) === 'finalizado' && 
            myReservations.some(req => String(req.viaje_id) === String(trip.id))
        );

        const unratedTrip = [...myTripsToRate, ...tripsIParticipatedIn].find(trip => !ratedTripIds.has(String(trip.id)));
        
        if (unratedTrip) {
            const isConductor = String(unratedTrip.conductor_id) === String(session.user.id);
            if (isConductor) {
                const tripRequests = data.requests.rows.filter(r => String(r.viaje_id) === String(unratedTrip.id) && String(r.estado) === 'aceptada');
                for (const req of tripRequests) {
                    if (!myRatings.some(r => String(r.viaje_id) === String(unratedTrip.id) && String(r.calificado_id) === String(req.pasajero_id))) {
                        toast('Viaje finalizado: ¿Cómo fue tu experiencia?', {
                            description: `Califica al pasajero del viaje ${unratedTrip.origen_zona} - ${unratedTrip.destino_zona}`,
                            action: {
                                label: 'Calificar ahora',
                                onClick: () => setRatingData({ reportedId: String(req.pasajero_id), reportedName: 'Pasajero', tripId: String(unratedTrip.id) })
                            }
                        });
                        break;
                    }
                }
            } else {
                toast('Viaje finalizado: ¿Qué tal el servicio?', {
                    description: `Califica al conductor del viaje ${unratedTrip.origen_zona} - ${unratedTrip.destino_zona}`,
                    action: {
                        label: 'Calificar ahora',
                        onClick: () => setRatingData({ reportedId: String(unratedTrip.conductor_id), reportedName: 'Conductor', tripId: String(unratedTrip.id) })
                    }
                });
            }
        }
    };

    if (!state.loading && state.rows.length > 0) {
        checkPendingRatings();
    }
  }, [state.rows, state.loading, data.requests.rows, session.user.id]);

  // Capturar ubicación del pasajero si está viendo un detalle
  useEffect(() => {
    if (detailRow && detailRow.conductor_id !== session.user.id && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPassengerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Initial pos passenger error:', err)
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => setPassengerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Error watchPosition passenger:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setPassengerLocation(null);
    }
  }, [detailRow?.id, session.user.id]);

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
  }, [detailRow?.id, session]);

  // Geolocation logic for drivers
  useEffect(() => {
    const activeTrip = state.rows.find(r => r.conductor_id === session.user.id && r.estado === 'en_curso');
    
    if (activeTrip && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (detailRow?.id === activeTrip.id) setDriverLocation({ lat: latitude, lng: longitude });
        },
        (err) => console.error('Initial pos driver error:', err)
      );

      const socket = getSocket(session.user.id, session.access_token);
      
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (detailRow?.id === activeTrip.id) {
            setDriverLocation({ lat: latitude, lng: longitude });
          }
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
  }, [state.rows, session, detailRow?.id]);

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

  const filteredRows = useMemo(() => {
    // Solo mostrar viajes donde el usuario es el conductor
    return state.rows.filter(r => String(r.conductor_id) === String(session.user.id))
  }, [state.rows, session.user.id])

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
    
    if (row.origen_lat) setValue('origen_lat', Number(row.origen_lat));
    if (row.origen_lng) setValue('origen_lng', Number(row.origen_lng));
    if (row.destino_lat) setValue('destino_lat', Number(row.destino_lat));
    if (row.destino_lng) setValue('destino_lng', Number(row.destino_lng));

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

  const handleReportUser = async (reportedId: string, reportedName: string, tripId?: string) => {
      const reason = window.prompt(`Reportar a ${reportedName}. Motivo del reporte:`);
      if (!reason) return;

      try {
          await reportsService.create({
              reportadoId: reportedId,
              viajeId: tripId,
              motivo: reason,
          });
          toast.success('Reporte enviado correctamente. Se ha notificado al usuario y su reputación ha sido afectada.');
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte')
      }
  }

  const confirmRateUser = async (score: number, comment: string) => {
      if (!ratingData) return;
      setRatingLoading(true);

      try {
          await ratingsService.create({
              viajeId: ratingData.tripId,
              calificadoId: ratingData.reportedId,
              puntuacion: score,
              comentario: comment || '',
          });
          toast.success('Calificación enviada correctamente.');
          setRatingData(null);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo enviar la calificación')
      } finally {
          setRatingLoading(false);
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
                {Object.entries(detailRow).filter(([k]) => !['origen_lat', 'origen_lng', 'destino_lat', 'destino_lng', 'id', 'conductor_id'].includes(k)).map(([key, value]) => (
                  <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                    <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
                  </div>
                ))}
              </div>

              {detailRow.conductor_id !== session.user.id && (
                  <div className="flex justify-end gap-2">
                      {detailRow.estado === 'finalizado' && (
                          <button 
                            onClick={() => setRatingData({ reportedId: String(detailRow.conductor_id), reportedName: 'Conductor', tripId: String(detailRow.id) })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 transition-colors"
                          >
                              <Star className="w-3.5 h-3.5" />
                              Calificar Conductor
                          </button>
                      )}
                      <button 
                        onClick={() => handleReportUser(String(detailRow.conductor_id), 'Conductor', String(detailRow.id))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Reportar Conductor
                      </button>
                  </div>
              )}

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
                                          {req.estado === 'aceptada' && (
                                              <>
                                                {detailRow.estado === 'finalizado' && (
                                                    <button 
                                                        onClick={() => setRatingData({ reportedId: String(req.pasajero_id), reportedName: 'Pasajero', tripId: String(detailRow.id) })}
                                                        className="p-1.5 text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100" 
                                                        title="Calificar Pasajero"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleReportUser(String(req.pasajero_id), 'Pasajero', String(detailRow.id))}
                                                    className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100" 
                                                    title="Reportar Pasajero"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </button>
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

      {ratingData && (
          <RatingModal
            open={Boolean(ratingData)}
            title={`Calificar a ${ratingData.reportedName}`}
            subtitle="Tu opinión ayuda a mantener la comunidad segura."
            onClose={() => setRatingData(null)}
            onConfirm={confirmRateUser}
            loading={ratingLoading}
          />
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
}: {
  row: EntityRow
  userId: string
  onViewTrip: (row: EntityRow) => void
  onEditTrip: (row: EntityRow) => void
  onDeleteTrip: (row: EntityRow) => void
  onStartTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
}) {
  const isConductor = row.conductor_id === userId
  const status = String(row.estado)
  
  const canEdit = isConductor && status === 'abierto'
  const canStart = isConductor && (status === 'abierto' || status === 'completo')
  const canComplete = isConductor && status === 'en_curso'

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
  if (['origen_lat', 'origen_lng', 'destino_lat', 'destino_lng'].includes(column)) return <span className="text-[10px] text-night-400">{Number(value).toFixed(4)}</span>
  return <span className="text-sm text-night-700">{text}</span>
}

function formatCellText(value: EntityRow[string]) {
  if (value instanceof Date) return value.toLocaleString()
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}

export default TripsView
