import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EntityField } from '../components/page/EntityField'
import type { EntityState, FieldConfig, ViewKey } from '../types'
import { managedViews } from '../constants/entities'

const createRegistration = (name = 'campo') => ({
  name,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
})

const createEntityState = (rows: any[] = []): EntityState => ({
  rows,
  loading: false,
  error: null,
})

const createData = (): Record<ViewKey, EntityState> => {
  const data = Object.fromEntries(
    managedViews.map((key) => [key, createEntityState()])
  ) as Record<ViewKey, EntityState>

  data.users = createEntityState([
    {
      id: 1,
      nombre: 'Ana Torres',
      name: 'Ana Torres',
    },
    {
      id: 2,
      nombre: 'Carlos Perez',
      name: 'Carlos Perez',
    },
  ])

  return data
}

describe('EntityField', () => {
  it('debe renderizar el label del campo', () => {
    const field: FieldConfig = {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('origen_zona')}
      />
    )

    expect(screen.getByText('Origen')).toBeInTheDocument()
  })

  it('debe renderizar un input de texto', () => {
    const field: FieldConfig = {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('origen_zona')}
      />
    )

    const input = screen.getByPlaceholderText('Ingresa origen')

    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveClass('input-uride')
  })

  it('debe renderizar un input number cuando kind es number', () => {
    const field: FieldConfig = {
      key: 'cupos_disponibles',
      label: 'Cupos disponibles',
      kind: 'number',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('cupos_disponibles')}
      />
    )

    const input = screen.getByPlaceholderText('Ingresa cupos disponibles')

    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('debe renderizar un input datetime-local cuando kind es datetime-local', () => {
    const field: FieldConfig = {
      key: 'fecha_hora',
      label: 'Fecha y hora',
      kind: 'datetime-local',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('fecha_hora')}
      />
    )

    const input = screen.getByPlaceholderText('Ingresa fecha y hora')

    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'datetime-local')
  })

  it('debe renderizar un textarea cuando kind es textarea', () => {
    const field: FieldConfig = {
      key: 'descripcion',
      label: 'Descripción',
      kind: 'textarea',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('descripcion')}
      />
    )

    const textarea = screen.getByPlaceholderText('Ingresa descripción')

    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName.toLowerCase()).toBe('textarea')
    expect(textarea).toHaveClass('input-uride')
    expect(textarea).toHaveClass('min-h-20')
    expect(textarea).toHaveClass('resize-y')
  })

  it('debe renderizar un select con opciones normales', () => {
    const field: FieldConfig = {
      key: 'estado',
      label: 'Estado',
      kind: 'select',
      options: ['abierto', 'completo', 'cancelado'],
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('estado')}
      />
    )

    const select = screen.getByRole('combobox')

    expect(select).toBeInTheDocument()
    expect(screen.getByText('Seleccionar estado')).toBeInTheDocument()
    expect(screen.getByText('abierto')).toBeInTheDocument()
    expect(screen.getByText('completo')).toBeInTheDocument()
    expect(screen.getByText('cancelado')).toBeInTheDocument()
  })

  it('debe permitir cambiar el valor de un select', () => {
    const field: FieldConfig = {
      key: 'estado',
      label: 'Estado',
      kind: 'select',
      options: ['abierto', 'completo', 'cancelado'],
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('estado')}
      />
    )

    const select = screen.getByRole('combobox')

    fireEvent.change(select, {
      target: { value: 'completo' },
    })

    expect(select).toHaveValue('completo')
  })

  it('debe renderizar opciones relacionadas cuando el campo tiene relation', () => {
    const field: FieldConfig = {
      key: 'conductor_id',
      label: 'Conductor',
      kind: 'select',
      relation: 'users',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('conductor_id')}
        data={createData()}
      />
    )

    expect(screen.getByText('Seleccionar conductor')).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument()
  })

  it('debe usar placeholder personalizado cuando se envía por props', () => {
    const field: FieldConfig = {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('origen_zona')}
        placeholder="Escribe el origen del viaje"
      />
    )

    expect(
      screen.getByPlaceholderText('Escribe el origen del viaje')
    ).toBeInTheDocument()
  })

  it('debe mostrar mensaje de error cuando se envía error por props', () => {
    const field: FieldConfig = {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    }

    render(
      <EntityField
        field={field}
        registration={createRegistration('origen_zona')}
        error="El origen es obligatorio"
      />
    )

    expect(screen.getByText('El origen es obligatorio')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Ingresa origen')

    expect(input).toHaveClass('border-red-500')
    expect(input).toHaveClass('focus:ring-red-500/30')
    expect(input).toHaveClass('focus:border-red-500')
  })

  it('debe ejecutar la función onChange del registration al escribir', () => {
    const registration = createRegistration('origen_zona')

    const field: FieldConfig = {
      key: 'origen_zona',
      label: 'Origen',
      kind: 'text',
    }

    render(
      <EntityField
        field={field}
        registration={registration}
      />
    )

    const input = screen.getByPlaceholderText('Ingresa origen')

    fireEvent.change(input, {
      target: { value: 'Campus Huachi' },
    })

    expect(registration.onChange).toHaveBeenCalled()
  })
})