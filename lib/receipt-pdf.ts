import type { ReceiptData } from "@/services/treatment-payments"
import type { Clinic } from "@/context/clinic-context"

export async function generateReceiptPdf(data: ReceiptData, clinic: Clinic): Promise<File> {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const W = 210
  const margin = 20
  const contentW = W - margin * 2
  let y = margin

  const fmt = (n: number) =>
    `\u20B2 ${n.toLocaleString("es-PY")}` // ₲

  // ── Header / Membrete ──────────────────────────────────────────────────
  if (clinic.logo_url) {
    try {
      const resp = await fetch(clinic.logo_url)
      const blob = await resp.blob()
      const b64 = await new Promise<string>((res) => {
        const reader = new FileReader()
        reader.onloadend = () => res(reader.result as string)
        reader.readAsDataURL(blob)
      })
      const ext = (blob.type.split("/")[1] || "png").toUpperCase() as any
      doc.addImage(b64, ext, margin, y, 20, 20)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(clinic.name ?? "Clínica Odontológica", margin + 24, y + 6)
      if (clinic.doctor_name) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(clinic.doctor_name, margin + 24, y + 12)
      }
      const subInfo = [clinic.specialty, clinic.professional_registration].filter(Boolean).join(" · ")
      if (subInfo) {
        doc.setFontSize(9)
        doc.text(subInfo, margin + 24, y + 17)
      }
      y += 25
    } catch {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(clinic.name ?? "Clínica Odontológica", margin, y)
      y += 7
    }
  } else {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(clinic.name ?? "Clínica Odontológica", margin, y)
    y += 7
    if (clinic.doctor_name) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(clinic.doctor_name, margin, y)
      y += 5
    }
    const sub = [clinic.specialty, clinic.professional_registration].filter(Boolean).join(" · ")
    if (sub) {
      doc.setFontSize(9)
      doc.text(sub, margin, y)
      y += 5
    }
  }

  if (clinic.address) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(clinic.address, margin, y)
    y += 4
  }
  if (clinic.phone) {
    doc.setFontSize(9)
    doc.text(`Tel: ${clinic.phone}`, margin, y)
    y += 4
  }

  // Línea separadora
  y += 3
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(margin, y, W - margin, y)
  y += 7

  // ── Título: RECIBO DE PAGO + número ────────────────────────────────────
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("RECIBO DE PAGO", margin, y)
  doc.setFontSize(12)
  doc.text(`N° ${data.receipt_number}`, W - margin, y, { align: "right" })
  y += 8

  // ── Datos del pago ─────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    const [year, month, day] = d.split("-")
    return `${day}/${month}/${year}`
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Fecha:`, margin, y)
  doc.setFont("helvetica", "bold")
  doc.text(formatDate(data.date), margin + 20, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.text(`Paciente:`, margin, y)
  doc.setFont("helvetica", "bold")
  doc.text(data.patient_name, margin + 22, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.text(`Tratamiento:`, margin, y)
  doc.setFont("helvetica", "bold")
  const treatLines = doc.splitTextToSize(data.treatment_description, contentW - 32)
  doc.text(treatLines, margin + 32, y)
  y += treatLines.length * 5 + 2

  if (data.tooth) {
    doc.setFont("helvetica", "normal")
    doc.text(`Pieza dental:`, margin, y)
    doc.setFont("helvetica", "bold")
    doc.text(data.tooth, margin + 30, y)
    y += 6
  }

  y += 4

  // ── Tabla de montos ────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Concepto", "Monto"]],
    body: [
      ["Costo total del tratamiento", fmt(data.treatment_cost)],
      ["Total abonado anteriormente", fmt(data.total_paid_before)],
      ["Abono de hoy", fmt(data.amount_this_payment)],
      ["Saldo restante", fmt(data.remaining)],
    ],
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: contentW - 50 },
      1: { cellWidth: 50, halign: "right" },
    },
    didParseCell: (hookData) => {
      // Negrita para "Abono de hoy" y "Saldo restante"
      if (hookData.section === "body" && (hookData.row.index === 2 || hookData.row.index === 3)) {
        hookData.cell.styles.fontStyle = "bold"
      }
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── Método de pago ─────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const methodLabel: Record<string, string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia bancaria",
    cheque: "Cheque",
    otros: "Otros",
  }
  doc.text(`Método de pago: ${methodLabel[data.method] ?? data.method}`, margin, y)
  y += 6

  if (data.concept) {
    const conceptLines = doc.splitTextToSize(`Concepto: ${data.concept}`, contentW)
    doc.text(conceptLines, margin, y)
    y += conceptLines.length * 5 + 2
  }

  // ── Firma ──────────────────────────────────────────────────────────────
  const signY = 250
  if (clinic.signature_url) {
    try {
      const resp = await fetch(clinic.signature_url)
      const blob = await resp.blob()
      const b64 = await new Promise<string>((res) => {
        const reader = new FileReader()
        reader.onloadend = () => res(reader.result as string)
        reader.readAsDataURL(blob)
      })
      const ext = (blob.type.split("/")[1] || "png").toUpperCase() as any
      doc.addImage(b64, ext, W / 2 - 28, signY - 16, 56, 16)
    } catch {
      // skip firma si falla la carga
    }
  }
  doc.setDrawColor(120, 120, 120)
  doc.line(W / 2 - 30, signY, W / 2 + 30, signY)
  if (clinic.doctor_name) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(clinic.doctor_name, W / 2, signY + 5, { align: "center" })
  }
  if (clinic.specialty) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(clinic.specialty, W / 2, signY + 10, { align: "center" })
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text("Documento generado por OdontoSoft", W / 2, 287, { align: "center" })
  doc.setTextColor(0, 0, 0)

  const filename = `Recibo-${data.receipt_number}.pdf`
  const pdfBlob = doc.output("blob")
  return new File([pdfBlob], filename, { type: "application/pdf" })
}
