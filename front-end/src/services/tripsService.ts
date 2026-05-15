import type { EntityRow } from '../types'
import { entityService } from './entityService'
import { requestJson } from './api'

/**
 * Servicio de gestión de viajes
 */
export const tripsService = {
  /**
   * Obtiene todos los viajes
   */
  async getAll(): Promise<EntityRow[]> {
    return entityService.getAll('/trips')
  },

  /**
   * Obtiene un viaje específico por ID
   */
  async getById(id: string | number): Promise<EntityRow> {
    return entityService.getById('/trips', id)
  },

  /**
   * Crea un nuevo viaje
   */
  async create(data: Record<string, unknown>): Promise<void> {
    return entityService.create('/trips', data)
  },

  /**
   * Actualiza un viaje existente
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<void> {
    return entityService.update('/trips', id, data)
  },

  /**
   * Finaliza un viaje
   */
  async complete(id: string | number): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/trips/${id}/complete`, {
      method: 'POST',
    })
  },

  /**
   * Elimina un viaje
   */
  async delete(id: string | number): Promise<void> {
    return entityService.delete('/trips', id)
  },
}
