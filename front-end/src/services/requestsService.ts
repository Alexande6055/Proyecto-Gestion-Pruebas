import type { EntityRow } from '../types'
import { entityService } from './entityService'
import { requestJson } from './api'

interface RequestStatusData {
  conductor_id: string | number | boolean
  estado: 'aceptada' | 'rechazada'
}

/**
 * Servicio de gestión de solicitudes de viaje
 */
export const requestsService = {
  /**
   * Obtiene todas las solicitudes
   */
  async getAll(): Promise<EntityRow[]> {
    return entityService.getAll('/requests')
  },

  /**
   * Obtiene una solicitud específica por ID
   */
  async getById(id: string | number): Promise<EntityRow> {
    return entityService.getById('/requests', id)
  },

  /**
   * Crea una nueva solicitud
   */
  async create(data: Record<string, unknown>): Promise<void> {
    return entityService.create('/requests', data)
  },

  /**
   * Cambia el estado de una solicitud (aceptar/rechazar)
   */
  async updateStatus(id: string | number, data: RequestStatusData): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cancela una solicitud de viaje
   */
  async cancel(id: string | number, reason: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/requests/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  /**
   * Elimina una solicitud
   */
  async delete(id: string | number): Promise<void> {
    return entityService.delete('/requests', id)
  },
}
