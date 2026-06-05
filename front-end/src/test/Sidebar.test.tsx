import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from '../components/layout/Sidebar'
import type { ViewKey } from '../types'

const renderSidebar = ({
  sidebarOpen = true,
  setSidebarOpen = vi.fn(),
  visibleViews = ['dashboard', 'users', 'trips'] as ViewKey[],
  initialRoute = '/',
} = {}) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        visibleViews={visibleViews}
      />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  it('debe renderizar el nombre de la marca cuando el sidebar está abierto', () => {
    renderSidebar({
      sidebarOpen: true,
    })

    expect(screen.getByText('U-Ride')).toBeInTheDocument()
    expect(screen.getByText('Gestion de viajes')).toBeInTheDocument()
  })

  it('debe ocultar el nombre de la marca cuando el sidebar está cerrado', () => {
    renderSidebar({
      sidebarOpen: false,
    })

    expect(screen.queryByText('U-Ride')).not.toBeInTheDocument()
    expect(screen.queryByText('Gestion de viajes')).not.toBeInTheDocument()
  })

  it('debe renderizar las vistas visibles cuando está abierto', () => {
    renderSidebar({
      sidebarOpen: true,
      visibleViews: ['dashboard', 'users', 'trips'] as ViewKey[],
    })

    expect(screen.getByText('Resumen')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Viajes')).toBeInTheDocument()
  })

  it('debe ocultar los textos de navegación cuando está cerrado', () => {
    renderSidebar({
      sidebarOpen: false,
      visibleViews: ['dashboard', 'users', 'trips'] as ViewKey[],
    })

    expect(screen.queryByText('Resumen')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Viajes')).not.toBeInTheDocument()
  })

  it('debe renderizar los enlaces con las rutas correctas', () => {
    renderSidebar({
      sidebarOpen: true,
      visibleViews: ['dashboard', 'users', 'audit_logs'] as ViewKey[],
    })

    expect(screen.getByText('Resumen').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Usuarios').closest('a')).toHaveAttribute('href', '/users')
    expect(screen.getByText('Auditoria').closest('a')).toHaveAttribute('href', '/audit-logs')
  })

  it('debe aplicar clase de sidebar abierto', () => {
    const { container } = renderSidebar({
      sidebarOpen: true,
    })

    const sidebar = container.querySelector('aside')

    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('w-64')
    expect(sidebar).toHaveClass('bg-white')
    expect(sidebar).toHaveClass('border-r')
    expect(sidebar).toHaveClass('flex')
  })

  it('debe aplicar clase de sidebar cerrado', () => {
    const { container } = renderSidebar({
      sidebarOpen: false,
    })

    const sidebar = container.querySelector('aside')

    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('w-20')
    expect(sidebar).toHaveClass('bg-white')
    expect(sidebar).toHaveClass('border-r')
  })

  it('debe ejecutar setSidebarOpen al presionar Colapsar menu', () => {
    const setSidebarOpen = vi.fn()

    renderSidebar({
      sidebarOpen: true,
      setSidebarOpen,
    })

    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    expect(setSidebarOpen).toHaveBeenCalledWith(false)
  })

  it('debe ejecutar setSidebarOpen con true cuando está cerrado', () => {
    const setSidebarOpen = vi.fn()

    const { container } = renderSidebar({
      sidebarOpen: false,
      setSidebarOpen,
    })

    const button = container.querySelector('button') as HTMLButtonElement

    fireEvent.click(button)

    expect(setSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('debe marcar como activo el enlace del dashboard cuando la ruta es /', () => {
    renderSidebar({
      sidebarOpen: true,
      visibleViews: ['dashboard', 'users'] as ViewKey[],
      initialRoute: '/',
    })

    const dashboardLink = screen.getByText('Resumen').closest('a')

    expect(dashboardLink).toHaveClass('bg-uride-50')
    expect(dashboardLink).toHaveClass('text-uride-600')
    expect(dashboardLink).toHaveClass('border-uride-500')
  })

  it('debe marcar como activo el enlace de usuarios cuando la ruta es /users', () => {
    renderSidebar({
      sidebarOpen: true,
      visibleViews: ['dashboard', 'users'] as ViewKey[],
      initialRoute: '/users',
    })

    const usersLink = screen.getByText('Usuarios').closest('a')

    expect(usersLink).toHaveClass('bg-uride-50')
    expect(usersLink).toHaveClass('text-uride-600')
    expect(usersLink).toHaveClass('border-uride-500')
  })
})