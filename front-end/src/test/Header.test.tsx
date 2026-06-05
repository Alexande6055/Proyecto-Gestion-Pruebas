import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from '../components/layout/Header'
import type { AuthSession } from '../types'

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

const renderHeader = (props = {}) => {
  return render(
    <Header
      activeView="dashboard"
      backendStatus="online"
      search=""
      setSearch={vi.fn()}
      session={sessionMock}
      handleLogout={vi.fn()}
      notifications={[]}
      {...props}
    />
  )
}

describe('Header', () => {
  it('debe renderizar el breadcrumb con la vista activa', () => {
    renderHeader()

    expect(screen.getByText('Panel')).toBeInTheDocument()
    expect(screen.getByText(/resumen/i)).toBeInTheDocument()
  })

  it('debe mostrar estado verificando backend cuando backendStatus es checking', () => {
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

  it('debe renderizar el header con sus clases principales', () => {
    const { container } = renderHeader()

    const header = container.querySelector('header')

    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('h-16')
    expect(header).toHaveClass('bg-white/80')
    expect(header).toHaveClass('sticky')
    expect(header).toHaveClass('top-0')
  })
})