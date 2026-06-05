import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DashboardView } from '../pages/Dashboard/DashboardView'
import type { AuthSession, EntityState, ViewKey } from '../types'
import { managedViews } from '../constants/entities'

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
    email: 'ana@uta.edu.ec',
    correo_institucional: 'ana@uta.edu.ec',
    rol: 'admin',
    role: 'admin',
  },
} as AuthSession

const createDashboardData = (): Record<ViewKey, EntityState> => {
  const baseData = Object.fromEntries(
    managedViews.map((key) => [key, createEntityState()])
  ) as Record<ViewKey, EntityState>

  baseData.users = createEntityState([
    {
      id: 1,
      nombre: 'Ana Torres',
      name: 'Ana Torres',
      correo_institucional: 'ana@uta.edu.ec',
      reputacion_promedio: 4.0,
    },
    {
      id: 2,
      nombre: 'Carlos Perez',
      name: 'Carlos Perez',
      correo_institucional: 'carlos@uta.edu.ec',
      reputacion_promedio: 3.8,
    },
  ])

  baseData.trips = createEntityState([
    {
      id: 1,
      conductor_id: 1,
      origen_zona: 'Campus Huachi',
      destino_zona: 'Centro',
      fecha_hora: '2026-06-05 08:00',
      estado: 'abierto',
      cupos_disponibles: 3,
    },
    {
      id: 2,
      conductor_id: 2,
      origen_zona: 'FISEI',
      destino_zona: 'Mall de los Andes',
      fecha_hora: '2026-06-05 12:00',
      estado: 'completo',
      cupos_disponibles: 0,
    },
    {
      id: 3,
      conductor_id: 1,
      origen_zona: 'UTA',
      destino_zona: 'Terminal',
      fecha_hora: '2026-06-05 18:00',
      estado: 'cancelado',
      cupos_disponibles: 2,
    },
  ])

  baseData.requests = createEntityState([
    {
      id: 1,
      viaje_id: 1,
      pasajero_id: 2,
      estado: 'pendiente',
    },
    {
      id: 2,
      viaje_id: 2,
      pasajero_id: 1,
      estado: 'aceptada',
    },
  ])

  baseData.ratings = createEntityState([
    {
      id: 1,
      viaje_id: 1,
      calificador_id: 2,
      calificado_id: 1,
      puntuacion: 5,
    },
    {
      id: 2,
      viaje_id: 2,
      calificador_id: 1,
      calificado_id: 2,
      puntuacion: 3,
    },
  ])

  baseData.reports = createEntityState([
    {
      id: 1,
      viaje_id: 1,
      reportante_id: 1,
      reportado_id: 2,
      motivo: 'Retraso en el viaje',
      estado: 'pendiente',
    },
    {
      id: 2,
      viaje_id: 2,
      reportante_id: 2,
      reportado_id: 1,
      motivo: 'Solicitud revisada',
      estado: 'resuelto',
    },
  ])

  return baseData
}

const renderDashboard = (data = createDashboardData()) => {
  return render(
    <MemoryRouter>
      <DashboardView data={data} session={sessionMock} />
    </MemoryRouter>
  )
}

