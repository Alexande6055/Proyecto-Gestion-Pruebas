import { useQuery } from '@tanstack/react-query'
import { 
  usersService, 
  tripsService, 
  requestsService, 
  ratingsService, 
  reportsService, 
  entityService,
  normalizeRows 
} from '../services'
import type { ViewKey } from '../types'

export function useEntityData(key: ViewKey, endpoint: string) {
  return useQuery({
    queryKey: ['entities', key],
    queryFn: async () => {
      let payload: unknown

      if (key === 'users') {
        payload = await usersService.getAll()
      } else if (key === 'trips') {
        payload = await tripsService.getAll()
      } else if (key === 'requests') {
        payload = await requestsService.getAll()
      } else if (key === 'ratings') {
        payload = await ratingsService.getAll()
      } else if (key === 'reports') {
        payload = await reportsService.getAll()
      } else {
        payload = await entityService.getAll(endpoint)
      }

      return normalizeRows(payload)
    },
    enabled: !!endpoint || ['users', 'trips', 'requests', 'ratings', 'reports'].includes(key),
  })
}
