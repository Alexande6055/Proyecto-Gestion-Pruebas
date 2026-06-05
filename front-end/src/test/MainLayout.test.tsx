import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MainLayout } from '../components/layout/MainLayout'
import type { AuthSession, ViewKey } from '../types'

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Contenido de la ruta</div>,
}))

vi.mock('../components/layout/Sidebar', () => ({
  Sidebar: ({
    sidebarOpen,
    visibleViews,
  }: {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    visibleViews: ViewKey[]
  }) => (
    <aside data-testid="sidebar">
      <span>{sidebarOpen ? 'Sidebar abierto' : 'Sidebar cerrado'}</span>
      <span>{visibleViews.join(',')}</span>
    </aside>
  ),
}))

vi.mock('../components/layout/Header', () => ({
  Header: ({
    activeView,
    backendStatus,
    search,
    session,
  }: {
    activeView: ViewKey
    backendStatus: 'checking' | 'online' | 'offline'
    search: string
    setSearch: (value: string) => void
    session: AuthSession
    handleLogout: () => void
  }) => (
    <header data-testid="header">
      <span>{activeView}</span>
      <span>{backendStatus}</span>
      <span>{search}</span>
      <span>{session.user.nombre}</span>
    </header>
  ),
}))

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

describe('MainLayout', () => {
  it('debe renderizar el layout principal', () => {
    const { container } = render(
      <MainLayout
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        visibleViews={['dashboard', 'users'] as ViewKey[]}
        activeView="dashboard"
        backendStatus="online"
        search=""
        setSearch={vi.fn()}
        session={sessionMock}
        handleLogout={vi.fn()}
      />
    )

    const layout = container.firstElementChild

    expect(layout).toBeInTheDocument()
    expect(layout).toHaveClass('h-screen')
    expect(layout).toHaveClass('min-h-screen')
    expect(layout).toHaveClass('bg-night-50')
    expect(layout).toHaveClass('flex')
    expect(layout).toHaveClass('overflow-hidden')
  })

  it('debe renderizar el Sidebar', () => {
    render(
      <MainLayout
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        visibleViews={['dashboard', 'users'] as ViewKey[]}
        activeView="dashboard"
        backendStatus="online"
        search=""
        setSearch={vi.fn()}
        session={sessionMock}
        handleLogout={vi.fn()}
      />
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('Sidebar abierto')).toBeInTheDocument()
    expect(screen.getByText('dashboard,users')).toBeInTheDocument()
  })

  it('debe renderizar el Header con la información recibida', () => {
    render(
      <MainLayout
        sidebarOpen={false}
        setSidebarOpen={vi.fn()}
        visibleViews={['dashboard', 'trips'] as ViewKey[]}
        activeView="trips"
        backendStatus="offline"
        search="Campus"
        setSearch={vi.fn()}
        session={sessionMock}
        handleLogout={vi.fn()}
      />
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByText('trips')).toBeInTheDocument()
    expect(screen.getByText('offline')).toBeInTheDocument()
    expect(screen.getByText('Campus')).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
  })

  it('debe renderizar el contenido de Outlet', () => {
    render(
      <MainLayout
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        visibleViews={['dashboard'] as ViewKey[]}
        activeView="dashboard"
        backendStatus="online"
        search=""
        setSearch={vi.fn()}
        session={sessionMock}
        handleLogout={vi.fn()}
      />
    )

    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByText('Contenido de la ruta')).toBeInTheDocument()
  })

  it('debe renderizar el main con sus clases actuales', () => {
    const { container } = render(
      <MainLayout
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        visibleViews={['dashboard'] as ViewKey[]}
        activeView="dashboard"
        backendStatus="checking"
        search=""
        setSearch={vi.fn()}
        session={sessionMock}
        handleLogout={vi.fn()}
      />
    )

    const main = container.querySelector('main')

    expect(main).toBeInTheDocument()
    expect(main).toHaveClass('flex-1')
    expect(main).toHaveClass('min-h-0')
    expect(main).toHaveClass('overflow-y-auto')
    expect(main).toHaveClass('flex-1 min-h-0 overflow-y-auto p-4 md:p-6')
  })
})