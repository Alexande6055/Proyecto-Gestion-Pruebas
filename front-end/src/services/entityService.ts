import type { EntityRow } from '../types'
import { requestJson, normalizeBackendRow } from './api'

/**
 * Servicio genérico para operaciones CRUD de entidades
 */
export const entityService = {
  /**
   * Obtiene todos los registros de una entidad
   */
  async getAll<T extends EntityRow = EntityRow>(endpoint: string): Promise<T[]> {
    const data = await requestJson<T[] | { data: T[] }>(endpoint)
    const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []
    return rows.map((row) => normalizeBackendRow(row) as T)
  },

  /**
   * Obtiene un registro específico por ID
   */
  async getById<T extends EntityRow = EntityRow>(endpoint: string, id: string | number): Promise<T> {
    const data = await requestJson<T>(`${endpoint}/${id}`)
    return normalizeBackendRow(data) as T
  },

  /**
   * Crea un nuevo registro
   */
  async create(endpoint: string, payload: Record<string, unknown>): Promise<void> {
    await requestJson(`${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Actualiza un registro existente
   */
  async update(endpoint: string, id: string | number, payload: Record<string, unknown>): Promise<void> {
    await requestJson(`${endpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Elimina un registro
   */
  async delete(endpoint: string, id: string | number): Promise<void> {
    await requestJson(`${endpoint}/${id}`, {
      method: 'DELETE',
    })
  },
}
