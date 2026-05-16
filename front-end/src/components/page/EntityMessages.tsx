import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface EntityMessagesProps {
  actionMessage: string
  saveError: string
}

export function EntityMessages({ actionMessage, saveError }: EntityMessagesProps) {
  if (!actionMessage && !saveError) return null

  return (
    <div className="mb-6 space-y-3">
      {actionMessage && (
        <div className="alert-uride-info flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-info-700 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-red-900 text-sm font-medium">{saveError}</span>
        </div>
      )}
    </div>
  )
}
