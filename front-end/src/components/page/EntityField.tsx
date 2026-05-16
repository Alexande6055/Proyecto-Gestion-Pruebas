import { ChevronDown } from 'lucide-react'
import type { FieldConfig, ViewKey, EntityState } from '../../types'
import { getRelationLabel } from '../../utils/entityHelpers'

interface EntityFieldProps {
  field: FieldConfig
  value: string
  data?: Record<ViewKey, EntityState>
  onChange: (value: string) => void
  placeholder?: string
}

export function EntityField({ field, value, data, onChange, placeholder }: EntityFieldProps) {
  const relationRows = field.relation ? data?.[field.relation]?.rows ?? [] : []
  const options = field.relation
    ? relationRows.map((row) => ({
        value: String(row.id ?? ''),
        label: getRelationLabel(field.relation as 'users' | 'trips', relationRows, row.id as string | number | null | undefined),
      }))
    : field.options?.map((option) => ({ value: option, label: option })) ?? []

  return (
    <div className="space-y-1.5">
      <label className="label-uride">{field.label}</label>
      {field.kind === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-uride min-h-20 resize-y"
          placeholder={placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
        />
      ) : field.kind === 'select' ? (
        <div className="relative">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="input-uride appearance-none pr-10"
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-uride"
          placeholder={placeholder ?? `Ingresa ${field.label.toLowerCase()}`}
        />
      )}
    </div>
  )
}
