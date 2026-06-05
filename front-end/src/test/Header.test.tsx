import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from '../components/layout/Header'
import type { AuthSession, NotificationItem } from '../types'

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

const notificationsMock: NotificationItem[] = [
  {
    id: '1',
    title: 'Reserva aceptada',
    description: 'Tu solicitud fue aceptada por el conductor.',
    tone: 'ok',
    createdAt: '2026-06-05T10:30:00',
  },
  {
    id: '2',
    title: 'Reserva pendiente',
    description: 'Tienes una reserva pendiente por revisar.',
    tone: 'warning',
    createdAt: '2026-06-05T11:00:00',
  },
  {
    id: '3',
    title: 'Reserva rechazada',
    description: 'Una solicitud fue rechazada.',
    tone: 'danger',
    createdAt: 'fecha-invalida',
  },
] as NotificationItem[]

const renderHeader = (props: Partial<React.ComponentProps<typeof Header>> = {}) => {
  const defaultProps: React.ComponentProps<typeof Header> = {
    activeView: 'dashboard',
    backendStatus: 'online',
    search: '',
    setSearch: vi.fn(),
    session: sessionMock,
    notifications: [],
    onNotificationsAction: vi.fn(),
    handleLogout: vi.fn(),
    isMobile: false,
    toggleSidebar: vi.fn(),
  }

  return render(<Header {...defaultProps} {...props} />)
}