describe('DashboardView', () => {
  it('debe renderizar el contenedor principal del dashboard con sus clases actuales', () => {
    const { container } = renderDashboard()

    const mainContainer = container.firstElementChild

    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveClass('min-h-screen')
    expect(mainContainer).toHaveClass('bg-night-50')
  })

  it('debe renderizar el panel principal del dashboard', () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', {
        name: /gestion de transporte compartido estudiantil/i,
      })
    ).toBeInTheDocument()

    expect(screen.getByText(/panel conectado al backend/i)).toBeInTheDocument()
    expect(screen.getAllByText(/panel administrativo/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/en linea/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /nuevo viaje/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nuevo reporte/i })).toBeInTheDocument()
  })

  it('debe aplicar clases visuales actuales a los botones principales', () => {
    renderDashboard()

    const nuevoViajeButton = screen.getByRole('button', { name: /nuevo viaje/i })
    const nuevoReporteButton = screen.getByRole('button', { name: /nuevo reporte/i })

    expect(nuevoViajeButton).toHaveClass('btn-uride-primary')
    expect(nuevoReporteButton).toHaveClass('btn-uride-secondary')
  })

  it('debe calcular correctamente las tarjetas estadísticas', () => {
    renderDashboard()

    expect(screen.getAllByText('Usuarios').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Viajes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Solicitudes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ratings').length).toBeGreaterThan(0)

    expect(screen.getByText('Registros activos en el sistema')).toBeInTheDocument()
    expect(screen.getByText('Viajes abiertos o completos')).toBeInTheDocument()
    expect(screen.getByText('Pendientes de aprobacion')).toBeInTheDocument()
    expect(screen.getByText('Calificacion promedio')).toBeInTheDocument()

    expect(screen.getByText('Requieren atencion inmediata')).toBeInTheDocument()
    expect(screen.getByText('Excelente reputacion')).toBeInTheDocument()

    expect(screen.getByText('4.0')).toBeInTheDocument()
    expect(screen.getByText('/5')).toBeInTheDocument()
  })

  it('debe mostrar viajes recientes cuando existen registros', () => {
    renderDashboard()

    expect(screen.getByText('Viajes recientes')).toBeInTheDocument()
    expect(screen.getByText('Ultimos 6 registros activos')).toBeInTheDocument()

    expect(screen.getByText('2026-06-05 08:00')).toBeInTheDocument()
    expect(screen.getByText('Campus Huachi')).toBeInTheDocument()
    expect(screen.getByText('Centro')).toBeInTheDocument()
    expect(screen.getByText('3 cupos')).toBeInTheDocument()
    expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0)
  })

  it('debe mostrar reportes activos cuando existen registros', () => {
    renderDashboard()

    expect(screen.getByText('Reportes activos')).toBeInTheDocument()
    expect(screen.getByText('1 abiertos de 2 total')).toBeInTheDocument()

    expect(screen.getByText(/Retraso en el viaje/i)).toBeInTheDocument()
    expect(screen.getByText(/Solicitud revisada/i)).toBeInTheDocument()

    expect(screen.getAllByText('pendiente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('resuelto').length).toBeGreaterThan(0)
  })

  it('debe mostrar la sección de actividad del sistema', () => {
    renderDashboard()

    expect(screen.getByText('Actividad del sistema')).toBeInTheDocument()
    expect(screen.getByText('Resumen general de todas las entidades')).toBeInTheDocument()

    expect(screen.getByText('Usuarios: 2')).toBeInTheDocument()
    expect(screen.getByText('Viajes: 3')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes: 2')).toBeInTheDocument()
    expect(screen.getByText('Calificaciones: 2')).toBeInTheDocument()
  })

  it('debe mostrar el resumen de actividad inferior', () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /resumen de actividad/i })
    ).toBeInTheDocument()

    expect(
      screen.getByText(/2 usuarios · 3 viajes · 2 solicitudes · 2 calificaciones/i)
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /gestionar usuarios/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver viajes/i })).toBeInTheDocument()
  })

  it('debe mostrar estados vacíos cuando no hay viajes ni reportes', () => {
    const data = createDashboardData()

    data.trips = createEntityState([])
    data.reports = createEntityState([])

    renderDashboard(data)

    expect(screen.getByText('Sin viajes')).toBeInTheDocument()

    expect(
      screen.getByText('Cuando el backend devuelva trips, apareceran aqui.')
    ).toBeInTheDocument()

    expect(screen.getByText('Sin reportes')).toBeInTheDocument()

    expect(
      screen.getByText('Cuando el backend devuelva reports, apareceran aqui.')
    ).toBeInTheDocument()
  })

  it('debe ocultar el valor de usuarios cuando la entidad está cargando', () => {
    const data = createDashboardData()
    data.users.loading = true

    const { container } = renderDashboard(data)

    const cards = container.querySelectorAll('.card-uride')

    expect(cards.length).toBeGreaterThan(0)

    const firstStatCard = cards[0] as HTMLElement

    expect(firstStatCard).toHaveTextContent('Usuarios')
    expect(firstStatCard).toHaveTextContent('Registros activos en el sistema')
    expect(firstStatCard.querySelector('svg')).toBeInTheDocument()
  })
})