import type { StatCardProps } from '../../types'

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
