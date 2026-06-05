import type { PageUi } from '../../types'

export const requestsUi: PageUi = {
  title: 'Solicitudes',
  subtitle: 'Solicitudes de cupo realizadas por pasajeros.',
  fieldLabels: {
    viaje_id: 'Viaje',
    pasajero_id: 'Pasajero',
    estado: 'Estado',
    fecha_solicitud: 'Fecha de solicitud',
  },
  fieldPlaceholders: {
    viaje_id: 'Selecciona un viaje',
    pasajero_id: 'Selecciona un pasajero',
  }
}

export default requestsUi
