import type { EntityRow } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api') as string

function getStoredAccessToken() {
  const persistedSession = localStorage.getItem('uride-session-storage-v2')

  if (persistedSession) {
    try {
      const parsed = JSON.parse(persistedSession) as { state?: { session?: { access_token?: string } } }
      if (parsed.state?.session?.access_token) return parsed.state.session.access_token
    } catch {
      localStorage.removeItem('uride-session-storage-v2')
    }
  }

  localStorage.removeItem('uride-session-storage')
  localStorage.removeItem('uride-session')

  return ''
}

function buildUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('/')) {
    const base = API_BASE.replace(/\/$/, '')
    return base ? base + url : url
  }
  return url
}

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)

  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  if (!headers.has('Authorization')) {
    const accessToken = getStoredAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(buildUrl(url), {
    ...options,
    headers,
  })

  const text = await response.text()

  if (!response.ok) {
    let detail = `HTTP ${response.status}`

    if (text) {
      try {
        const payload = JSON.parse(text) as { message?: string | string[]; error?: string }
        const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message
        detail = message || payload.error || detail
      } catch {
        detail = text
      }
    }

    throw new Error(detail)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!text) return undefined as T
  if (contentType.includes('application/json')) return JSON.parse(text) as T

  return text as T
}

export function normalizeBackendRow(row: EntityRow): EntityRow {
  return {
    ...row,
    conductor_id: row.conductor_id ?? row.conductorId,
    viaje_id: row.viaje_id ?? row.viajeId,
    pasajero_id: row.pasajero_id ?? row.pasajeroId,
    calificador_id: row.calificador_id ?? row.calificadorId,
    calificado_id: row.calificado_id ?? row.calificadoId,
    reportante_id: row.reportante_id ?? row.reportanteId,
    reportado_id: row.reportado_id ?? row.reportadoId,
    usuario_id: row.usuario_id ?? row.usuarioId,
    fecha_solicitud: row.fecha_solicitud ?? row.fechaSolicitud,
    fecha_hora: row.fecha_hora ?? row.fechaHora,
    motivo_cancelacion: row.motivo_cancelacion ?? row.motivoCancelacion,
  }
}

export function normalizeRows(payload: unknown): EntityRow[] {
  if (Array.isArray(payload)) return payload.map(normalizeBackendRow)
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: EntityRow[] }).data.map(normalizeBackendRow)
  }
  return []
}
