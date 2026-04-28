import type { EmptyStateProps } from '../../types'

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
