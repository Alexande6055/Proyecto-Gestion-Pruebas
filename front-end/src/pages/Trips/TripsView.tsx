import { useState, useMemo, type FormEvent, type ReactNode } from 'react'
import {
  AlertCircle,
  Loader2,
  Save,
  X,
  Eye,
  CheckCircle2,
  Search,
  Database,
  Plus,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import type { AuthSession, EntityState, EntityRow, FieldConfig, ViewKey } from '../../types'
import { normalizeBackendRow } from '../../services'
import { tripsService } from '../../services'
import { statusTone } from '../../constants/entities'

interface TripsViewProps {
  state: EntityState
  data: Record<ViewKey, EntityState>
  session: AuthSession
  onCreated: () => void
}

const config = {
  key: 'trips' as const,
  title: 'Viajes',
  subtitle: 'Publicacion de rutas, cupos, reglas y estado del viaje.',
  endpoint: '/trips',
  columns: [
    'id',
    'conductor_id',
    'origen_zona',
    'destino_zona',
    'fecha_hora',
    'cupos_disponibles',
    'notas_reglas',
    'estado',
    'created_at',
  ],
  fields: [
    { key: 'origen_zona', label: 'Origen zona' },
    { key: 'destino_zona', label: 'Destino zona' },
    { key: 'fecha_hora', label: 'Fecha y hora', kind: 'datetime-local' as const },
    { key: 'cupos_disponibles', label: 'Cupos disponibles', kind: 'number' as const },
    { key: 'notas_reglas', label: 'Notas y reglas', kind: 'textarea' as const },
  ],
}

export function TripsView({ state, data,  onCreated }: TripsViewProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [detailRow, setDetailRow] = useState<EntityRow | null>(null)

  const filteredRows = useMemo(() => {
    const term = ''
    if (!term) return state.rows
    return state.rows.filter((row) =>
      config.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(term)),
    )
  }, [state.rows])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    setActionMessage('')

    try {
      const payload = buildPayload(formData)

      await tripsService.create(payload)
      setFormData({})
      onCreated()
      setActionMessage('Viaje creado correctamente.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleViewTrip = async (row: EntityRow) => {
    setActionMessage('')
    setSaveError('')

    try {
      const detail = await tripsService.getById(row.id as string | number)
      setDetailRow(normalizeBackendRow(detail))
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo consultar el viaje')
    }
  }

  const handleCompleteTrip = async (row: EntityRow) => {
    if (!window.confirm('¿Finalizar este viaje?')) return

    setActionMessage('')
    setSaveError('')

    try {
      await tripsService.complete(row.id as string | number)
      setActionMessage('Viaje finalizado correctamente.')
      onCreated()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo finalizar el viaje')
    }
  }

  return (
    <div className="min-h-screen bg-night-50 pb-12">
      {/* HEADER */}
      <header className="bg-white border-b border-night-200 px-6 sm:px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-uride-xs bg-gradient-to-br from-uride-50 to-uride-100 flex items-center justify-center shadow-night">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-uride-600 uppercase tracking-widest">Módulo</span>
                  <Badge tone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}>
                    {state.error ? 'sin conexión' : state.loading ? 'cargando' : 'conectado'}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-night-900 tracking-tight">{config.title}</h1>
                <p className="text-sm text-night-500 mt-0.5">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-night-400 bg-night-50 px-4 py-2 rounded-uride-xs">
              <Database className="w-3.5 h-3.5" />
              <span className="font-mono">{config.endpoint}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* MESSAGES */}
        {(actionMessage || saveError) && (
          <div className="mb-6 space-y-3">
            {actionMessage && (
              <div className="alert-uride-info flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-info-700 flex-shrink-0" />
                <span className="font-medium">{actionMessage}</span>
              </div>
            )}
            {saveError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-uride-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-900 text-sm font-medium">{saveError}</span>
              </div>
            )}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FORM PANEL */}
          <div className="xl:col-span-4">
            <div className="card-uride sticky top-24">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-uride-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">Crear nuevo viaje</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">Nuevo registro</p>
                  </div>
                </div>
                <Badge tone="neutral">{config.key}</Badge>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-4">
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

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-uride-primary flex-1 text-sm py-2.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="xl:col-span-8">
            <div className="card-uride">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-night-100 to-night-200 flex items-center justify-center">
                    <Search className="w-4 h-4 text-night-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">Registros</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">
                      {filteredRows.length} de {state.rows.length} registros
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-night-400">Total:</span>
                  <Badge tone="neutral">{String(filteredRows.length)}</Badge>
                </div>
              </div>

              <div className="p-2">
                {state.loading && (
                  <div className="p-12">
                    <EmptyState
                      title="Cargando datos"
                      message={`Consultando ${config.endpoint}...`}
                      icon={Loader2}
                    />
                  </div>
                )}
                {state.error && (
                  <div className="p-8">
                    <EmptyState
                      title="No se pudo conectar"
                      message={`Revisa que el backend exponga ${config.endpoint}. Error: ${state.error}`}
                      icon={AlertCircle}
                    />
                  </div>
                )}
                {!state.loading && !state.error && !filteredRows.length && (
                  <div className="p-8">
                    <EmptyState
                      title="Sin registros"
                      message="El backend respondió correctamente, pero no envió datos para esta entidad."
                    />
                  </div>
                )}
                {!state.loading && !state.error && Boolean(filteredRows.length) && (
                  <div className="overflow-x-auto">
                    <TripsTable
                      columns={config.columns}
                      rows={filteredRows}
                      data={data}
                      onViewTrip={handleViewTrip}
                      onCompleteTrip={handleCompleteTrip}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night-900/40 backdrop-blur-sm">
          <div className="card-uride w-full max-w-2xl max-h-[80vh] overflow-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-night-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-night-900">Detalle de viaje</h2>
                  <p className="text-[10px] text-night-400 uppercase tracking-wider">ID: {String(detailRow.id ?? 'N/A')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="p-2 rounded-uride-xs hover:bg-night-100 transition-colors"
              >
                <X className="w-5 h-5 text-night-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(detailRow).map(([key, value]) => (
                  <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                    <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldConfig
  data: Record<ViewKey, EntityState>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="label-uride">{field.label}</label>
      {field.kind === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-uride min-h-[80px] resize-y"
          placeholder={`Ingresa ${field.label.toLowerCase()}`}
        />
      ) : (
        <input
          type={field.kind === 'number' || field.kind === 'datetime-local' ? field.kind : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-uride"
          placeholder={`Ingresa ${field.label.toLowerCase()}`}
        />
      )}
    </div>
  )
}

function TripsTable({
  columns,
  rows,
  onViewTrip,
  onCompleteTrip,
}: {
  columns: string[]
  rows: EntityRow[]
  data: Record<ViewKey, EntityState>
  onViewTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-night-100">
          {columns.map((column) => (
            <th
              key={column}
              className="text-left px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider"
            >
              {column}
            </th>
          ))}
          <th className="text-right px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider">
            acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-night-100">
        {rows.map((row) => (
          <tr
            key={String(row.id ?? JSON.stringify(row))}
            className="hover:bg-uride-50/30 transition-colors duration-150"
          >
            {columns.map((column) => (
              <td key={column} className="px-4 py-3">
                {renderCell(row, column)}
              </td>
            ))}
            <td className="px-4 py-3">
              <TripRowActions
                row={row}
                onViewTrip={onViewTrip}
                onCompleteTrip={onCompleteTrip}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TripRowActions({
  row,
  onViewTrip,
  onCompleteTrip,
}: {
  row: EntityRow
  onViewTrip: (row: EntityRow) => void
  onCompleteTrip: (row: EntityRow) => void
}) {
  const canComplete = ['abierto', 'completo'].includes(String(row.estado))

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onViewTrip(row)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-uride-xs hover:bg-blue-100 transition-colors"
      >
        <Eye className="w-3 h-3" />
        Detalle
      </button>
      {canComplete && (
        <button
          type="button"
          onClick={() => onCompleteTrip(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-uride-600 bg-uride-50 rounded-uride-xs hover:bg-uride-100 transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" />
          Finalizar
        </button>
      )}
    </div>
  )
}

function renderCell(row: EntityRow, column: string): ReactNode {
  const value = row[column]
  const text = String(value ?? '')

  if (column === 'estado' || column === 'rol') {
    return <Badge tone={statusTone[text] ?? 'neutral'}>{text}</Badge>
  }

  return <span className="text-sm text-night-700">{text}</span>
}

function buildPayload(formData: Record<string, string>) {
  const payload = Object.fromEntries(
    Object.entries(formData)
      .map(([fieldKey, value]) => [fieldKey, value.trim()])
      .filter(([, value]) => value),
  ) as Record<string, string | number>

  if (payload.cupos_disponibles) {
    payload.cupos_disponibles = Number(payload.cupos_disponibles)
  }

  return payload
}

function formatCellText(value: EntityRow[string]) {
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}
