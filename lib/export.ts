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
  const rows = data.map(row =>
    Object.fromEntries(columns.map(col => [col.header, row[col.key] ?? ""]))
  )
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns.map(c => c.header) })

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

export interface PdfOptions {
  /** Nombre de la clínica — aparece en el encabezado */
  clinicName?: string
  /** Filas de totales que se muestran al pie: [{ label, value }] */
  totals?: Array<{ label: string; value: string }>
}

/**
 * Genera un PDF real con jsPDF + autoTable y lo descarga directamente.
 */
export async function exportToPDF(
  data: Record<string, any>[],
  columns: ExportColumn[],
  title: string,
  options: PdfOptions = {}
) {
  // Importación dinámica para no aumentar el bundle inicial
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  const pageW = doc.internal.pageSize.getWidth()
  const now   = new Date().toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  // ── Encabezado ────────────────────────────────────────────────────────────
  if (options.clinicName) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(options.clinicName, 14, 12)
  }

  doc.setFontSize(14)
  doc.setTextColor(30, 30, 30)
  doc.text(title, 14, options.clinicName ? 20 : 14)

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Exportado el ${now} — ${data.length} registros`, 14, options.clinicName ? 26 : 20)

  // Línea separadora
  const headerEndY = options.clinicName ? 29 : 23
  doc.setDrawColor(200, 200, 200)
  doc.line(14, headerEndY, pageW - 14, headerEndY)

  // ── Tabla ─────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: headerEndY + 3,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.key] ?? "")),
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Número de página al pie
      const pageCount = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(180, 180, 180)
      doc.text(
        `Página ${hookData.pageNumber} de ${pageCount}`,
        pageW - 14,
        doc.internal.pageSize.getHeight() - 6,
        { align: "right" }
      )
    },
  })

  // ── Totales ───────────────────────────────────────────────────────────────
  if (options.totals && options.totals.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 5
    doc.setFontSize(8)
    doc.setTextColor(30, 30, 30)
    options.totals.forEach((row, i) => {
      doc.text(`${row.label}:`, pageW - 14 - 60, finalY + i * 6, { align: "left" })
      doc.setFont("helvetica", "bold")
      doc.text(row.value, pageW - 14, finalY + i * 6, { align: "right" })
      doc.setFont("helvetica", "normal")
    })
  }

  // ── Descarga ──────────────────────────────────────────────────────────────
  const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_")
  doc.save(`${safeTitle}.pdf`)
}
