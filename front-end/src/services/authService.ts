import type { AuthSession } from '../types'
import { requestJson } from './api'

interface LoginCredentials {
  correo_institucional: string
  password: string
}

interface RegisterData {
  correo_institucional: string
  password: string
  nombre: string
  carrera: string
  zona_barrio: string
  telefono?: string
}

interface ForgotPasswordResponse {
  message: string
  devResetToken?: string
}

interface ResetPasswordData {
  token: string
  newPassword: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Inicia sesión con correo y contraseña
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return requestJson<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<{ message: string }> {
    return requestJson<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Solicita restablecimiento de contraseña
   */
  async forgotPassword(correo_institucional: string): Promise<ForgotPasswordResponse> {
    return requestJson<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ correo_institucional }),
    })
  },

  /**
   * Restablece la contraseña con token
   */
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    return requestJson<{ message: string }>('/auth/reset-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return requestJson<{ message: string }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    await requestJson('/auth/logout', { method: 'POST' }).catch(() => {
      // Ignorar errores de logout, siempre limpiar localmente
    })
  },

  /**
   * Guarda la sesión en localStorage
   */
  saveSession(session: AuthSession): void {
    localStorage.setItem('uride-session', JSON.stringify(session))
  },

  /**
   * Obtiene la sesión del localStorage
   */
  getSession(): AuthSession | null {
    const storedSession = localStorage.getItem('uride-session')
    if (!storedSession) return null
    try {
      return JSON.parse(storedSession) as AuthSession
    } catch {
      localStorage.removeItem('uride-session')
      return null
    }
  },

  /**
   * Elimina la sesión
   */
  clearSession(): void {
    localStorage.removeItem('uride-session')
  },
}
