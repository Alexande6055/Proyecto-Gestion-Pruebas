import type { ReactNode } from 'react'
import { Badge } from '../common/Badge'

interface EntityHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  endpoint: string
  statusText: string
  statusTone?: 'info' | 'warning' | 'success' | 'ok' | 'danger' | 'neutral' | 'primary'
}

export function EntityHeader({
  icon,
  title,
  subtitle,
  endpoint,
  statusText,
  statusTone = 'ok',
}: EntityHeaderProps) {
  return (
    <header className="bg-white border-b border-night-200 px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-uride-xs bg-linear-to-br from-uride-50 to-uride-100 flex items-center justify-center shadow-night">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-uride-600 uppercase tracking-widest">Módulo</span>
                <Badge tone={statusTone}>{statusText}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-night-900 tracking-tight">{title}</h1>
              <p className="text-sm text-night-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-night-400 bg-night-50 px-4 py-2 rounded-uride-xs">
            <span className="font-mono">{endpoint}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
