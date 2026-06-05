import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EntityTable } from '../components/page/EntityTable'
import type { EntityRow } from '../types'

const rows: EntityRow[] = [
  {
    id: 1,
    nombre: 'Ana Torres',
    rol: 'admin',
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'Carlos Perez',
    rol: 'conductor',
    estado: 'inactivo',
  },
]

const columns = ['id', 'nombre', 'rol', 'estado']

describe('EntityTable', () => {
  it('debe renderizar las columnas recibidas por props', () => {
    render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('nombre')).toBeInTheDocument()
    expect(screen.getByText('rol')).toBeInTheDocument()
    expect(screen.getByText('estado')).toBeInTheDocument()
  })

  it('debe renderizar las filas recibidas por props', () => {
    render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('conductor')).toBeInTheDocument()
  })

  it('debe usar columnLabels cuando se envían etiquetas personalizadas', () => {
    render(
      <EntityTable
        columns={columns}
        rows={rows}
        columnLabels={{
          id: 'Código',
          nombre: 'Nombre completo',
          rol: 'Rol del usuario',
          estado: 'Estado actual',
        }}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    expect(screen.getByText('Código')).toBeInTheDocument()
    expect(screen.getByText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByText('Rol del usuario')).toBeInTheDocument()
    expect(screen.getByText('Estado actual')).toBeInTheDocument()

    expect(screen.queryByText('nombre')).not.toBeInTheDocument()
  })

  it('debe ejecutar renderCell por cada celda de la tabla', () => {
    const renderCell = vi.fn((row: EntityRow, column: string) =>
      String(row[column] ?? '')
    )

    render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={renderCell}
      />
    )

    expect(renderCell).toHaveBeenCalledTimes(rows.length * columns.length)
    expect(renderCell).toHaveBeenCalledWith(rows[0], 'id')
    expect(renderCell).toHaveBeenCalledWith(rows[0], 'nombre')
    expect(renderCell).toHaveBeenCalledWith(rows[1], 'estado')
  })

  it('no debe renderizar columna acciones cuando showActions es false', () => {
    render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    expect(screen.queryByText('acciones')).not.toBeInTheDocument()
  })

  it('debe renderizar columna acciones cuando showActions es true', () => {
    render(
      <EntityTable
        columns={columns}
        rows={rows}
        showActions
        renderCell={(row, column) => String(row[column] ?? '')}
        renderActions={(row) => (
          <button type="button">Ver {String(row.id ?? '')}</button>
        )}
      />
    )

    expect(screen.getByText('acciones')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver 2/i })).toBeInTheDocument()
  })

  it('debe ejecutar renderActions por cada fila cuando showActions es true', () => {
    const renderActions = vi.fn((row: EntityRow) => (
      <button type="button">Acción {String(row.id ?? '')}</button>
    ))

    render(
      <EntityTable
        columns={columns}
        rows={rows}
        showActions
        renderCell={(row, column) => String(row[column] ?? '')}
        renderActions={renderActions}
      />
    )

    expect(renderActions).toHaveBeenCalledTimes(rows.length)
    expect(renderActions).toHaveBeenCalledWith(rows[0])
    expect(renderActions).toHaveBeenCalledWith(rows[1])
  })

  it('debe renderizar la tabla con sus clases principales', () => {
    const { container } = render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    const table = container.querySelector('table')

    expect(table).toBeInTheDocument()
    expect(table).toHaveClass('w-full')
  })

  it('debe renderizar el encabezado con clases actuales', () => {
    const { container } = render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    const headerRow = container.querySelector('thead tr')

    expect(headerRow).toBeInTheDocument()
    expect(headerRow).toHaveClass('border-b')
    expect(headerRow).toHaveClass('border-night-100')
  })

  it('debe renderizar las filas con clases actuales', () => {
    const { container } = render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    const bodyRows = container.querySelectorAll('tbody tr')

    expect(bodyRows.length).toBe(2)
    expect(bodyRows[0]).toHaveClass('hover:bg-uride-50/30')
    expect(bodyRows[0]).toHaveClass('transition-colors')
    expect(bodyRows[0]).toHaveClass('duration-150')
  })

  it('debe renderizar tbody con separación entre filas', () => {
    const { container } = render(
      <EntityTable
        columns={columns}
        rows={rows}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    const tbody = container.querySelector('tbody')

    expect(tbody).toBeInTheDocument()
    expect(tbody).toHaveClass('divide-y')
    expect(tbody).toHaveClass('divide-night-100')
  })

  it('debe renderizar una tabla vacía cuando rows está vacío', () => {
    const { container } = render(
      <EntityTable
        columns={columns}
        rows={[]}
        renderCell={(row, column) => String(row[column] ?? '')}
      />
    )

    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('nombre')).toBeInTheDocument()

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows.length).toBe(0)
  })
})