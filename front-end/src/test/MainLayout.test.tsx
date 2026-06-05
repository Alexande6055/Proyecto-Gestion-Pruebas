import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MainLayout } from '../components/layout/MainLayout'
import type { AuthSession, NotificationItem, ViewKey } from '../types'

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Contenido de la ruta</div>,
}))

vi.mock('../components/layout/Sidebar', () => ({
  Sidebar: ({
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    visibleViews,
  }: any) => (
    <aside data-testid="sidebar">
      <span>sidebarOpen:{String(sidebarOpen)}</span>
      <span>isMobile:{String(isMobile)}</span>
      <span>visibleViews:{visibleViews.join(',')}</span>
      <button type="button" onClick={() => setSidebarOpen(false)}>
        Cerrar sidebar mock
      </button>
    </aside>
  ),
}))

vi.mock('../components/layout/Header', () => ({
  Header: ({
    activeView,
    backendStatus,
    search,
    setSearch,
    session,
    notifications,
    onNotificationsAction,
    handleLogout,
    isMobile,
    toggleSidebar,
  }: any) => (
    <header data-testid="header">
      <span>activeView:{activeView}</span>
      <span>backendStatus:{backendStatus}</span>
      <span>search:{search}</span>
      <span>user:{session.user.nombre}</span>
      <span>notifications:{notifications.length}</span>
      <span>headerMobile:{String(isMobile)}</span>

      <button type="button" onClick={() => setSearch('Carlos')}>
        Buscar mock
      </button>

      <button type="button" onClick={onNotificationsAction}>
        Notificaciones mock
      </button>

      <button type="button" onClick={handleLogout}>
        Logout mock
      </button>

      <button type="button" onClick={toggleSidebar}>
        Toggle sidebar mock
      </button>
    </header>
  ),
}))

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
    description: 'Tu solicitud fue aceptada.',
    tone: 'ok',
    createdAt: '2026-06-05T10:30:00',
  },
] as NotificationItem[]

const defaultProps = {
  sidebarOpen: true,
  setSidebarOpen: vi.fn(),
  isMobile: false,
  toggleSidebar: vi.fn(),
  visibleViews: ['dashboard', 'users', 'trips'] as ViewKey[],
  activeView: 'dashboard' as ViewKey,
  backendStatus: 'online' as const,
  search: '',
  setSearch: vi.fn(),
  session: sessionMock,
  notifications: notificationsMock,
  onNotificationsAction: vi.fn(),
  handleLogout: vi.fn(),
}

const renderMainLayout = (
  props: Partial<React.ComponentProps<typeof MainLayout>> = {}
) => {
  return render(<MainLayout {...defaultProps} {...props} />)
}