describe('Header', () => {
  it('debe renderizar el breadcrumb con la vista activa', () => {
    renderHeader()

    expect(screen.getByText('Panel')).toBeInTheDocument()
    expect(screen.getByText(/resumen/i)).toBeInTheDocument()
  })

  it('debe mostrar estado verificando cuando backendStatus es checking', () => {
    renderHeader({
      backendStatus: 'checking',
    })

    expect(screen.getByText(/verificando/i)).toBeInTheDocument()
  })

  it('debe mostrar Backend online cuando backendStatus es online', () => {
    renderHeader({
      backendStatus: 'online',
    })

    expect(screen.getByText(/backend online/i)).toBeInTheDocument()
  })

  it('debe mostrar Backend offline cuando backendStatus es offline', () => {
    renderHeader({
      backendStatus: 'offline',
    })

    expect(screen.getByText(/backend offline/i)).toBeInTheDocument()
  })

  it('debe mostrar el valor actual del buscador', () => {
    renderHeader({
      search: 'Ana',
    })

    expect(screen.getByLabelText(/buscar/i)).toHaveValue('Ana')
  })

  it('debe ejecutar setSearch al escribir en el buscador', () => {
    const setSearch = vi.fn()

    renderHeader({
      setSearch,
    })

    fireEvent.change(screen.getByLabelText(/buscar/i), {
      target: { value: 'Carlos' },
    })

    expect(setSearch).toHaveBeenCalledWith('Carlos')
  })

  it('debe mostrar la información del usuario autenticado', () => {
    renderHeader()

    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('debe ejecutar handleLogout al presionar el botón de cerrar sesión', () => {
    const handleLogout = vi.fn()

    renderHeader({
      handleLogout,
    })

    fireEvent.click(screen.getByTitle(/cerrar sesion/i))

    expect(handleLogout).toHaveBeenCalledTimes(1)
  })

  it('debe mostrar botón de menú en móvil y ejecutar toggleSidebar', () => {
    const toggleSidebar = vi.fn()

    renderHeader({
      isMobile: true,
      toggleSidebar,
    })

    const menuButton = screen.getByLabelText(/abrir menu/i)

    expect(menuButton).toBeInTheDocument()

    fireEvent.click(menuButton)

    expect(toggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('no debe mostrar botón de menú cuando no es móvil', () => {
    renderHeader({
      isMobile: false,
    })

    expect(screen.queryByLabelText(/abrir menu/i)).not.toBeInTheDocument()
  })

  it('debe renderizar el botón de notificaciones', () => {
    renderHeader()

    expect(screen.getByLabelText(/abrir notificaciones/i)).toBeInTheDocument()
  })

  it('debe abrir panel de notificaciones vacío', () => {
    renderHeader({
      notifications: [],
    })

    fireEvent.click(screen.getByLabelText(/abrir notificaciones/i))

    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Sin novedades pendientes')).toBeInTheDocument()
    expect(screen.getByText('Todo al dia')).toBeInTheDocument()
    expect(
      screen.getByText('Aqui apareceran reservas y cambios importantes.')
    ).toBeInTheDocument()
  })

  it('debe mostrar contador de notificaciones', () => {
    renderHeader({
      notifications: notificationsMock,
    })

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('debe mostrar 9+ cuando hay más de nueve notificaciones', () => {
    const manyNotifications = Array.from({ length: 10 }).map((_, index) => ({
      id: String(index + 1),
      title: `Notificación ${index + 1}`,
      description: 'Descripción de prueba',
      tone: 'warning',
      createdAt: '2026-06-05T10:30:00',
    })) as NotificationItem[]

    renderHeader({
      notifications: manyNotifications,
    })

    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('debe abrir panel con notificaciones y mostrar sus datos', () => {
    renderHeader({
      notifications: notificationsMock,
    })

    fireEvent.click(screen.getByLabelText(/abrir notificaciones/i))

    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('3 novedades')).toBeInTheDocument()

    expect(screen.getByText('Reserva aceptada')).toBeInTheDocument()
    expect(screen.getByText('Tu solicitud fue aceptada por el conductor.')).toBeInTheDocument()

    expect(screen.getByText('Reserva pendiente')).toBeInTheDocument()
    expect(screen.getByText('Tienes una reserva pendiente por revisar.')).toBeInTheDocument()

    expect(screen.getByText('Reserva rechazada')).toBeInTheDocument()
    expect(screen.getByText('Una solicitud fue rechazada.')).toBeInTheDocument()
  })

  it('debe cerrar el panel y ejecutar acción al seleccionar una notificación', () => {
    const onNotificationsAction = vi.fn()

    renderHeader({
      notifications: notificationsMock,
      onNotificationsAction,
    })

    fireEvent.click(screen.getByLabelText(/abrir notificaciones/i))

    expect(screen.getByText('Reserva aceptada')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Reserva aceptada'))

    expect(onNotificationsAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Reserva aceptada')).not.toBeInTheDocument()
  })

  it('debe ejecutar acción al presionar Ver viajes y reservas', () => {
    const onNotificationsAction = vi.fn()

    renderHeader({
      notifications: notificationsMock,
      onNotificationsAction,
    })

    fireEvent.click(screen.getByLabelText(/abrir notificaciones/i))
    fireEvent.click(screen.getByRole('button', { name: /ver viajes y reservas/i }))

    expect(onNotificationsAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Reserva aceptada')).not.toBeInTheDocument()
  })

  it('debe cerrar el panel de notificaciones al volver a presionar el botón', () => {
    renderHeader({
      notifications: notificationsMock,
    })

    const button = screen.getByLabelText(/abrir notificaciones/i)

    fireEvent.click(button)

    expect(screen.getByText('Notificaciones')).toBeInTheDocument()

    fireEvent.click(button)

    expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument()
  })

  it('debe renderizar el header con sus clases principales', () => {
    const { container } = renderHeader()

    const header = container.querySelector('header')

    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('h-16')
    expect(header).toHaveClass('bg-white/80')
    expect(header).toHaveClass('sticky')
    expect(header).toHaveClass('top-0')
    expect(header).toHaveClass('px-4')
    expect(header).toHaveClass('md:px-6')
  })

  it('debe renderizar clases principales del contenedor de sesión', () => {
    const { container } = renderHeader()

    const sessionContainer = container.querySelector('.border-l.border-night-200')

    expect(sessionContainer).toBeInTheDocument()
    expect(sessionContainer).toHaveClass('flex')
    expect(sessionContainer).toHaveClass('items-center')
    expect(sessionContainer).toHaveClass('gap-3')
  })
})