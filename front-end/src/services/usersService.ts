import type { EntityRow } from '../types'
import { entityService } from './entityService'
import { requestJson } from './api'

interface ResetPasswordData {
  newPassword: string
}

/**
 * Servicio de gestión de usuarios
 */
export const usersService = {
  /**
   * Obtiene todos los usuarios
   */
  async getAll(): Promise<EntityRow[]> {
    return entityService.getAll('/users')
  },

  /**
   * Obtiene un usuario específico por ID
   */
  async getById(id: string | number): Promise<EntityRow> {
    return entityService.getById('/users', id)
  },

  /**
   * Crea un nuevo usuario
   */
  async create(data: Record<string, unknown>): Promise<void> {
    return entityService.create('/users', data)
  },

  /**
   * Actualiza un usuario existente
   */
  async update(id: string | number, data: Record<string, unknown>): Promise<void> {
    return entityService.update('/users', id, data)
  },

  /**
   * Restablece la contraseña de un usuario
   */
  async resetPassword(id: string | number, newPassword: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword } as ResetPasswordData),
    })
  },

  /**
   * Elimina un usuario
   */
  async delete(id: string | number): Promise<void> {
    return entityService.delete('/users', id)
  },
}
