import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEntityData } from '../hooks/useEntityData'
import {
  usersService,
  tripsService,
  requestsService,
  ratingsService,
  reportsService,
  entityService,
  normalizeRows,
} from '../services'

vi.mock('../services', () => ({
  usersService: {
    getAll: vi.fn(),
    getProfile: vi.fn(),
  },
  tripsService: {
    getAll: vi.fn(),
  },
  requestsService: {
    getAll: vi.fn(),
  },
  ratingsService: {
    getAll: vi.fn(),
  },
  reportsService: {
    getAll: vi.fn(),
  },
  entityService: {
    getAll: vi.fn(),
  },
  normalizeRows: vi.fn((payload) => payload),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useEntityData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe obtener usuarios con usersService.getAll', async () => {
    vi.mocked(usersService.getAll).mockResolvedValueOnce([
      { id: 1, nombre: 'Ana Torres' },
    ] as any)

    const { result } = renderHook(() => useEntityData('users', '/users'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, nombre: 'Ana Torres' }])
    })

    expect(usersService.getAll).toHaveBeenCalledTimes(1)
    expect(normalizeRows).toHaveBeenCalled()
  })

  it('debe usar getProfile cuando usersService.getAll falla', async () => {
    vi.mocked(usersService.getAll).mockRejectedValueOnce(new Error('Sin permiso'))
    vi.mocked(usersService.getProfile).mockResolvedValueOnce({
      id: 1,
      nombre: 'Ana Torres',
    } as any)

    const { result } = renderHook(() => useEntityData('users', '/users'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, nombre: 'Ana Torres' }])
    })

    expect(usersService.getAll).toHaveBeenCalledTimes(1)
    expect(usersService.getProfile).toHaveBeenCalledTimes(1)
    expect(normalizeRows).toHaveBeenCalledWith([{ id: 1, nombre: 'Ana Torres' }])
  })

  it('debe lanzar error original cuando getAll y getProfile fallan', async () => {
    const originalError = new Error('Error original')

    vi.mocked(usersService.getAll).mockRejectedValueOnce(originalError)
    vi.mocked(usersService.getProfile).mockRejectedValueOnce(new Error('Perfil falló'))

    const { result } = renderHook(() => useEntityData('users', '/users'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(originalError)
  })

  it('debe obtener trips con tripsService.getAll', async () => {
    vi.mocked(tripsService.getAll).mockResolvedValueOnce([
      { id: 10, origen_zona: 'Campus Huachi' },
    ] as any)

    const { result } = renderHook(() => useEntityData('trips', '/trips'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 10, origen_zona: 'Campus Huachi' }])
    })

    expect(tripsService.getAll).toHaveBeenCalledTimes(1)
  })

  it('debe obtener requests con requestsService.getAll', async () => {
    vi.mocked(requestsService.getAll).mockResolvedValueOnce([
      { id: 1, estado: 'pendiente' },
    ] as any)

    const { result } = renderHook(() => useEntityData('requests', '/requests'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, estado: 'pendiente' }])
    })

    expect(requestsService.getAll).toHaveBeenCalledTimes(1)
  })

  it('debe obtener ratings con ratingsService.getAll', async () => {
    vi.mocked(ratingsService.getAll).mockResolvedValueOnce([
      { id: 1, puntuacion: 5 },
    ] as any)

    const { result } = renderHook(() => useEntityData('ratings', '/ratings'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, puntuacion: 5 }])
    })

    expect(ratingsService.getAll).toHaveBeenCalledTimes(1)
  })

  it('debe obtener reports con reportsService.getAll', async () => {
    vi.mocked(reportsService.getAll).mockResolvedValueOnce([
      { id: 1, motivo: 'Retraso' },
    ] as any)

    const { result } = renderHook(() => useEntityData('reports', '/reports'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, motivo: 'Retraso' }])
    })

    expect(reportsService.getAll).toHaveBeenCalledTimes(1)
  })

  it('debe usar entityService.getAll para entidades genéricas', async () => {
    vi.mocked(entityService.getAll).mockResolvedValueOnce([
      { id: 1, accion: 'login' },
    ] as any)

    const { result } = renderHook(() => useEntityData('audit_logs', '/audit-logs'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, accion: 'login' }])
    })

    expect(entityService.getAll).toHaveBeenCalledWith('/audit-logs')
  })

  it('no debe ejecutar la consulta cuando endpoint está vacío', () => {
    renderHook(() => useEntityData('users', ''), {
      wrapper: createWrapper(),
    })

    expect(usersService.getAll).not.toHaveBeenCalled()
  })
})