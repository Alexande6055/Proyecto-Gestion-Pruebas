import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Database } from 'lucide-react'

import { EntityHeader } from '../components/page/EntityHeader'

describe('EntityHeader', () => {
  it('debe renderizar el título recibido por props', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes registrados en el sistema."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    expect(screen.getByText('Gestión de viajes')).toBeInTheDocument()
  })

  it('debe renderizar el subtítulo recibido por props', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de usuarios"
        subtitle="Administra los usuarios registrados."
        endpoint="/users"
        statusText="conectado"
      />
    )

    expect(screen.getByText('Administra los usuarios registrados.')).toBeInTheDocument()
  })

  it('debe renderizar el endpoint recibido por props', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de reportes"
        subtitle="Administra los reportes del sistema."
        endpoint="/reports"
        statusText="conectado"
      />
    )

    expect(screen.getByText('/reports')).toBeInTheDocument()
  })

  it('debe renderizar el texto Módulo', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    expect(screen.getByText('Módulo')).toBeInTheDocument()
  })

  it('debe renderizar el estado recibido por props', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    expect(screen.getByText('conectado')).toBeInTheDocument()
  })

  it('debe usar tono ok por defecto en el badge', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    const badge = screen.getByText('conectado')

    expect(badge).toHaveClass('bg-uride-100')
    expect(badge).toHaveClass('text-uride-800')
    expect(badge).toHaveClass('border-uride-200')
  })

  it('debe aplicar el tono danger cuando se envía statusTone danger', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="sin conexión"
        statusTone="danger"
      />
    )

    const badge = screen.getByText('sin conexión')

    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-800')
    expect(badge).toHaveClass('border-red-200')
  })

  it('debe aplicar el tono info cuando se envía statusTone info', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="cargando"
        statusTone="info"
      />
    )

    const badge = screen.getByText('cargando')

    expect(badge).toHaveClass('bg-info-100')
    expect(badge).toHaveClass('text-info-800')
    expect(badge).toHaveClass('border-info-200')
  })

  it('debe renderizar el icono recibido por props', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    expect(screen.getByTestId('header-icon')).toBeInTheDocument()
  })

  it('debe renderizar el header con sus clases principales', () => {
  const { container } = render(
    <EntityHeader
      icon={<Database data-testid="header-icon" />}
      title="Gestión de viajes"
      subtitle="Administra los viajes."
      endpoint="/trips"
      statusText="conectado"
    />
  )

  const header = container.querySelector('header')

  expect(header).toBeInTheDocument()
  expect(header).toHaveClass('bg-white')
  expect(header).toHaveClass('border-b')
  expect(header).toHaveClass('border-night-200')
  expect(header).toHaveClass('px-4')
  expect(header).toHaveClass('sm:px-8')
  expect(header).toHaveClass('lg:px-12')
  expect(header).toHaveClass('py-4')
  expect(header).toHaveClass('sm:py-6')
})

  it('debe renderizar el título con sus clases actuales', () => {
    render(
      <EntityHeader
        icon={<Database data-testid="header-icon" />}
        title="Gestión de viajes"
        subtitle="Administra los viajes."
        endpoint="/trips"
        statusText="conectado"
      />
    )

    const title = screen.getByText('Gestión de viajes')

    expect(title).toHaveClass('text-2xl')
    expect(title).toHaveClass('sm:text-3xl')
    expect(title).toHaveClass('font-extrabold')
    expect(title).toHaveClass('text-night-900')
    expect(title).toHaveClass('tracking-tight')
  })
})