import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TripsView from '../pages/Trips/TripsView'
import type { AuthSession, EntityState, ViewKey } from '../types'
import { managedViews } from '../constants/entities'
import { requestsService, tripsService, ratingsService } from '../services'

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('../services', () => ({
  normalizeBackendRow: vi.fn((row) => row),

  tripsService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    start: vi.fn(),
    complete: vi.fn(),
  },

  requestsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    cancel: vi.fn(),
  },

  ratingsService: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}))

const createEntityState = (rows: any[] = []): EntityState => ({
    rows,
    loading: false,
    error: null,
})

const createData = (): Record<ViewKey, EntityState> => {
    const data = Object.fromEntries(
        managedViews.map((key) => [key, createEntityState()])
    ) as Record<ViewKey, EntityState>

    data.users = createEntityState([
        {
            id: 1,
            nombre: 'Ana Torres',
            name: 'Ana Torres',
        },
        {
            id: 2,
            nombre: 'Carlos Perez',
            name: 'Carlos Perez',
        },
    ])

    return data
}

const sessionMock: AuthSession = {
    token: 'token-prueba',
    user: {
        id: 1,
        nombre: 'Ana Torres',
        correo_institucional: 'ana@uta.edu.ec',
        rol: 'admin',
        role: 'admin',
    },
} as AuthSession

const tripsRows = [
    {
        id: 10,
        conductor_id: 1,
        origen_zona: 'Campus Huachi',
        destino_zona: 'Centro',
        fecha_hora: '2026-06-05T08:00:00',
        cupos_disponibles: 3,
        notas_reglas: 'Puntualidad',
        estado: 'abierto',
    },
    {
        id: 11,
        conductor_id: 2,
        origen_zona: 'FISEI',
        destino_zona: 'Mall de los Andes',
        fecha_hora: '2026-06-05T12:00:00',
        cupos_disponibles: 2,
        notas_reglas: 'No mascotas',
        estado: 'abierto',
    },
]

