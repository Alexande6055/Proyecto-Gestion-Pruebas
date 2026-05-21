import { useState, type ReactNode } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ActionModalProps {
  open: boolean
  title: string
  description?: string
  icon?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  inputLabel?: string
  inputPlaceholder?: string
  inputType?: 'text' | 'password' | 'textarea'
  inputRequired?: boolean
  defaultValue?: string
  loading?: boolean
  onClose: () => void
  onConfirm: (value: string) => void
}

export function ActionModal({
  open,
  title,
  description,
  icon,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  inputLabel,
  inputPlaceholder,
  inputType = 'text',
  inputRequired = false,
  defaultValue = '',
  loading = false,
  onClose,
  onConfirm,
}: ActionModalProps) {
  const [value, setValue] = useState(defaultValue)

  if (!open) return null

  const hasInput = Boolean(inputLabel)
  const isDisabled = loading || (inputRequired && !value.trim())
  const confirmClass = tone === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/30'
    : 'bg-uride-600 text-white hover:bg-uride-500 focus:ring-uride-500/30'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isDisabled) return
    onConfirm(value)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-night-900/45 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="card-uride w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-night-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-uride-xs bg-night-50 flex items-center justify-center shrink-0">
              {icon ?? <AlertCircle className="w-5 h-5 text-uride-600" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-night-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-night-500 leading-relaxed">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-uride-xs hover:bg-night-100 disabled:opacity-60 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-night-500" />
          </button>
        </div>

        {hasInput && (
          <div className="px-6 pt-5">
            <label className="label-uride" htmlFor="action-modal-input">{inputLabel}</label>
            {inputType === 'textarea' ? (
              <textarea
                id="action-modal-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder}
                rows={4}
                className="input-uride resize-none"
                autoFocus
              />
            ) : (
              <input
                id="action-modal-input"
                type={inputType}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder}
                className="input-uride"
                autoFocus
              />
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-uride-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-uride-xs text-sm font-bold focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${confirmClass}`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ActionModal
