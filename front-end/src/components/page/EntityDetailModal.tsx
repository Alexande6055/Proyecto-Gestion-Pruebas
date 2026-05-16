import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface EntityDetailModalProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
}

export function EntityDetailModal({ title, subtitle, icon, onClose, children }: EntityDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night-900/40 backdrop-blur-sm">
      <div className="card-uride w-full max-w-2xl max-h-[80vh] overflow-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-night-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-night-900">{title}</h2>
              {subtitle && <p className="text-[10px] text-night-400 uppercase tracking-wider">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-uride-xs hover:bg-night-100 transition-colors"
          >
            <X className="w-5 h-5 text-night-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
