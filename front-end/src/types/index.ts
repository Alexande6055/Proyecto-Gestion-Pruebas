export type ViewKey = 'dashboard' | 'users' | 'trips' | 'requests' | 'ratings' | 'reports' | 'audit_logs' | 'profile'
export type EntityValue = string | number | boolean | null | undefined | EntityRow | EntityRow[]

export interface EntityRow {
  [key: string]: EntityValue
}
export type StatusTone = 'ok' | 'warning' | 'danger' | 'info' | 'neutral'
export type FieldKind = 'text' | 'number' | 'datetime-local' | 'select' | 'textarea'

export type FieldConfig = {
  key: string
  label: string
  kind?: FieldKind
  options?: string[]
  relation?: 'users' | 'trips'
}

export type EntityConfig = {
  key: ViewKey
  title: string
  subtitle: string
  endpoint: string
  createEndpoint?: string
  columns: string[]
  fields: FieldConfig[]
}

export type EntityState = {
  rows: EntityRow[]
  loading: boolean
  error: string
}

export type AuthMode = 'login' | 'register' | 'recover' | 'reset'

export type AuthSession = {
  access_token: string
  user: {
    id: string
    nombre: string
    email: string
    role: string
  }
}

export interface BadgeProps {
  children: string
  tone?: StatusTone
}

export interface StatCardProps {
  label: string
  value: string
  detail: string
}

export interface EmptyStateProps {
  title: string
  message: string
}
