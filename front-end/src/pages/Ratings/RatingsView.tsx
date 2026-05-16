import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'

interface RatingsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

export function RatingsView({ state, data, session, onCreated, search }: RatingsViewProps) {
  const config = entityConfigs.ratings
  return (
    <EntityView
      config={config}
      state={state}
      data={data}
      search={search}
      session={session}
      onCreated={onCreated}
    />
  )
}

export default RatingsView
