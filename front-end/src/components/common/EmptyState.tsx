import { Inbox, type LucideIcon } from 'lucide-react'
import type { EmptyStateProps } from '../../types'

interface EnhancedEmptyStateProps extends EmptyStateProps {
  icon?: LucideIcon
  action?: React.ReactNode
}

export function EmptyState({ title, message, icon: CustomIcon, action }: EnhancedEmptyStateProps) {
  const Icon = CustomIcon ?? Inbox

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-uride bg-gradient-to-br from-night-100 to-night-200 flex items-center justify-center mb-4 shadow-night">
        <Icon className="w-8 h-8 text-night-400" />
      </div>
      <strong className="block text-lg font-bold text-night-800 mb-2">
        {title}
      </strong>
      <p className="text-sm text-night-500 max-w-xs leading-relaxed mb-4">
        {message}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}