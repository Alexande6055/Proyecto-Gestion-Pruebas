import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'

interface ReportsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

export function ReportsView({ state, data, session, onCreated, search }: ReportsViewProps) {
  const config = entityConfigs.reports
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

export default ReportsView
