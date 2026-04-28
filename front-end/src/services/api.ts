import type { EntityRow } from '../types'

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
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
  }
}

export function normalizeRows(payload: unknown): EntityRow[] {
  if (Array.isArray(payload)) return payload.map(normalizeBackendRow)
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: EntityRow[] }).data.map(normalizeBackendRow)
  }
  return []
}
