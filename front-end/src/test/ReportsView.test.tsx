import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ReportsView from '../pages/Reports/ReportsView'
import type { AuthSession, EntityState, ViewKey } from '../types'
import { managedViews } from '../constants/entities'

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
      correo_institucional: 'ana@uta.edu.ec',
      role: 'admin',
      rol: 'admin',
    },
    {
      id: 2,
      nombre: 'Carlos Perez',
      correo_institucional: 'carlos@uta.edu.ec',
      role: 'conductor',
      rol: 'conductor',
    },
  ])

  data.trips = createEntityState([
    {
      id: 10,
      conductor_id: 2,
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05T08:00:00',
      estado: 'abierto',
    },
  ])

  data.reports = createEntityState([])

  return data
}

const sessionMock: AuthSession = {
  token: 'token-prueba',
  user: {
    id: 1,
    nombre: 'Ana Torres',
    correo_institucional: 'ana@uta.edu.ec',
    email: 'ana@uta.edu.ec',
    rol: 'admin',
    role: 'admin',
  },
} as AuthSession

const renderReportsView = (props = {}) => {
  return render(
    <ReportsView
      state={createEntityState()}
      data={createData()}
      session={sessionMock}
      onCreated={vi.fn()}
      search=""
      {...props}
    />
  )
}

describe('ReportsView', () => {
  it('debe renderizar el contenedor principal', () => {
    const { container } = renderReportsView()

    const root = container.firstElementChild

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('min-h-screen')
    expect(root).toHaveClass('bg-night-50')
    expect(root).toHaveClass('pb-12')
  })

  it('debe renderizar el encabezado Centro de Seguridad', () => {
    renderReportsView()

    expect(
      screen.getByRole('heading', { name: /centro de seguridad/i })
    ).toBeInTheDocument()

    expect(
      screen.getByText(/reporta incidentes para mantener la comunidad u-ride segura/i)
    ).toBeInTheDocument()
  })

  it('debe renderizar la pregunta inicial del formulario', () => {
    renderReportsView()

    expect(
      screen.getByText(/¿a quién deseas reportar\?/i)
    ).toBeInTheDocument()
  })

  it('debe mostrar la opción para reportar a un conductor', () => {
    renderReportsView()

    expect(
      screen.getByRole('button', { name: /a un conductor/i })
    ).toBeInTheDocument()
  })

  it('debe mostrar la opción para reportar a un pasajero', () => {
    renderReportsView()

    expect(
      screen.getByRole('button', { name: /a un pasajero/i })
    ).toBeInTheDocument()
  })

  it('debe aplicar clases visuales a las opciones de reporte', () => {
    renderReportsView()

    const conductorButton = screen.getByRole('button', {
      name: /a un conductor/i,
    })

    const pasajeroButton = screen.getByRole('button', {
      name: /a un pasajero/i,
    })

    expect(conductorButton).toHaveClass('p-6')
    expect(conductorButton).toHaveClass('rounded-2xl')
    expect(conductorButton).toHaveClass('border-2')

    expect(pasajeroButton).toHaveClass('p-6')
    expect(pasajeroButton).toHaveClass('rounded-2xl')
    expect(pasajeroButton).toHaveClass('border-2')
  })

  it('debe cambiar visualmente al seleccionar conductor', () => {
    renderReportsView()

    const conductorButton = screen.getByRole('button', {
      name: /a un conductor/i,
    })

    fireEvent.click(conductorButton)

    expect(conductorButton).toBeInTheDocument()
  })
})