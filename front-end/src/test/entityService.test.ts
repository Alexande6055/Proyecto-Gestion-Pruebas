import { beforeEach, describe, expect, it, vi } from 'vitest'
import { entityService } from '../services/entityService'
import { requestJson, normalizeBackendRow } from '../services/api'

vi.mock('../services/api', () => ({
  requestJson: vi.fn(),
  normalizeBackendRow: vi.fn((row) => ({
    ...row,
    normalizado: true,
  })),
}))

describe('entityService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe obtener todos los registros cuando la API devuelve un arreglo', async () => {
    const rows = [
      { id: 1, nombre: 'Registro 1' },
      { id: 2, nombre: 'Registro 2' },
    ]

    vi.mocked(requestJson).mockResolvedValueOnce(rows)

    const result = await entityService.getAll('/users')

    expect(requestJson).toHaveBeenCalledWith('/users')
    expect(normalizeBackendRow).toHaveBeenCalledTimes(2)
    expect(normalizeBackendRow).toHaveBeenNthCalledWith(1, rows[0])
    expect(normalizeBackendRow).toHaveBeenNthCalledWith(2, rows[1])

    expect(result).toEqual([
      { id: 1, nombre: 'Registro 1', normalizado: true },
      { id: 2, nombre: 'Registro 2', normalizado: true },
    ])
  })

  it('debe obtener todos los registros cuando la API devuelve objeto con data', async () => {
    const payload = {
      data: [
        { id: 1, nombre: 'Ana' },
        { id: 2, nombre: 'Luis' },
      ],
    }

    vi.mocked(requestJson).mockResolvedValueOnce(payload)

    const result = await entityService.getAll('/trips')

    expect(requestJson).toHaveBeenCalledWith('/trips')
    expect(normalizeBackendRow).toHaveBeenCalledTimes(2)

    expect(result).toEqual([
      { id: 1, nombre: 'Ana', normalizado: true },
      { id: 2, nombre: 'Luis', normalizado: true },
    ])
  })

  it('debe retornar arreglo vacío cuando data no es arreglo', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({
      data: null,
    })

    const result = await entityService.getAll('/reports')

    expect(requestJson).toHaveBeenCalledWith('/reports')
    expect(normalizeBackendRow).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('debe obtener un registro por ID y normalizarlo', async () => {
    const row = {
      id: 10,
      nombre: 'Registro detalle',
    }

    vi.mocked(requestJson).mockResolvedValueOnce(row)

    const result = await entityService.getById('/users', 10)

    expect(requestJson).toHaveBeenCalledWith('/users/10')
    expect(normalizeBackendRow).toHaveBeenCalledWith(row)

    expect(result).toEqual({
      id: 10,
      nombre: 'Registro detalle',
      normalizado: true,
    })
  })

  it('debe crear un registro con método POST', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined)

    const payload = {
      nombre: 'Nuevo registro',
      estado: 'activo',
    }

    await entityService.create('/users', payload)

    expect(requestJson).toHaveBeenCalledWith('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('debe actualizar un registro con método PATCH', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined)

    const payload = {
      nombre: 'Registro actualizado',
      estado: 'inactivo',
    }

    await entityService.update('/users', 15, payload)

    expect(requestJson).toHaveBeenCalledWith('/users/15', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  })

  it('debe eliminar un registro con método DELETE', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined)

    await entityService.delete('/users', 20)

    expect(requestJson).toHaveBeenCalledWith('/users/20', {
      method: 'DELETE',
    })
  })

  it('debe funcionar con ID tipo string', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce(undefined)

    await entityService.delete('/trips', 'abc-123')

    expect(requestJson).toHaveBeenCalledWith('/trips/abc-123', {
      method: 'DELETE',
    })
  })
})