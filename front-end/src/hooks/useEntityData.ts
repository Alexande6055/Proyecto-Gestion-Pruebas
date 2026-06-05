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
        try {
          payload = await usersService.getAll()
        } catch (error) {
          // Si no tiene permiso para listar todos, obtenemos solo su perfil
          try {
            const profile = await usersService.getProfile()
            payload = [profile]
          } catch (profileError) {
            throw error // Lanzar el error original si el perfil también falla
          }
        }
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
    enabled: !!endpoint,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
}
