import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'
import { requestsUi } from './ui'

interface RequestsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

export function RequestsView({ state, data, session, onCreated, search }: RequestsViewProps) {
  const config = entityConfigs.requests
  return (
    <EntityView
      config={config}
      state={state}
      data={data}
      search={search}
      session={session}
      onCreated={onCreated}
      ui={requestsUi}
    />
  )
}

export default RequestsView
