import { useQuery } from '@tanstack/react-query'
import { requestJson } from '../services/api'

export function useBackendStatus() {
  return useQuery({
    queryKey: ['backend-status'],
    queryFn: async () => {
      try {
        await requestJson('/api')
        return 'online' as const
      } catch {
        return 'offline' as const
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
  })
}
