import type { EntityRow } from '../types'
import { entityService } from './entityService'

/**
 * Servicio de gestión de calificaciones
 */
export const ratingsService = {
  /**
   * Obtiene todas las calificaciones
   */
  async getAll(): Promise<EntityRow[]> {
    return entityService.getAll('/ratings')
  },

  /**
   * Obtiene una calificación específica por ID
   */
  async getById(id: string | number): Promise<EntityRow> {
    return entityService.getById('/ratings', id)
  },

  /**
   * Crea una nueva calificación
   */
  async create(data: Record<string, unknown>): Promise<void> {
    return entityService.create('/ratings', data)
  },

  /**
   * Actualiza una calificación existente
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<void> {
    return entityService.update('/ratings', id, data)
  },

  /**
   * Elimina una calificación
   */
  async delete(id: string | number): Promise<void> {
    return entityService.delete('/ratings', id)
  },
}
