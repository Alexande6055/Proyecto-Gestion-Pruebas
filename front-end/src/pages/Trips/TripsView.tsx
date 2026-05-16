import { useState, useMemo, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  Loader2,
  Save,
  Eye,
  CheckCircle2,
  Search,
  Database,
  Plus,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { EntityHeader } from '../../components/page/EntityHeader'
import { EntityMessages } from '../../components/page/EntityMessages'
import { EntityField } from '../../components/page/EntityField'
import { EntityTable } from '../../components/page/EntityTable'
import { EntityDetailModal } from '../../components/page/EntityDetailModal'
import type { AuthSession, EntityState, EntityRow, ViewKey } from '../../types'
import { normalizeBackendRow } from '../../services'
import { tripsService } from '../../services'
import { statusTone } from '../../constants/entities'
import { tripSchema, type TripFormData } from '../../schemas/tripSchema'

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

export function TripsView({ state, data, onCreated }: TripsViewProps) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [detailRow, setDetailRow] = useState<EntityRow | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  })

  const filteredRows = useMemo(() => {
    const term = ''
    if (!term) return state.rows
    return state.rows.filter((row) =>
      config.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(term)),
    )
  }, [state.rows])

  const onFormSubmit = async (formData: TripFormData) => {
    setSaving(true)
    setSaveError('')
    setActionMessage('')

    try {
      await tripsService.create(formData)
      reset()
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
      <EntityHeader
        icon={<Database className="w-5 h-5 text-blue-600" />}
        title={config.title}
        subtitle={config.subtitle}
        endpoint={config.endpoint}
        statusText={state.error ? 'sin conexión' : state.loading ? 'cargando' : 'conectado'}
        statusTone={state.error ? 'danger' : state.loading ? 'info' : 'ok'}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <EntityMessages actionMessage={actionMessage} saveError={saveError} />

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* FORM PANEL */}
          <div className="xl:col-span-4">
            <div className="card-uride sticky top-24">
              <div className="flex items-center justify-between px-6 py-4 border-b border-night-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-uride-100 to-uride-200 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-uride-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-night-900">Crear nuevo viaje</h2>
                    <p className="text-[10px] text-night-400 uppercase tracking-wider">Nuevo registro</p>
                  </div>
                </div>
                <Badge tone="neutral">{config.key}</Badge>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    <EntityField
                      key={field.key}
                      field={field}
                      data={data}
                      registration={register(field.key as keyof TripFormData)}
                      error={errors[field.key as keyof TripFormData]?.message}
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
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-night-100 to-night-200 flex items-center justify-center">
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
                    <EntityTable
                      columns={config.columns}
                      columnLabels={Object.fromEntries(config.columns.map((c) => {
                        const found = config.fields.find((f) => f.key === c)
                        const label = found?.label ?? c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
                        return [c, label]
                      }))}
                      rows={filteredRows}
                      renderCell={renderCell}
                      renderActions={(row) => (
                        <TripRowActions
                          row={row}
                          onViewTrip={handleViewTrip}
                          onCompleteTrip={handleCompleteTrip}
                        />
                      )}
                      showActions
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
        <EntityDetailModal
          title="Detalle de viaje"
          subtitle={`ID: ${String(detailRow.id ?? 'N/A')}`}
          icon={<Eye className="w-4 h-4 text-blue-600" />}
          onClose={() => setDetailRow(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(detailRow).map(([key, value]) => (
              <div key={key} className="bg-night-50 rounded-uride-xs p-3">
                <span className="text-[10px] font-bold text-night-400 uppercase tracking-wider block mb-1">{key}</span>
                <span className="text-sm font-semibold text-night-900">{formatCellText(value)}</span>
              </div>
            ))}
          </div>
        </EntityDetailModal>
      )}
    </div>
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

function formatCellText(value: EntityRow[string]) {
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}

export default TripsView
