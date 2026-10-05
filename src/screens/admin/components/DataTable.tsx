import { ScrollHint, StatusBadge } from "../components"

export function DataTable({
  columns,
  rows,
  empty = "No records found.",
}: {
  columns: string[]
  rows: string[][]
  empty?: string
}) {
  return (
    <>
      <ScrollHint />
      <div className="overflow-x-auto">
        <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cellIndex}-${cell}`}>
                    {columns[cellIndex] === "Status" ? (
                      <StatusBadge
                        label={cell}
                        tone={cell === "Original" || cell === "On track" ? "success" : cell === "Edited" ? "info" : "danger"}
                      />
                    ) : columns[cellIndex] === "Branch" ? (
                      <StatusBadge label={cell} tone="info" />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-[var(--text-muted)]">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </>
  )
}
