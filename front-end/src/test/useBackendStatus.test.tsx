import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useBackendStatus } from '../hooks/useBackendStatus'
import { requestJson } from '../services/api'

vi.mock('../services/api', () => ({
  requestJson: vi.fn(),
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

describe('useBackendStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe retornar online cuando requestJson responde correctamente', async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useBackendStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBe('online')
    })

    expect(requestJson).toHaveBeenCalledWith('/api')
  })

  it('debe retornar offline cuando requestJson falla', async () => {
    vi.mocked(requestJson).mockRejectedValueOnce(new Error('Backend caído'))

    const { result } = renderHook(() => useBackendStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBe('offline')
    })

    expect(requestJson).toHaveBeenCalledWith('/api')
  })

  it('debe iniciar en estado pendiente antes de resolver', () => {
    vi.mocked(requestJson).mockImplementationOnce(
      () => new Promise(() => {})
    )

    const { result } = renderHook(() => useBackendStatus(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending || result.current.isLoading).toBe(true)
  })
})