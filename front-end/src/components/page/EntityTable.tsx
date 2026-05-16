import type { ReactNode } from 'react'
import type { EntityRow } from '../../types'

interface EntityTableProps {
  columns: string[]
  rows: EntityRow[]
  renderCell: (row: EntityRow, column: string) => ReactNode
  renderActions?: (row: EntityRow) => ReactNode
  showActions?: boolean
  columnLabels?: Record<string, string>
}

export function EntityTable({
  columns,
  rows,
  renderCell,
  renderActions,
  showActions = false,
  columnLabels,
}: EntityTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-night-100">
          {columns.map((column) => (
            <th
              key={column}
              className="text-left px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider"
            >
              {columnLabels?.[column] ?? column}
            </th>
          ))}
          {showActions && (
            <th className="text-right px-4 py-3 text-[10px] font-bold text-night-400 uppercase tracking-wider">
              acciones
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-night-100">
        {rows.map((row) => (
          <tr
            key={String(row.id ?? JSON.stringify(row))}
            className="hover:bg-uride-50/30 transition-colors duration-150"
          >
            {columns.map((column) => (
              <td key={column} className="px-4 py-3">
                {renderCell(row, column)}
              </td>
            ))}
            {showActions && (
              <td className="px-4 py-3">{renderActions?.(row)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
