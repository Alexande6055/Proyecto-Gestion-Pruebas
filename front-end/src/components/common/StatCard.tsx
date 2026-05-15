import { Loader2, type LucideIcon } from 'lucide-react'
import type { StatCardProps } from '../../types'

interface EnhancedStatCardProps extends StatCardProps {
  icon?: LucideIcon
  iconBg?: string
  trend?: { value: string; positive: boolean }
  progress?: number // 0-100
}

export function StatCard({ 
  label, 
  value, 
  detail, 
  icon: CustomIcon, 
  iconBg = 'bg-uride-100',
  trend,
  progress 
}: EnhancedStatCardProps) {
  const isLoading = value === '...'

  return (
    <article className="card-uride p-5 hover:shadow-night-xl hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        {CustomIcon && (
          <div className={`w-10 h-10 rounded-uride-xs ${iconBg} flex items-center justify-center shadow-night group-hover:scale-105 transition-transform`}>
            <CustomIcon className="w-5 h-5 text-uride-600" />
          </div>
        )}
        <span className="badge-uride">{label}</span>
      </div>

      <div className="text-3xl font-extrabold text-night-900">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-uride-500" />
        ) : (
          value
        )}
      </div>

      <p className="text-sm text-night-500 mt-1">{detail}</p>

      {trend && (
        <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${trend.positive ? 'text-uride-600' : 'text-red-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${trend.positive ? 'bg-uride-500' : 'bg-red-500'} ${trend.positive ? 'animate-pulse' : ''}`} />
          {trend.value}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-night-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-uride-400 to-uride-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(progress, 3)}%` }}
          />
        </div>
      )}
    </article>
  )
}