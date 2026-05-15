import type { EntityRow } from '../types'
import { entityService } from './entityService'

/**
 * Servicio de gestión de reportes
 */
export const reportsService = {
  /**
   * Obtiene todos los reportes
   */
  async getAll(): Promise<EntityRow[]> {
    return entityService.getAll('/reports')
  },

  /**
   * Obtiene un reporte específico por ID
   */
  async getById(id: string | number): Promise<EntityRow> {
    return entityService.getById('/reports', id)
  },

  /**
   * Crea un nuevo reporte
   */
  async create(data: Record<string, unknown>): Promise<void> {
    return entityService.create('/reports', data)
  },

  /**
   * Actualiza un reporte existente
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<void> {
    return entityService.update('/reports', id, data)
  },

  /**
   * Elimina un reporte
   */
  async delete(id: string | number): Promise<void> {
    return entityService.delete('/reports', id)
  },
}
