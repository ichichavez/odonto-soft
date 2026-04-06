import * as XLSX from "xlsx"

export type ExportColumn = { header: string; key: string }

/**
 * Exporta un array de objetos a un archivo .xlsx
 */
export function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename: string
) {
  // Construir filas con los headers correctos
  const rows = data.map(row =>
    Object.fromEntries(columns.map(col => [col.header, row[col.key] ?? ""]))
  )
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns.map(c => c.header) })

  // Ajustar ancho de columnas automáticamente
  const colWidths = columns.map(col => ({
    wch: Math.max(
      col.header.length,
      ...data.map(row => String(row[col.key] ?? "").length)
    ) + 2
  }))
  ws["!cols"] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Exporta a PDF usando la impresión del navegador con tabla HTML.
 * Genera un iframe oculto, imprime y lo elimina.
 */
export function exportToPDF(
  data: Record<string, any>[],
  columns: ExportColumn[],
  title: string
) {
  const rows = data.map(row =>
    `<tr>${columns.map(col => `<td>${row[col.key] ?? ""}</td>`).join("")}</tr>`
  ).join("")

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        h2 { margin-bottom: 8px; font-size: 14px; }
        p.meta { color: #666; font-size: 10px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #ccc; }
        td { padding: 5px 8px; border: 1px solid #ddd; }
        tr:nth-child(even) td { background: #fafafa; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <p class="meta">Exportado el ${new Date().toLocaleDateString("es-ES")} — ${data.length} registros</p>
      <table>
        <thead><tr>${columns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `

  const iframe = document.createElement("iframe")
  iframe.style.display = "none"
  document.body.appendChild(iframe)
  iframe.contentDocument!.open()
  iframe.contentDocument!.write(html)
  iframe.contentDocument!.close()
  setTimeout(() => {
    iframe.contentWindow!.focus()
    iframe.contentWindow!.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 300)
}
