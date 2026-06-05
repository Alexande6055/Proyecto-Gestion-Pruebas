import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EntityView } from '../pages/Entity/EntityView'
import type { AuthSession, EntityConfig, EntityState, ViewKey } from '../types'
import { managedViews } from '../constants/entities'
import { tripsService } from '../services'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../services', () => ({
  normalizeBackendRow: vi.fn((row) => row),
  usersService: {
    create: vi.fn(),
    update: vi.fn(),
    resetPassword: vi.fn(),
  },
  tripsService: {
    create: vi.fn(),
    complete: vi.fn(),
    detail: vi.fn(),
  },
  requestsService: {
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  ratingsService: {
    create: vi.fn(),
  },
  reportsService: {
    create: vi.fn(),
  },
}))

const createEntityState = (rows: any[] = []): EntityState => ({
  rows,
  loading: false,
  error: null,
})

const sessionMock: AuthSession = {
  token: 'token-prueba',
  user: {
    id: 1,
    nombre: 'Ana Torres',
    correo_institucional: 'ana@uta.edu.ec',
    rol: 'admin',
  },
} as AuthSession

const createData = (): Record<ViewKey, EntityState> => {
  const data = Object.fromEntries(
    managedViews.map((key) => [key, createEntityState()])
  ) as Record<ViewKey, EntityState>

  data.users = createEntityState([
    {
      id: 1,
      nombre: 'Ana Torres',
      name: 'Ana Torres',
      rol: 'estudiante',
    },
    {
      id: 2,
      nombre: 'Carlos Perez',
      name: 'Carlos Perez',
      rol: 'conductor',
    },
  ])

  data.trips = createEntityState([
    {
      id: 10,
      conductor_id: 1,
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05T08:00',
      cupos_disponibles: 3,
      estado: 'abierto',
    },
    {
      id: 11,
      conductor_id: 2,
      origen_zona: 'FISEI',
      destino_zona: 'Mall de los Andes',
      fecha_hora: '2026-06-05T12:00',
      cupos_disponibles: 0,
      estado: 'completo',
    },
  ])

  return data
}

const config: EntityConfig = {
  key: 'trips',
  title: 'Gestión de viajes',
  subtitle: 'Administra los viajes registrados en el sistema.',
  endpoint: '/trips',
  columns: [
    'id',
    'conductor_id',
    'origen_zona',
    'destino_zona',
    'fecha_hora',
    'cupos_disponibles',
    'estado',
  ],
  fields: [
    {
      key: 'conductor_id',
      label: 'Conductor',
      kind: 'select',
      relation: 'users',
    },
    {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    },
    {
      key: 'destino_zona',
      label: 'Destino',
      kind: 'text',
    },
    {
      key: 'fecha_hora',
      label: 'Fecha y hora',
      kind: 'datetime-local',
    },
    {
      key: 'cupos_disponibles',
      label: 'Cupos disponibles',
      kind: 'number',
    },
    {
      key: 'estado',
      label: 'Estado',
      kind: 'select',
      options: ['abierto', 'completo', 'cancelado'],
    },
  ],
}

describe('EntityView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el encabezado y los registros', () => {
    render(
      <EntityView
        config={config}
        state={createEntityState(createData().trips.rows)}
        data={createData()}
        search=""
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    expect(screen.getByText('Gestión de viajes')).toBeInTheDocument()
    expect(
      screen.getByText('Administra los viajes registrados en el sistema.')
    ).toBeInTheDocument()

    expect(screen.getByText('/trips')).toBeInTheDocument()
    expect(screen.getByText(/conectado/i)).toBeInTheDocument()

    expect(screen.getByText('Campus Huachi')).toBeInTheDocument()
    expect(screen.getByText('Centro')).toBeInTheDocument()
    expect(screen.getByText('FISEI')).toBeInTheDocument()
    expect(screen.getByText('Mall de los Andes')).toBeInTheDocument()
  })

  it('debe filtrar registros según el texto de búsqueda', () => {
    render(
      <EntityView
        config={config}
        state={createEntityState(createData().trips.rows)}
        data={createData()}
        search="Campus"
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    expect(screen.getByText('Campus Huachi')).toBeInTheDocument()
    expect(screen.getByText('Centro')).toBeInTheDocument()

    expect(screen.queryByText('FISEI')).not.toBeInTheDocument()
    expect(screen.queryByText('Mall de los Andes')).not.toBeInTheDocument()
  })

  it('debe mostrar estado vacío cuando no existen registros', () => {
    render(
      <EntityView
        config={config}
        state={createEntityState([])}
        data={createData()}
        search=""
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    expect(screen.getByText('Sin registros')).toBeInTheDocument()
  })

  it('debe mostrar mensaje de carga cuando el estado está cargando', () => {
    const state = createEntityState([])
    state.loading = true

    render(
      <EntityView
        config={config}
        state={state}
        data={createData()}
        search=""
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    expect(screen.getByText('Cargando datos')).toBeInTheDocument()
    expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
    expect(screen.getByText('/trips')).toBeInTheDocument()
  })

  it('debe mostrar mensaje de error cuando falla la conexión', () => {
    const state = createEntityState([])
    state.error = 'Error de servidor'

    render(
      <EntityView
        config={config}
        state={state}
        data={createData()}
        search=""
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    expect(screen.getByText('No se pudo conectar')).toBeInTheDocument()
    expect(screen.getByText(/Revisa que el backend exponga \/trips/i)).toBeInTheDocument()
    expect(screen.getByText(/sin conexión/i)).toBeInTheDocument()
  })

  it('debe permitir completar los campos del formulario', () => {
    const { container } = render(
      <EntityView
        config={config}
        state={createEntityState(createData().trips.rows)}
        data={createData()}
        search=""
        session={sessionMock}
        onCreated={vi.fn()}
      />
    )

    const form = container.querySelector('form') as HTMLFormElement
    expect(form).toBeInTheDocument()

    const selects = form.querySelectorAll('select')
    const inputs = form.querySelectorAll('input')

    expect(selects.length).toBeGreaterThanOrEqual(1)
    expect(inputs.length).toBeGreaterThanOrEqual(1)

    fireEvent.change(selects[0], {
      target: { value: '1' },
    })

    fireEvent.change(inputs[0], {
      target: { value: 'UTA' },
    })

    expect(selects[0]).toHaveValue('1')
    expect(inputs[0]).toHaveValue('UTA')
  })

  it('debe renderizar el botón guardar del formulario', () => {
  render(
    <EntityView
      config={config}
      state={createEntityState(createData().trips.rows)}
      data={createData()}
      search=""
      session={sessionMock}
      onCreated={vi.fn()}
    />
  )

  const guardarButton = screen.getByRole('button', { name: /guardar/i })

  expect(guardarButton).toBeInTheDocument()
  expect(guardarButton).toHaveAttribute('type', 'submit')
})
})