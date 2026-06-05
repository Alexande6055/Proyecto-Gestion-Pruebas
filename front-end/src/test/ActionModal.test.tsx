import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AlertTriangle } from 'lucide-react'

import ActionModal from '../components/common/ActionModal'

describe('ActionModal', () => {
  it('no debe renderizar nada cuando open es false', () => {
    const { container } = render(
      <ActionModal
        open={false}
        title="Eliminar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('debe renderizar título y descripción', () => {
    render(
      <ActionModal
        open
        title="Eliminar viaje"
        description="Esta acción no se puede deshacer."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('Eliminar viaje')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
  })

  it('debe renderizar etiquetas personalizadas de botones', () => {
    render(
      <ActionModal
        open
        title="Confirmar"
        confirmLabel="Sí, continuar"
        cancelLabel="No, cancelar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /sí, continuar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no, cancelar/i })).toBeInTheDocument()
  })

  it('debe ejecutar onClose al presionar cancelar', () => {
    const onClose = vi.fn()

    render(
      <ActionModal
        open
        title="Confirmar"
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('debe ejecutar onClose al presionar el botón cerrar', () => {
    const onClose = vi.fn()

    render(
      <ActionModal
        open
        title="Confirmar"
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText(/cerrar/i))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('debe ejecutar onConfirm sin input con valor vacío', () => {
    const onConfirm = vi.fn()

    render(
      <ActionModal
        open
        title="Confirmar"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /aceptar/i }))

    expect(onConfirm).toHaveBeenCalledWith('')
  })

  it('debe renderizar input de texto y enviar su valor', () => {
    const onConfirm = vi.fn()

    render(
      <ActionModal
        open
        title="Motivo"
        inputLabel="Motivo"
        inputPlaceholder="Escribe el motivo"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Motivo de prueba' },
    })

    fireEvent.click(screen.getByRole('button', { name: /aceptar/i }))

    expect(onConfirm).toHaveBeenCalledWith('Motivo de prueba')
  })

  it('debe renderizar input password', () => {
    render(
      <ActionModal
        open
        title="Contraseña"
        inputLabel="Contraseña"
        inputType="password"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })

  it('debe renderizar textarea cuando inputType es textarea', () => {
    render(
      <ActionModal
        open
        title="Comentario"
        inputLabel="Comentario"
        inputType="textarea"
        inputPlaceholder="Escribe un comentario"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText('Escribe un comentario')

    expect(textarea.tagName.toLowerCase()).toBe('textarea')
  })

  it('debe deshabilitar confirmar cuando el input es requerido y está vacío', () => {
    render(
      <ActionModal
        open
        title="Motivo"
        inputLabel="Motivo"
        inputRequired
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /aceptar/i })).toBeDisabled()
  })

  it('debe habilitar confirmar cuando el input requerido tiene texto', () => {
    render(
      <ActionModal
        open
        title="Motivo"
        inputLabel="Motivo"
        inputRequired
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Texto válido' },
    })

    expect(screen.getByRole('button', { name: /aceptar/i })).not.toBeDisabled()
  })

  it('debe usar defaultValue como valor inicial', () => {
    render(
      <ActionModal
        open
        title="Editar"
        inputLabel="Nombre"
        defaultValue="Ana Torres"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Torres')
  })

  it('debe mostrar estado de carga', () => {
    render(
      <ActionModal
        open
        title="Guardando"
        loading
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled()
    expect(screen.getByLabelText(/cerrar/i)).toBeDisabled()
  })

  it('debe aplicar tono danger al botón confirmar', () => {
    render(
      <ActionModal
        open
        title="Eliminar"
        tone="danger"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /aceptar/i })).toHaveClass('bg-red-600')
  })

  it('debe renderizar icono personalizado', () => {
    render(
      <ActionModal
        open
        title="Alerta"
        icon={<AlertTriangle data-testid="custom-icon" />}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})