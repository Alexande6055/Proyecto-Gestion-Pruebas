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
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-night-200 scrollbar-track-transparent">
      <table className="w-full text-xs">
        <thead>
        <tr className="border-b border-night-100 bg-night-50/50">
          {columns.map((column) => (
            <th
              key={column}
              className="text-left px-3 py-2.5 text-[10px] font-bold text-night-400 uppercase tracking-wider whitespace-nowrap"
            >
              {columnLabels?.[column] ?? column}
            </th>
          ))}
          {showActions && (
            <th className="text-right px-3 py-2.5 text-[10px] font-bold text-night-400 uppercase tracking-wider">
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
              <td key={column} className="px-3 py-2.5 max-w-[200px] truncate">
                {renderCell(row, column)}
              </td>
            ))}
            {showActions && (
              <td className="px-3 py-2.5 text-right">{renderActions?.(row)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
