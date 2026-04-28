import { useState, useMemo, type FormEvent, type ReactNode } from 'react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import type { ViewKey, EntityState, EntityConfig, EntityRow, FieldConfig } from '../../types'
import { requestJson } from '../../services/api'
import { statusTone } from '../../constants/entities'
import { getRelationLabel } from '../../utils/entityHelpers'

interface EntityViewProps {
  config: EntityConfig
  state: EntityState
  data: Record<ViewKey, EntityState>
  search: string
  onCreated: () => void
}

export function EntityView({ config, state, data, search, onCreated }: EntityViewProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return state.rows
    return state.rows.filter((row) =>
      config.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(term)),
    )
  }, [config.columns, search, state.rows])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')

    try {
      await requestJson(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setFormData({})
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="view-stack">
      <section className="section-head">
        <div>
          <p className="eyebrow">Modulo</p>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <Badge tone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}>
          {state.error ? 'sin conexion' : state.loading ? 'cargando' : 'backend'}
        </Badge>
      </section>

      <section className="entity-layout">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-title">
            <h2>Formulario</h2>
            <Badge tone="neutral">{config.key}</Badge>
          </div>
          <div className="form-grid">
            {config.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                data={data}
                value={formData[field.key] ?? ''}
                onChange={(value) => setFormData((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </form>

        <div className="panel content-panel">
          <div className="panel-title">
            <h2>Registros</h2>
            <Badge tone="neutral">{String(filteredRows.length)}</Badge>
          </div>
          {state.loading && <EmptyState title="Cargando datos" message={`Consultando ${config.endpoint}.`} />}
          {state.error && <EmptyState title="No se pudo conectar" message={`Revisa que el backend exponga ${config.endpoint}. Error: ${state.error}`} />}
          {!state.loading && !state.error && !filteredRows.length && (
            <EmptyState title="Sin registros" message="El backend respondio correctamente, pero no envio datos para esta entidad." />
          )}
          {!state.loading && !state.error && Boolean(filteredRows.length) && (
            <Table columns={config.columns} rows={filteredRows} config={config} data={data} />
          )}
        </div>
      </section>
    </div>
  )
}

function Field({
  field,
  data,
  value,
  onChange,
}: {
  field: FieldConfig
  data: Record<ViewKey, EntityState>
  value: string
  onChange: (value: string) => void
}) {
  const relationRows = field.relation ? data[field.relation].rows : []
  const options = field.relation ? relationRows.map((row) => ({
    value: String(row.id ?? ''),
    label: getRelationLabel(field.relation, relationRows, row.id),
  })) : field.options?.map((option) => ({ value: option, label: option })) ?? []

  return (
    <label className="field">
      <span>{field.label}</span>
      {field.kind === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : field.kind === 'select' ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.kind === 'number' || field.kind === 'datetime-local' ? field.kind : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

function Table({
  columns,
  rows,
  config,
  data,
}: {
  columns: string[]
  rows: EntityRow[]
  config: EntityConfig
  data: Record<ViewKey, EntityState>
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id ?? JSON.stringify(row))}>
              {columns.map((column) => {
                const field = config.fields.find((item) => item.key === column)
                return <td key={column}>{renderCell(row[column], field, data)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderCell(value: EntityRow[string], field: FieldConfig | undefined, data: Record<ViewKey, EntityState>): ReactNode {
  const text = String(value ?? '')

  if (field?.relation) {
    return getRelationLabel(field.relation, data[field.relation].rows, value)
  }

  if (field?.key === 'estado' || field?.key === 'rol') {
    return <Badge tone={statusTone[text] ?? 'neutral'}>{text}</Badge>
  }

  if (field?.key === 'password_hash' && text) {
    return <code className="hash-cell">{text}</code>
  }

  return text
}
