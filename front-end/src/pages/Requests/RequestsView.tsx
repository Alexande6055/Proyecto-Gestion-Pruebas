import { useMemo, useState } from 'react'
import { Send, Inbox } from 'lucide-react'
import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'

interface RequestsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

type RequestMode = 'sent' | 'received'

export function RequestsView({ state, data, session, onCreated, search }: RequestsViewProps) {
  const config = entityConfigs.requests
  const [mode, setMode] = useState<RequestMode>('sent')
  
  const filteredRows = useMemo(() => {
    if (mode === 'sent') {
        // Solicitudes donde soy el pasajero
        return state.rows.filter(r => String(r.pasajero_id) === String(session.user.id))
    } else {
        // Solicitudes para viajes donde soy el conductor
        return state.rows.filter(r => {
            const trip = data.trips.rows.find(t => String(t.id) === String(r.viaje_id))
            return trip && String(trip.conductor_id) === String(session.user.id)
        })
    }
  }, [state.rows, data.trips.rows, session.user.id, mode]);

  const filteredState = useMemo(() => ({
      ...state,
      rows: filteredRows
  }), [state, filteredRows]);

  return (
    <div className="relative">
      <div className="absolute top-28 right-6 sm:right-8 lg:right-12 z-10 flex bg-white p-1 rounded-xl border border-night-100 shadow-sm">
        <button
          onClick={() => setMode('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'sent' 
              ? 'bg-uride-600 text-white shadow-md shadow-uride-500/20' 
              : 'text-night-500 hover:bg-night-50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Enviadas
        </button>
        <button
          onClick={() => setMode('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === 'received' 
              ? 'bg-uride-600 text-white shadow-md shadow-uride-500/20' 
              : 'text-night-500 hover:bg-night-50'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          Recibidas
          {mode !== 'received' && state.rows.some(r => {
              const trip = data.trips.rows.find(t => String(t.id) === String(r.viaje_id))
              return trip && String(trip.conductor_id) === String(session.user.id) && String(r.estado) === 'pendiente'
          }) && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      <EntityView
        config={config}
        state={filteredState}
        data={data}
        search={search}
        session={session}
        onCreated={onCreated}
        ui={{
            title: mode === 'sent' ? 'Mis Reservas (Enviadas)' : 'Solicitudes Recibidas',
            subtitle: mode === 'sent' 
                ? 'Gestiona los viajes a los que has solicitado unirte.' 
                : 'Pasajeros que quieren unirse a tus viajes publicados.',
            fieldLabels: {
                viaje_id: 'Viaje disponible'
            },
            fieldPlaceholders: {
                viaje_id: 'Selecciona una ruta con cupos'
            }
        }}
      />
    </div>
  )
}

export default RequestsView
