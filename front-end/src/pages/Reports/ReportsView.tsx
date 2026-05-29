import { useMemo, useState } from 'react'
import { AlertTriangle, User, Car, Info, Loader2, Send, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
import type { AuthSession, ViewKey, EntityState, EntityRow } from '../../types'
import { statusTone } from '../../constants/entities'
import { reportsService } from '../../services'
import { Badge } from '../../components/common/Badge'
import { toast } from 'sonner'

interface ReportsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
}

type ReportType = 'conductor' | 'pasajero'

export function ReportsView({ state, data, session, onCreated }: ReportsViewProps) {
  const [loading, setLoading] = useState(false)
  const [manageLoading, setManageLoading] = useState<string | null>(null)
  const [type, setType] = useState<ReportType | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [motivo, setMotivo] = useState('')
  const [evidence, setEvidence] = useState('')
  
  const isAdmin = session.user.role === 'admin'

  const sharedUsers = useMemo(() => {
    const results: Array<{ id: string, nombre: string, type: ReportType, trip: EntityRow }> = [];
    
    if (type === 'conductor') {
        const myAcceptedReservations = data.requests.rows.filter(req => 
            String(req.pasajero_id) === String(session.user.id) && 
            String(req.estado) === 'aceptada'
        );
        
        myAcceptedReservations.forEach(req => {
            const trip = data.trips.rows.find(t => String(t.id) === String(req.viaje_id));
            if (trip) {
                const conductor = data.users.rows.find(u => String(u.id) === String(trip.conductor_id));
                if (conductor) {
                    results.push({
                        id: String(conductor.id),
                        nombre: String(conductor.nombre),
                        type: 'conductor',
                        trip
                    });
                }
            }
        });
    } else if (type === 'pasajero') {
        const myTrips = data.trips.rows.filter(t => String(t.conductor_id) === String(session.user.id));
        
        myTrips.forEach(trip => {
            const passengers = data.requests.rows.filter(req => 
                String(req.viaje_id) === String(trip.id) && 
                String(req.estado) === 'aceptada'
            );
            
            passengers.forEach(req => {
                const user = data.users.rows.find(u => String(u.id) === String(req.pasajero_id));
                if (user) {
                    results.push({
                        id: String(user.id),
                        nombre: String(user.nombre),
                        type: 'pasajero',
                        trip
                    });
                }
            });
        });
    }
    
    return results.filter((v, i, a) => a.findIndex(t => t.id === v.id && t.trip.id === v.trip.id) === i);
  }, [type, data.requests.rows, data.trips.rows, data.users.rows, session.user.id]);

  const selectedEntry = useMemo(() => 
    sharedUsers.find(u => u.id === selectedUserId)
  , [sharedUsers, selectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !motivo) return;

    setLoading(true);
    try {
        await reportsService.create({
            reportadoId: selectedUserId,
            viajeId: selectedEntry?.trip.id,
            motivo,
            evidencia_url: evidence,
        });
        toast.success('Reporte enviado con éxito. Pendiente de revisión por administración.');
        setType(null);
        setSelectedUserId('');
        setMotivo('');
        setEvidence('');
        onCreated();
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte');
    } finally {
        setLoading(false);
    }
  };

  const handleManageReport = async (reportId: string, decision: 'aceptar' | 'rechazar') => {
      const actionTaken = window.prompt(`Indica el motivo de la decisión (${decision}):`);
      if (actionTaken === null) return;

      setManageLoading(reportId);
      try {
          await reportsService.manage(reportId, decision, actionTaken);
          toast.success(`Reporte ${decision === 'aceptar' ? 'aceptado (penalización aplicada)' : 'rechazado'}.`);
          onCreated();
      } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo gestionar el reporte');
      } finally {
          setManageLoading(null);
      }
  }

  return (
    <div className="min-h-screen bg-night-50 pb-12">
      <div className="bg-white border-b border-night-100 px-6 sm:px-8 lg:px-12 py-8 mb-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-night-900 tracking-tight">Centro de Seguridad</h1>
            <p className="text-sm text-night-500 font-medium italic">Reporta incidentes para mantener la comunidad u-Ride segura.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 gap-8">
          
          {/* ADMIN MANAGEMENT PANEL */}
          {isAdmin && state.rows.some(r => r.estado === 'pendiente') && (
              <div className="card-uride p-8 border-l-4 border-l-amber-500 bg-amber-50/20">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-100 rounded-lg">
                          <ShieldCheck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-night-900 leading-tight">Gestión de Reportes (Admin)</h2>
                        <p className="text-xs text-night-500">Revisa y resuelve los incidentes reportados por la comunidad.</p>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                      {state.rows.filter(r => r.estado === 'pendiente').map(report => (
                          <div key={String(report.id)} className="bg-white p-6 rounded-2xl border border-night-100 shadow-sm flex flex-col md:flex-row gap-6">
                              <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-night-400 uppercase">Reportado por:</span>
                                      <span className="text-xs font-bold text-night-700">{(report.reportante as any)?.nombre || report.reportante_id}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-night-400 uppercase">Contra:</span>
                                      <span className="text-xs font-bold text-red-600">{(report.reportado as any)?.nombre || report.reportado_id}</span>
                                  </div>
                                  <div className="p-4 bg-night-50 rounded-xl">
                                      <p className="text-sm text-night-600 italic">"{String(report.motivo)}"</p>
                                  </div>
                                  {report.evidencia_url && (
                                      <a href={String(report.evidencia_url)} target="_blank" className="text-[10px] text-blue-600 hover:underline font-bold">Ver Evidencia Externa</a>
                                  )}
                              </div>
                              <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                                  <button
                                    onClick={() => handleManageReport(String(report.id), 'aceptar')}
                                    disabled={Boolean(manageLoading)}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                                  >
                                      {manageLoading === String(report.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                      Aceptar y Penalizar
                                  </button>
                                  <button
                                    onClick={() => handleManageReport(String(report.id), 'rechazar')}
                                    disabled={Boolean(manageLoading)}
                                    className="flex-1 px-4 py-2 bg-night-100 text-night-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-night-200 transition-colors"
                                  >
                                      <XCircle className="w-3 h-3" />
                                      Rechazar
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* STEP 1: SELECT TYPE */}
          <div className="card-uride p-8">
            <h2 className="text-lg font-bold text-night-900 mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-night-900 text-white text-xs flex items-center justify-center">1</span>
              ¿A quién deseas reportar?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setType('conductor'); setSelectedUserId(''); }}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  type === 'conductor' 
                    ? 'border-uride-600 bg-uride-50 text-uride-700' 
                    : 'border-night-100 hover:border-night-200 text-night-500 bg-white'
                }`}
              >
                <Car className="w-8 h-8" />
                <span className="font-bold text-sm uppercase tracking-wider">A un Conductor</span>
              </button>
              <button
                onClick={() => { setType('pasajero'); setSelectedUserId(''); }}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  type === 'pasajero' 
                    ? 'border-uride-600 bg-uride-50 text-uride-700' 
                    : 'border-night-100 hover:border-night-200 text-night-500 bg-white'
                }`}
              >
                <User className="w-8 h-8" />
                <span className="font-bold text-sm uppercase tracking-wider">A un Pasajero</span>
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT USER */}
          {type && (
            <div className="card-uride p-8 animate-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-bold text-night-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-night-900 text-white text-xs flex items-center justify-center">2</span>
                Selecciona al usuario
              </h2>
              {sharedUsers.length === 0 ? (
                <div className="p-12 text-center bg-night-50 rounded-2xl border border-dashed border-night-200">
                    <Info className="w-8 h-8 text-night-300 mx-auto mb-3" />
                    <p className="text-sm text-night-500 font-medium">No se encontraron usuarios compartidos en este rol.</p>
                </div>
              ) : (
                <div className="space-y-4">
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="input-uride h-14 text-base font-bold"
                    >
                        <option value="">Seleccionar usuario...</option>
                        {sharedUsers.map(u => (
                            <option key={`${u.id}-${u.trip.id}`} value={u.id}>{u.nombre} (Viaje: {u.trip.origen_zona} - {u.trip.destino_zona})</option>
                        ))}
                    </select>

                    {selectedEntry && (
                        <div className="p-6 bg-night-50 rounded-2xl border border-night-100 mt-4 animate-in fade-in duration-500">
                            <h3 className="text-xs font-bold text-night-400 uppercase tracking-widest mb-4">Detalle del viaje relacionado</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-night-400 block uppercase">Origen - Destino</span>
                                    <p className="text-sm font-bold text-night-900">{selectedEntry.trip.origen_zona} → {selectedEntry.trip.destino_zona}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-night-400 block uppercase">Fecha</span>
                                    <p className="text-sm font-bold text-night-900">{new Date(String(selectedEntry.trip.fecha_hora)).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-night-400 block uppercase">Estado del Viaje</span>
                                    <Badge tone={statusTone[String(selectedEntry.trip.status || selectedEntry.trip.estado)]}>{String(selectedEntry.trip.status || selectedEntry.trip.estado)}</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REASON & SUBMIT */}
          {selectedUserId && (
            <form onSubmit={handleSubmit} className="card-uride p-8 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-bold text-night-900 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-night-900 text-white text-xs flex items-center justify-center">3</span>
                Detalles del incidente
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-night-400 uppercase px-1">Motivo del reporte</label>
                    <textarea
                        required
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Describe detalladamente qué sucedió..."
                        className="input-uride min-h-[120px] py-4"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-night-400 uppercase px-1">Link de evidencia (opcional)</label>
                    <input
                        type="url"
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                        placeholder="https://ejemplo.com/foto-o-video"
                        className="input-uride"
                    />
                </div>
                
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        ENVIAR REPORTE OFICIAL
                    </button>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter text-center mt-4">
                        Aviso: El reporte quedará pendiente hasta ser revisado por un administrador.
                    </p>
                </div>
              </div>
            </form>
          )}

          {/* HISTORY TABLE */}
          {state.rows.length > 0 && (
              <div className="card-uride overflow-hidden">
                  <div className="p-6 border-b border-night-100 bg-night-50/50 flex justify-between items-center">
                      <h2 className="text-sm font-bold text-night-900 uppercase tracking-widest flex items-center gap-2">
                          <Info className="w-4 h-4 text-night-400" />
                          {isAdmin ? 'Todos los Reportes del Sistema' : 'Mi Historial de Reportes'}
                      </h2>
                      <Badge tone="neutral">{String(state.rows.length)}</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-night-100 text-[10px] font-bold text-night-400 uppercase">
                            <tr>
                                {isAdmin && <th className="px-6 py-4">Reportante</th>}
                                <th className="px-6 py-4">Reportado</th>
                                <th className="px-6 py-4">Motivo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acción Tomada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-night-50">
                            {(isAdmin ? state.rows : state.rows.filter(r => String(r.reportante_id) === String(session.user.id))).map(report => (
                                <tr key={String(report.id)} className="bg-white hover:bg-night-50/30 transition-colors">
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-xs text-night-600">
                                            {String((report.reportante as any)?.nombre || report.reportante_id).slice(0, 15)}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-bold text-night-700">
                                        {String((report.reportado as any)?.nombre || report.reportado_id).slice(0, 15)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-night-500 max-w-xs truncate">{String(report.motivo)}</td>
                                    <td className="px-6 py-4">
                                        <Badge tone={statusTone[String(report.estado)]}>{String(report.estado)}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-night-400 font-medium max-w-xs italic">
                                        {report.accion_tomada ? String(report.accion_tomada) : 'Pendiente de revisión'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsView
