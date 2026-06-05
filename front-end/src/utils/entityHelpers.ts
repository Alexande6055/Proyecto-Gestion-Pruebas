import type { EntityRow, FieldConfig } from '../types'

export function getUserName(users: EntityRow[], id: string | number | null | undefined) {
  const user = users.find((item) => String(item.id) === String(id))
  return user?.nombre ? String(user.nombre) : String(id ?? '')
}

export function getRelatedName(row: EntityRow, relationKey: string, fallbackId: string | number | null | undefined) {
  const relation = row[relationKey]

  if (relation && typeof relation === 'object' && !Array.isArray(relation)) {
    const relatedRow = relation as EntityRow
    return String(relatedRow.nombre ?? relatedRow.correo_institucional ?? fallbackId ?? '')
  }

  return String(fallbackId ?? '')
}

export function getTripRoute(trips: EntityRow[], id: string | number | null | undefined) {
  const trip = trips.find((item) => String(item.id) === String(id))
  if (!trip) return String(id ?? '')
  return `${trip.origen_zona ?? ''} -> ${trip.destino_zona ?? ''}`
}

export function getRelationLabel(relation: FieldConfig['relation'], rows: EntityRow[], value: string | number | null | undefined) {
  if (relation === 'users') return getUserName(rows, value)
  if (relation === 'trips') return getTripRoute(rows, value)
  return String(value ?? '')
}
