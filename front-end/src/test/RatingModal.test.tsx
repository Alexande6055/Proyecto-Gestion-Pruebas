import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RatingModal from '../components/common/RatingModal'

describe('RatingModal', () => {
  it('no debe renderizar nada cuando open es false', () => {
    const { container } = render(
      <RatingModal
        open={false}
        title="Calificar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('debe renderizar título y subtítulo', () => {
    render(
      <RatingModal
        open
        title="Calificar viaje"
        subtitle="Comparte tu experiencia"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('Calificar viaje')).toBeInTheDocument()
    expect(screen.getByText('Comparte tu experiencia')).toBeInTheDocument()
  })

  it('debe mostrar puntuación inicial excelente', () => {
    render(
      <RatingModal
        open
        title="Calificar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('¡Excelente!')).toBeInTheDocument()
  })

  it('debe cambiar la puntuación al seleccionar una estrella', () => {
    render(
      <RatingModal
        open
        title="Calificar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    const starButtons = buttons.slice(1, 6)

    fireEvent.click(starButtons[1])

    expect(screen.getByText('Regular')).toBeInTheDocument()
  })

 it('debe cambiar visualmente las estrellas al pasar el mouse', () => {
  render(
    <RatingModal
      open
      title="Calificar"
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />
  )

  const buttons = screen.getAllByRole('button')
  const starButtons = buttons.slice(1, 6)

  const fifthStarIcon = starButtons[4].querySelector('svg')

  expect(fifthStarIcon).toHaveClass('text-amber-400')

  fireEvent.mouseEnter(starButtons[2])

  expect(fifthStarIcon).toHaveClass('text-gray-200')

  fireEvent.mouseLeave(starButtons[2])

  expect(fifthStarIcon).toHaveClass('text-amber-400')
})

  it('debe permitir escribir comentario', () => {
    render(
      <RatingModal
        open
        title="Calificar"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText('¿Qué tal fue el viaje?')

    fireEvent.change(textarea, {
      target: { value: 'Muy buen viaje' },
    })

    expect(textarea).toHaveValue('Muy buen viaje')
  })

  it('debe enviar score y comentario al confirmar', () => {
    const onConfirm = vi.fn()

    render(
      <RatingModal
        open
        title="Calificar"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('¿Qué tal fue el viaje?'), {
      target: { value: 'Excelente conductor' },
    })

    const buttons = screen.getAllByRole('button')
    const starButtons = buttons.slice(1, 6)

    fireEvent.click(starButtons[3])
    fireEvent.click(screen.getByRole('button', { name: /enviar calificación/i }))

    expect(onConfirm).toHaveBeenCalledWith(4, 'Excelente conductor')
  })

  it('debe ejecutar onClose al presionar Ahora no', () => {
    const onClose = vi.fn()

    render(
      <RatingModal
        open
        title="Calificar"
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /ahora no/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('debe ejecutar onClose al presionar el botón X', () => {
    const onClose = vi.fn()

    render(
      <RatingModal
        open
        title="Calificar"
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    const closeButton = buttons[0]

    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('debe usar confirmLabel personalizado', () => {
    render(
      <RatingModal
        open
        title="Calificar"
        confirmLabel="Guardar calificación"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: /guardar calificación/i })
    ).toBeInTheDocument()
  })

  it('debe mostrar loading y deshabilitar botón enviar', () => {
    render(
      <RatingModal
        open
        title="Calificar"
        loading
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    const submitButton = buttons[buttons.length - 1]

    expect(submitButton).toBeDisabled()
    expect(submitButton.querySelector('svg')).toBeInTheDocument()
  })
})