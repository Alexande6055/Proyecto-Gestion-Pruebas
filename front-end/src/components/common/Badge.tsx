import type { BadgeProps } from '../../types'

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
