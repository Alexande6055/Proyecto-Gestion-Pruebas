import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportsView from '../pages/Reports/ReportsView'
import { reportsService } from '../services'
import { toast } from 'sonner'

vi.mock('../services', () => ({
  reportsService: {
    create: vi.fn(),
    manage: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../components/common/Badge', () => ({
  Badge: ({ children, tone }: any) => (
    <span data-testid="badge" data-tone={tone}>
      {children}
    </span>
  ),
}))

const onCreatedMock = vi.fn()

const adminSession = {
  access_token: 'admin-token',
  user: {
    id: 1,
    nombre: 'Admin',
    email: 'admin@test.com',
    role: 'admin',
  },
}

const passengerSession = {
  access_token: 'passenger-token',
  user: {
    id: 2,
    nombre: 'Pasajero',
    email: 'pasajero@test.com',
    role: 'user',
  },
}

const driverSession = {
  access_token: 'driver-token',
  user: {
    id: 10,
    nombre: 'Conductor',
    email: 'conductor@test.com',
    role: 'user',
  },
}

const baseData: any = {
  dashboard: { rows: [], loading: false, error: '' },
  users: {
    rows: [
      { id: 2, nombre: 'Pasajero Uno' },
      { id: 3, nombre: 'Pasajero Dos' },
      { id: 10, nombre: 'Conductor Uno' },
    ],
    loading: false,
    error: '',
  },
  trips: {
    rows: [
      {
        id: 100,
        conductor_id: 10,
        origen_zona: 'Ambato',
        destino_zona: 'UTA',
        fecha_hora: '2026-06-05T10:00:00',
        estado: 'activo',
      },
    ],
    loading: false,
    error: '',
  },
  requests: {
    rows: [
      {
        id: 500,
        viaje_id: 100,
        pasajero_id: 2,
        estado: 'aceptada',
      },
      {
        id: 501,
        viaje_id: 100,
        pasajero_id: 3,
        estado: 'aceptada',
      },
    ],
    loading: false,
    error: '',
  },
  ratings: { rows: [], loading: false, error: '' },
  reports: { rows: [], loading: false, error: '' },
  audit_logs: { rows: [], loading: false, error: '' },
  profile: { rows: [], loading: false, error: '' },
}

const renderReportsView = ({
  session = passengerSession,
  stateRows = [],
  data = baseData,
}: any = {}) => {
  return render(
    <ReportsView
      state={{
        rows: stateRows,
        loading: false,
        error: '',
      }}
      data={data}
      session={session}
      onCreated={onCreatedMock}
    />,
  )
}

describe('ReportsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el título principal del centro de seguridad', () => {
    renderReportsView()

    expect(screen.getByText('Centro de Seguridad')).toBeInTheDocument()
    expect(
      screen.getByText('Reporta incidentes para mantener la comunidad u-Ride segura.'),
    ).toBeInTheDocument()
  })

  it('debe mostrar las opciones para reportar conductor o pasajero', () => {
    renderReportsView()

    expect(screen.getByText('¿A quién deseas reportar?')).toBeInTheDocument()
    expect(screen.getByText('A un Conductor')).toBeInTheDocument()
    expect(screen.getByText('A un Pasajero')).toBeInTheDocument()
  })

  it('debe mostrar conductores compartidos cuando el usuario elige reportar conductor', () => {
    renderReportsView({
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    expect(screen.getByText('Selecciona al usuario')).toBeInTheDocument()
    expect(screen.getByText(/Conductor Uno/)).toBeInTheDocument()
    expect(screen.getByText(/Viaje: Ambato - UTA/)).toBeInTheDocument()
  })

  it('debe mostrar pasajeros compartidos cuando el usuario elige reportar pasajero', () => {
    renderReportsView({
      session: driverSession,
    })

    fireEvent.click(screen.getByText('A un Pasajero'))

    expect(screen.getByText('Selecciona al usuario')).toBeInTheDocument()
    expect(screen.getByText(/Pasajero Uno/)).toBeInTheDocument()
    expect(screen.getByText(/Pasajero Dos/)).toBeInTheDocument()
  })

  it('debe mostrar mensaje cuando no existen usuarios compartidos', () => {
    const dataSinUsuariosCompartidos = {
      ...baseData,
      requests: {
        rows: [],
        loading: false,
        error: '',
      },
    }

    renderReportsView({
      data: dataSinUsuariosCompartidos,
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    expect(
      screen.getByText('No se encontraron usuarios compartidos en este rol.'),
    ).toBeInTheDocument()
  })

  it('debe mostrar detalle del viaje al seleccionar un usuario', () => {
    renderReportsView({
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    const select = screen.getByDisplayValue('Seleccionar usuario...')

    fireEvent.change(select, {
      target: {
        value: '10',
      },
    })

    expect(screen.getByText('Detalle del viaje relacionado')).toBeInTheDocument()
    expect(screen.getByText('Ambato → UTA')).toBeInTheDocument()
    expect(screen.getByText('activo')).toBeInTheDocument()
  })

  it('debe enviar un reporte correctamente', async () => {
    vi.mocked(reportsService.create).mockResolvedValueOnce(undefined)

    renderReportsView({
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    const select = screen.getByDisplayValue('Seleccionar usuario...')

    fireEvent.change(select, {
      target: {
        value: '10',
      },
    })

    fireEvent.change(screen.getByPlaceholderText('Describe detalladamente qué sucedió...'), {
      target: {
        value: 'El conductor no respetó el punto de encuentro',
      },
    })

    fireEvent.change(screen.getByPlaceholderText('https://ejemplo.com/foto-o-video'), {
      target: {
        value: 'https://ejemplo.com/evidencia.jpg',
      },
    })

    fireEvent.click(screen.getByText('ENVIAR REPORTE OFICIAL'))

    await waitFor(() => {
      expect(reportsService.create).toHaveBeenCalledWith({
        reportadoId: '10',
        viajeId: 100,
        motivo: 'El conductor no respetó el punto de encuentro',
        evidencia_url: 'https://ejemplo.com/evidencia.jpg',
      })
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Reporte enviado con éxito. Pendiente de revisión por administración.',
    )
    expect(onCreatedMock).toHaveBeenCalledTimes(1)
  })

  it('debe mostrar error si falla el envío del reporte', async () => {
    vi.mocked(reportsService.create).mockRejectedValueOnce(
      new Error('Error al crear reporte'),
    )

    renderReportsView({
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    const select = screen.getByDisplayValue('Seleccionar usuario...')

    fireEvent.change(select, {
      target: {
        value: '10',
      },
    })

    fireEvent.change(screen.getByPlaceholderText('Describe detalladamente qué sucedió...'), {
      target: {
        value: 'Mal comportamiento',
      },
    })

    fireEvent.click(screen.getByText('ENVIAR REPORTE OFICIAL'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al crear reporte')
    })
  })

  it('no debe mostrar formulario de envío si no se selecciona usuario', () => {
    renderReportsView({
      session: passengerSession,
    })

    fireEvent.click(screen.getByText('A un Conductor'))

    expect(screen.queryByText('ENVIAR REPORTE OFICIAL')).not.toBeInTheDocument()
    expect(reportsService.create).not.toHaveBeenCalled()
  })

  it('debe mostrar panel de administración si hay reportes pendientes y el usuario es admin', () => {
    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 1,
          reportante_id: 2,
          reportado_id: 10,
          reportante: { nombre: 'Pasajero Uno' },
          reportado: { nombre: 'Conductor Uno' },
          motivo: 'Incidente reportado',
          estado: 'pendiente',
          evidencia_url: 'https://ejemplo.com/evidencia',
        },
      ],
    })

    expect(screen.getByText('Gestión de Reportes (Admin)')).toBeInTheDocument()
    expect(screen.getAllByText('Pasajero Uno').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Conductor Uno').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('"Incidente reportado"')).toBeInTheDocument()
    expect(screen.getByText('Ver Evidencia Externa')).toBeInTheDocument()
  })

  it('debe aceptar un reporte desde administración', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Sanción aplicada')
    vi.mocked(reportsService.manage).mockResolvedValueOnce(undefined)

    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 1,
          reportante_id: 2,
          reportado_id: 10,
          motivo: 'Incidente reportado',
          estado: 'pendiente',
        },
      ],
    })

    fireEvent.click(screen.getByText('Aceptar y Penalizar'))

    await waitFor(() => {
      expect(reportsService.manage).toHaveBeenCalledWith(
        '1',
        'aceptar',
        'Sanción aplicada',
      )
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Reporte aceptado (penalización aplicada).',
    )
    expect(onCreatedMock).toHaveBeenCalledTimes(1)
  })

  it('debe rechazar un reporte desde administración', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('No hay evidencia suficiente')
    vi.mocked(reportsService.manage).mockResolvedValueOnce(undefined)

    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 2,
          reportante_id: 2,
          reportado_id: 10,
          motivo: 'Reporte dudoso',
          estado: 'pendiente',
        },
      ],
    })

    fireEvent.click(screen.getByText('Rechazar'))

    await waitFor(() => {
      expect(reportsService.manage).toHaveBeenCalledWith(
        '2',
        'rechazar',
        'No hay evidencia suficiente',
      )
    })

    expect(toast.success).toHaveBeenCalledWith('Reporte rechazado.')
  })

  it('no debe gestionar reporte si el prompt se cancela', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(null)

    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 3,
          reportante_id: 2,
          reportado_id: 10,
          motivo: 'Reporte pendiente',
          estado: 'pendiente',
        },
      ],
    })

    fireEvent.click(screen.getByText('Aceptar y Penalizar'))

    expect(reportsService.manage).not.toHaveBeenCalled()
  })

  it('debe mostrar error si falla la gestión del reporte', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Intento fallido')
    vi.mocked(reportsService.manage).mockRejectedValueOnce(
      new Error('No se pudo actualizar reporte'),
    )

    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 4,
          reportante_id: 2,
          reportado_id: 10,
          motivo: 'Reporte pendiente',
          estado: 'pendiente',
        },
      ],
    })

    fireEvent.click(screen.getByText('Aceptar y Penalizar'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar reporte')
    })
  })

  it('debe mostrar historial de reportes para usuario normal filtrando por reportante', () => {
    renderReportsView({
      session: passengerSession,
      stateRows: [
        {
          id: 1,
          reportante_id: 2,
          reportado_id: 10,
          reportado: { nombre: 'Conductor Uno' },
          motivo: 'Mi reporte',
          estado: 'pendiente',
        },
        {
          id: 2,
          reportante_id: 99,
          reportado_id: 10,
          motivo: 'Reporte de otro usuario',
          estado: 'aceptado',
        },
      ],
    })

    expect(screen.getByText('Mi Historial de Reportes')).toBeInTheDocument()
    expect(screen.getByText('Conductor Uno')).toBeInTheDocument()
    expect(screen.getByText('Mi reporte')).toBeInTheDocument()
    expect(screen.queryByText('Reporte de otro usuario')).not.toBeInTheDocument()
  })

  it('debe mostrar todos los reportes para administrador', () => {
    renderReportsView({
      session: adminSession,
      stateRows: [
        {
          id: 1,
          reportante_id: 2,
          reportado_id: 10,
          motivo: 'Reporte uno',
          estado: 'pendiente',
          accion_tomada: 'Sanción aplicada',
        },
        {
          id: 2,
          reportante_id: 3,
          reportado_id: 11,
          motivo: 'Reporte dos',
          estado: 'rechazado',
        },
      ],
    })

    expect(screen.getByText('Todos los Reportes del Sistema')).toBeInTheDocument()
    expect(screen.getAllByText('Reporte uno').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Reporte dos')).toBeInTheDocument()
    expect(screen.getByText('Sanción aplicada')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de revisión')).toBeInTheDocument()
  })
})