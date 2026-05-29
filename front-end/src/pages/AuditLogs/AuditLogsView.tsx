import type { AuthSession, ViewKey, EntityState } from '../../types'
import { entityConfigs } from '../../constants/entities'
import { EntityView } from '../Entity/EntityView'

interface AuditLogsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
  search: string
}

export function AuditLogsView({ state, data, session, onCreated, search }: AuditLogsViewProps) {
  const config = entityConfigs.audit_logs
  return (
    <EntityView
      config={config}
      state={state}
      data={data}
      search={search}
      session={session}
      onCreated={onCreated}
      readOnly
    />
  )
}

export default AuditLogsView