describe('MainLayout', () => {
  it('debe renderizar el layout principal', () => {
    renderMainLayout()

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('debe renderizar el contenedor principal con sus clases actuales', () => {
    const { container } = renderMainLayout()

    const root = container.firstElementChild

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('h-screen')
    expect(root).toHaveClass('min-h-screen')
    expect(root).toHaveClass('bg-night-50')
    expect(root).toHaveClass('flex')
    expect(root).toHaveClass('overflow-hidden')
    expect(root).toHaveClass('relative')
  })

  it('debe renderizar la sección de contenido con sus clases actuales', () => {
    const { container } = renderMainLayout()

    const section = container.querySelector('section')

    expect(section).toBeInTheDocument()
    expect(section).toHaveClass('flex-1')
    expect(section).toHaveClass('flex')
    expect(section).toHaveClass('flex-col')
    expect(section).toHaveClass('min-h-0')
    expect(section).toHaveClass('min-w-0')
    expect(section).toHaveClass('bg-night-50')
  })

  it('debe renderizar el main con Outlet y clases actuales', () => {
    const { container } = renderMainLayout()

    const main = container.querySelector('main')

    expect(main).toBeInTheDocument()
    expect(main).toHaveClass('flex-1')
    expect(main).toHaveClass('min-h-0')
    expect(main).toHaveClass('overflow-y-auto')
    expect(main).toHaveClass('p-4')
    expect(main).toHaveClass('md:p-6')

    expect(screen.getByTestId('outlet')).toHaveTextContent('Contenido de la ruta')
  })

  it('debe pasar props principales a Sidebar', () => {
    renderMainLayout({
      sidebarOpen: true,
      isMobile: true,
      visibleViews: ['dashboard', 'users'] as ViewKey[],
    })

    expect(screen.getByText('sidebarOpen:true')).toBeInTheDocument()
    expect(screen.getByText('isMobile:true')).toBeInTheDocument()
    expect(screen.getByText('visibleViews:dashboard,users')).toBeInTheDocument()
  })

  it('debe ejecutar setSidebarOpen desde Sidebar mock', () => {
    const setSidebarOpen = vi.fn()

    renderMainLayout({
      setSidebarOpen,
    })

    fireEvent.click(screen.getByRole('button', { name: /cerrar sidebar mock/i }))

    expect(setSidebarOpen).toHaveBeenCalledWith(false)
  })

  it('debe pasar props principales a Header', () => {
    renderMainLayout({
      activeView: 'trips',
      backendStatus: 'offline',
      search: 'Campus',
      isMobile: true,
      notifications: notificationsMock,
    })

    expect(screen.getByText('activeView:trips')).toBeInTheDocument()
    expect(screen.getByText('backendStatus:offline')).toBeInTheDocument()
    expect(screen.getByText('search:Campus')).toBeInTheDocument()
    expect(screen.getByText('user:Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('notifications:1')).toBeInTheDocument()
    expect(screen.getByText('headerMobile:true')).toBeInTheDocument()
  })

  it('debe ejecutar setSearch desde Header mock', () => {
    const setSearch = vi.fn()

    renderMainLayout({
      setSearch,
    })

    fireEvent.click(screen.getByRole('button', { name: /buscar mock/i }))

    expect(setSearch).toHaveBeenCalledWith('Carlos')
  })

  it('debe ejecutar onNotificationsAction desde Header mock', () => {
    const onNotificationsAction = vi.fn()

    renderMainLayout({
      onNotificationsAction,
    })

    fireEvent.click(screen.getByRole('button', { name: /notificaciones mock/i }))

    expect(onNotificationsAction).toHaveBeenCalledTimes(1)
  })

  it('debe ejecutar handleLogout desde Header mock', () => {
    const handleLogout = vi.fn()

    renderMainLayout({
      handleLogout,
    })

    fireEvent.click(screen.getByRole('button', { name: /logout mock/i }))

    expect(handleLogout).toHaveBeenCalledTimes(1)
  })

  it('debe ejecutar toggleSidebar desde Header mock', () => {
    const toggleSidebar = vi.fn()

    renderMainLayout({
      toggleSidebar,
    })

    fireEvent.click(screen.getByRole('button', { name: /toggle sidebar mock/i }))

    expect(toggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('debe mostrar overlay cuando es móvil y sidebar está abierto', () => {
    const { container } = renderMainLayout({
      isMobile: true,
      sidebarOpen: true,
    })

    const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50')

    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass('z-40')
    expect(overlay).toHaveClass('lg:hidden')
  })

  it('debe cerrar sidebar al hacer click en overlay móvil', () => {
    const setSidebarOpen = vi.fn()

    const { container } = renderMainLayout({
      isMobile: true,
      sidebarOpen: true,
      setSidebarOpen,
    })

    const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement

    fireEvent.click(overlay)

    expect(setSidebarOpen).toHaveBeenCalledWith(false)
  })

  it('no debe mostrar overlay cuando no es móvil', () => {
    const { container } = renderMainLayout({
      isMobile: false,
      sidebarOpen: true,
    })

    const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50')

    expect(overlay).not.toBeInTheDocument()
  })

  it('no debe mostrar overlay cuando sidebar está cerrado', () => {
    const { container } = renderMainLayout({
      isMobile: true,
      sidebarOpen: false,
    })

    const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50')

    expect(overlay).not.toBeInTheDocument()
  })
})