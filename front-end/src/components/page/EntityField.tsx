import { ChevronDown, AlertCircle } from 'lucide-react'
import type { FieldConfig, ViewKey, EntityState } from '../../types'
import { getRelationLabel } from '../../utils/entityHelpers'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface EntityFieldProps {
  field: FieldConfig
  registration: UseFormRegisterReturn
  error?: string
  data?: Record<ViewKey, EntityState>
  placeholder?: string
}

export function EntityField({ field, registration, error, data, placeholder }: EntityFieldProps) {
  const relationRows = field.relation ? data?.[field.relation]?.rows ?? [] : []
  const options = field.relation
    ? relationRows.map((row) => ({
        value: String(row.id ?? ''),
        label: getRelationLabel(field.relation as 'users' | 'trips', relationRows, row.id as string | number | null | undefined),
      }))
    : field.options?.map((option) => ({ value: option, label: option })) ?? []

  const inputClass = `input-uride ${error ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' : ''}`

  return (
    <div className="space-y-1.5">
      <label className="label-uride flex justify-between">
        <span>{field.label}</span>
      </label>
      
      {field.kind === 'textarea' ? (
        <textarea
          {...registration}
          className={`${inputClass} min-h-20 resize-y`}
          placeholder={placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
        />
      ) : field.kind === 'select' ? (
        <div className="relative">
          <select
            {...registration}
            className={`${inputClass} appearance-none pr-10`}
          >
            <option value="">{placeholder ?? `Seleccionar ${field.label.toLowerCase()}`}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400 pointer-events-none" />
        </div>
      ) : (
        <input
          type={field.kind === 'number' || field.kind === 'datetime-local' ? field.kind : 'text'}
          {...registration}
          className={inputClass}
          placeholder={placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
        />
      )}

      {error && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-medium uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