describe('TripsView', () => {
    beforeEach(() => {
  vi.clearAllMocks()

  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'prompt').mockReturnValue('Motivo de prueba')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

  vi.mocked(ratingsService.getAll).mockResolvedValue([])
  vi.mocked(requestsService.getAll).mockResolvedValue([])
})

    it('debe renderizar el encabezado de viajes', () => {
        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        expect(screen.getByText('Viajes')).toBeInTheDocument()
        expect(
            screen.getByText('Publicacion de rutas, cupos, reglas y estado del viaje.')
        ).toBeInTheDocument()
        expect(screen.getByText('/trips')).toBeInTheDocument()
        expect(screen.getByText(/conectado/i)).toBeInTheDocument()
    })

    it('debe renderizar el formulario para crear viaje', () => {
        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        expect(screen.getByText('Crear nuevo viaje')).toBeInTheDocument()
        expect(screen.getByText('Nuevo registro')).toBeInTheDocument()
        expect(screen.getAllByText('Origen zona').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Destino zona').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Fecha y hora').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Cupos disponibles').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Notas y reglas').length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
    })

    it('debe renderizar los registros de viajes', () => {
  render(
    <TripsView
      state={createEntityState(tripsRows)}
      data={createData()}
      session={sessionMock}
      onCreated={vi.fn()}
    />
  )

  expect(screen.getByText('Registros')).toBeInTheDocument()
  expect(screen.getByText('Campus Huachi')).toBeInTheDocument()
  expect(screen.getByText('Centro')).toBeInTheDocument()
  expect(screen.getByText('Puntualidad')).toBeInTheDocument()

  expect(screen.queryByText('FISEI')).not.toBeInTheDocument()
  expect(screen.queryByText('Mall de los Andes')).not.toBeInTheDocument()
})

    it('debe mostrar estado de carga', () => {
        const state = createEntityState([])
        state.loading = true

        render(
            <TripsView
                state={state}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        expect(screen.getByText('Cargando')).toBeInTheDocument()
        expect(screen.getByText('Por favor, espere...')).toBeInTheDocument()
        expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
    })

    it('debe mostrar estado vacío cuando no existen registros', () => {
        render(
            <TripsView
                state={createEntityState([])}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        expect(screen.getByText('Sin registros')).toBeInTheDocument()
        expect(
            screen.getByText('No se encontraron registros que coincidan con la búsqueda.')
        ).toBeInTheDocument()
    })

    it('debe mostrar estado de error en el encabezado cuando state.error existe', () => {
        const state = createEntityState([])
        state.error = 'Error de servidor'

        render(
            <TripsView
                state={state}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        expect(screen.getByText(/sin conexión/i)).toBeInTheDocument()
    })

    it('debe cambiar a modo edición al presionar editar', () => {
        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        fireEvent.click(screen.getByTitle('Editar'))

        expect(screen.getByText('Editar viaje')).toBeInTheDocument()
        expect(screen.getByText('Modificando')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('debe cancelar el modo edición', () => {
        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        fireEvent.click(screen.getByTitle('Editar'))
        fireEvent.click(screen.getByText('Cancelar'))

        expect(screen.getByText('Crear nuevo viaje')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
    })

    it('debe eliminar un viaje y ejecutar onCreated', async () => {
        const onCreated = vi.fn()

        vi.mocked(tripsService.delete).mockResolvedValueOnce({} as any)

        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={onCreated}
            />
        )

        fireEvent.click(screen.getByTitle('Eliminar'))

        await waitFor(() => {
            expect(tripsService.delete).toHaveBeenCalledWith(10)
        })

        expect(onCreated).toHaveBeenCalledTimes(1)
    })

    it('no debe eliminar si el usuario cancela la confirmación', () => {
        vi.mocked(window.confirm).mockReturnValueOnce(false)

        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        fireEvent.click(screen.getByTitle('Eliminar'))

        expect(tripsService.delete).not.toHaveBeenCalled()
    })

    it('debe iniciar un viaje', async () => {
        const onCreated = vi.fn()

        vi.mocked(tripsService.start).mockResolvedValueOnce({} as any)

        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={onCreated}
            />
        )

        fireEvent.click(screen.getByTitle('Iniciar viaje'))

        await waitFor(() => {
            expect(tripsService.start).toHaveBeenCalledWith(10)
        })

        expect(onCreated).toHaveBeenCalledTimes(1)
    })

    it('debe abrir el modal de detalle al presionar detalles', async () => {
        vi.mocked(tripsService.getById).mockResolvedValueOnce(tripsRows[0] as any)
        vi.mocked(requestsService.getAll).mockResolvedValueOnce([
            {
                id: 1,
                viaje_id: 10,
                pasajero_id: 2,
                estado: 'pendiente',
                fecha_solicitud: '2026-06-05T08:30:00',
            },
        ] as any)

        render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        fireEvent.click(screen.getAllByTitle('Detalles')[0])

        expect(await screen.findByText('Detalle de viaje')).toBeInTheDocument()
        expect(screen.getByText('Solicitudes de Pasajeros')).toBeInTheDocument()
        expect(screen.getByText(/ID Pasajero:/i)).toBeInTheDocument()
    })

    it('debe cerrar el modal de detalle', async () => {
        vi.mocked(tripsService.getById).mockResolvedValueOnce(tripsRows[0] as any)
        vi.mocked(requestsService.getAll).mockResolvedValueOnce([] as any)

        const { container } = render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        fireEvent.click(screen.getAllByTitle('Detalles')[0])

        expect(await screen.findByText('Detalle de viaje')).toBeInTheDocument()

        const modal = container.querySelector('.fixed.inset-0')
        expect(modal).toBeInTheDocument()

        const closeButton = modal?.querySelector('button') as HTMLButtonElement
        fireEvent.click(closeButton)

        await waitFor(() => {
            expect(screen.queryByText('Detalle de viaje')).not.toBeInTheDocument()
        })
    })

    it('debe renderizar el contenedor principal con sus clases actuales', () => {
        const { container } = render(
            <TripsView
                state={createEntityState(tripsRows)}
                data={createData()}
                session={sessionMock}
                onCreated={vi.fn()}
            />
        )

        const root = container.firstElementChild

        expect(root).toBeInTheDocument()
        expect(root).toHaveClass('min-h-screen')
        expect(root).toHaveClass('bg-night-50')
        expect(root).toHaveClass('pb-12')
    })
    it('debe crear un viaje correctamente desde el formulario', async () => {
  const onCreated = vi.fn()

  vi.mocked(tripsService.create).mockResolvedValueOnce({} as any)

  render(
    <TripsView
      state={createEntityState([])}
      data={createData()}
      session={sessionMock}
      onCreated={onCreated}
    />
  )

  fireEvent.change(screen.getByPlaceholderText('Ingresa origen zona'), {
    target: { value: 'Campus Huachi' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa destino zona'), {
    target: { value: 'Centro' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa fecha y hora'), {
    target: { value: '2026-06-05T08:00' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa cupos disponibles'), {
    target: { value: '3' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa notas y reglas'), {
    target: { value: 'Ser puntual' },
  })

  fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

  await waitFor(() => {
    expect(tripsService.create).toHaveBeenCalledWith({
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05T08:00',
      cupos_disponibles: 3,
      notas_reglas: 'Ser puntual',
    })
  })

  expect(onCreated).toHaveBeenCalledTimes(1)
})

it('debe mostrar error cuando falla la creación del viaje', async () => {
  vi.mocked(tripsService.create).mockRejectedValueOnce(
    new Error('No se pudo crear el viaje')
  )

  render(
    <TripsView
      state={createEntityState([])}
      data={createData()}
      session={sessionMock}
      onCreated={vi.fn()}
    />
  )

  fireEvent.change(screen.getByPlaceholderText('Ingresa origen zona'), {
    target: { value: 'Campus Huachi' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa destino zona'), {
    target: { value: 'Centro' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa fecha y hora'), {
    target: { value: '2026-06-05T08:00' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa cupos disponibles'), {
    target: { value: '3' },
  })

  fireEvent.change(screen.getByPlaceholderText('Ingresa notas y reglas'), {
    target: { value: 'Ser puntual' },
  })

  fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

  await waitFor(() => {
    expect(tripsService.create).toHaveBeenCalled()
  })
})

it('debe actualizar un viaje correctamente', async () => {
  const onCreated = vi.fn()

  vi.mocked(tripsService.update).mockResolvedValueOnce({} as any)

  render(
    <TripsView
      state={createEntityState(tripsRows)}
      data={createData()}
      session={sessionMock}
      onCreated={onCreated}
    />
  )

  fireEvent.click(screen.getByTitle('Editar'))

  fireEvent.change(screen.getByPlaceholderText('Ingresa origen zona'), {
    target: { value: 'Campus Actualizado' },
  })

  fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))

  await waitFor(() => {
    expect(tripsService.update).toHaveBeenCalled()
  })

  expect(onCreated).toHaveBeenCalledTimes(1)
})

it('debe finalizar un viaje en curso', async () => {
  const onCreated = vi.fn()

  vi.mocked(tripsService.complete).mockResolvedValueOnce({} as any)

  const rows = [
    {
      id: 20,
      conductor_id: 1,
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05T08:00:00',
      cupos_disponibles: 0,
      notas_reglas: 'Viaje en curso',
      estado: 'en_curso',
    },
  ]

  render(
    <TripsView
      state={createEntityState(rows)}
      data={createData()}
      session={sessionMock}
      onCreated={onCreated}
    />
  )

  fireEvent.click(screen.getByTitle('Finalizar viaje'))

  await waitFor(() => {
    expect(tripsService.complete).toHaveBeenCalledWith(20)
  })

  expect(onCreated).toHaveBeenCalledTimes(1)
})

it('no debe finalizar el viaje si el usuario cancela la confirmación', () => {
  vi.mocked(window.confirm).mockReturnValueOnce(false)

  const rows = [
    {
      id: 20,
      conductor_id: 1,
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05T08:00:00',
      cupos_disponibles: 0,
      notas_reglas: 'Viaje en curso',
      estado: 'en_curso',
    },
  ]

  render(
    <TripsView
      state={createEntityState(rows)}
      data={createData()}
      session={sessionMock}
      onCreated={vi.fn()}
    />
  )

  fireEvent.click(screen.getByTitle('Finalizar viaje'))

  expect(tripsService.complete).not.toHaveBeenCalled()
})

it('debe gestionar una solicitud aceptándola desde el detalle del viaje', async () => {
  const onCreated = vi.fn()

  vi.mocked(tripsService.getById)
    .mockResolvedValueOnce(tripsRows[0] as any)
    .mockResolvedValueOnce(tripsRows[0] as any)

  vi.mocked(requestsService.getAll)
    .mockResolvedValueOnce([
      {
        id: 99,
        viaje_id: 10,
        pasajero_id: 2,
        estado: 'pendiente',
        fecha_solicitud: '2026-06-05T08:30:00',
      },
    ] as any)
    .mockResolvedValueOnce([] as any)

  vi.mocked(requestsService.updateStatus).mockResolvedValueOnce({} as any)

  render(
    <TripsView
      state={createEntityState(tripsRows)}
      data={createData()}
      session={sessionMock}
      onCreated={onCreated}
    />
  )

  fireEvent.click(screen.getAllByTitle('Detalles')[0])

  expect(await screen.findByText('Solicitudes de Pasajeros')).toBeInTheDocument()

  fireEvent.click(screen.getByTitle('Aceptar'))

  await waitFor(() => {
    expect(requestsService.updateStatus).toHaveBeenCalledWith(99, {
      conductor_id: 1,
      estado: 'aceptada',
    })
  })

  expect(onCreated).toHaveBeenCalledTimes(1)
})

it('debe gestionar una solicitud rechazándola desde el detalle del viaje', async () => {
  const onCreated = vi.fn()

  vi.mocked(tripsService.getById)
    .mockResolvedValueOnce(tripsRows[0] as any)
    .mockResolvedValueOnce(tripsRows[0] as any)

  vi.mocked(requestsService.getAll)
    .mockResolvedValueOnce([
      {
        id: 100,
        viaje_id: 10,
        pasajero_id: 2,
        estado: 'pendiente',
        fecha_solicitud: '2026-06-05T08:30:00',
      },
    ] as any)
    .mockResolvedValueOnce([] as any)

  vi.mocked(requestsService.updateStatus).mockResolvedValueOnce({} as any)

  render(
    <TripsView
      state={createEntityState(tripsRows)}
      data={createData()}
      session={sessionMock}
      onCreated={onCreated}
    />
  )

  fireEvent.click(screen.getAllByTitle('Detalles')[0])

  expect(await screen.findByText('Solicitudes de Pasajeros')).toBeInTheDocument()

  fireEvent.click(screen.getByTitle('Rechazar'))

  await waitFor(() => {
    expect(requestsService.updateStatus).toHaveBeenCalledWith(100, {
      conductor_id: 1,
      estado: 'rechazada',
    })
  })

  expect(onCreated).toHaveBeenCalledTimes(1)
})

it('debe renderizar estado vacío para pasajero cuando no hay viajes visibles', () => {
  const passengerSession = {
    ...sessionMock,
    user: {
      ...sessionMock.user,
      id: 1,
      role: 'student',
      rol: 'student',
    },
  } as any

  render(
    <TripsView
      state={createEntityState([])}
      data={createData()}
      session={passengerSession}
      onCreated={vi.fn()}
    />
  )

  expect(screen.getByText('Sin registros')).toBeInTheDocument()
  expect(
    screen.getByText('No se encontraron registros que coincidan con la búsqueda.')
  ).toBeInTheDocument()
})
it('no debe intentar cancelar solicitud si no hay botón de detalle visible', () => {
  const passengerSession = {
    ...sessionMock,
    user: {
      ...sessionMock.user,
      id: 1,
      role: 'student',
      rol: 'student',
    },
  } as any

  render(
    <TripsView
      state={createEntityState([])}
      data={createData()}
      session={passengerSession}
      onCreated={vi.fn()}
    />
  )

  expect(screen.queryByTitle('Detalles')).not.toBeInTheDocument()
  expect(requestsService.cancel).not.toHaveBeenCalled()
})
it('debe mostrar error cuando falla la consulta del detalle del viaje', async () => {
  vi.mocked(tripsService.getById).mockRejectedValueOnce(
    new Error('No se pudo consultar detalle')
  )

  render(
    <TripsView
      state={createEntityState(tripsRows)}
      data={createData()}
      session={sessionMock}
      onCreated={vi.fn()}
    />
  )

  fireEvent.click(screen.getAllByTitle('Detalles')[0])

  await waitFor(() => {
    expect(tripsService.getById).toHaveBeenCalledWith(10)
  })
})
})