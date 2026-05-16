import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'

interface UsersViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

export function UsersView({ state, data, session, onCreated, search }: UsersViewProps) {
  const config = entityConfigs.users
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

export default UsersView
