import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { User } from 'lucide-react'

import { EntityDetailModal } from '../components/page/EntityDetailModal'

describe('EntityDetailModal', () => {
  it('debe renderizar el título recibido por props', () => {
    render(
      <EntityDetailModal title="Detalle del usuario" onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    expect(screen.getByText('Detalle del usuario')).toBeInTheDocument()
  })

  it('debe renderizar el subtítulo cuando se envía por props', () => {
    render(
      <EntityDetailModal
        title="Detalle del viaje"
        subtitle="Información completa"
        onClose={vi.fn()}
      >
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    expect(screen.getByText('Información completa')).toBeInTheDocument()
  })

  it('no debe renderizar subtítulo cuando no se envía por props', () => {
    render(
      <EntityDetailModal title="Detalle" onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    expect(screen.queryByText('Información completa')).not.toBeInTheDocument()
  })

  it('debe renderizar el contenido hijo dentro del modal', () => {
    render(
      <EntityDetailModal title="Detalle" onClose={vi.fn()}>
        <div>
          <p>Nombre: Ana Torres</p>
          <p>Rol: Administrador</p>
        </div>
      </EntityDetailModal>
    )

    expect(screen.getByText('Nombre: Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Rol: Administrador')).toBeInTheDocument()
  })

  it('debe ejecutar onClose al presionar el botón de cerrar', () => {
    const onClose = vi.fn()

    render(
      <EntityDetailModal title="Detalle" onClose={onClose}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('debe renderizar un icono personalizado cuando se envía por props', () => {
    const { container } = render(
      <EntityDetailModal
        title="Detalle del usuario"
        icon={<User data-testid="custom-icon" />}
        onClose={vi.fn()}
      >
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()

    const modal = container.querySelector('.card-uride')
    expect(modal).toBeInTheDocument()
  })

  it('debe renderizar el fondo del modal con sus clases actuales', () => {
    const { container } = render(
      <EntityDetailModal title="Detalle" onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    const backdrop = container.firstElementChild

    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveClass('fixed')
    expect(backdrop).toHaveClass('inset-0')
    expect(backdrop).toHaveClass('z-50')
    expect(backdrop).toHaveClass('bg-night-900/40')
    expect(backdrop).toHaveClass('backdrop-blur-sm')
  })

  it('debe renderizar la tarjeta del modal con sus clases actuales', () => {
    const { container } = render(
      <EntityDetailModal title="Detalle" onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    const modalCard = container.querySelector('.card-uride')

    expect(modalCard).toBeInTheDocument()
    expect(modalCard).toHaveClass('w-full')
    expect(modalCard).toHaveClass('max-w-2xl')
    expect(modalCard).toHaveClass('max-h-[80vh]')
    expect(modalCard).toHaveClass('overflow-auto')
  })

  it('debe renderizar el encabezado del modal', () => {
    const { container } = render(
      <EntityDetailModal title="Detalle" onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </EntityDetailModal>
    )

    const header = container.querySelector('.sticky')

    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('top-0')
    expect(header).toHaveClass('bg-white')
    expect(header).toHaveClass('z-10')
  })
})