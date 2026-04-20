"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Download, Loader2, MessageCircle, Printer } from "lucide-react"
import Image from "next/image"
import { patientService } from "@/services/patients"
import { prescriptionService, type Prescription } from "@/services/prescriptions"
import { useClinic } from "@/context/clinic-context"

export default function VerRecetaPage() {
  const params = useParams() as { id: string; recetaId: string }
  const { toast } = useToast()
  const { clinic } = useClinic()
  const [patient, setPatient] = useState<any>(null)
  const [rx, setRx] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [pat, receta] = await Promise.all([
          patientService.getById(params.id),
          prescriptionService.getById(params.recetaId),
        ])
        setPatient(pat)
        setRx(receta)
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "No se pudo cargar la receta", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, params.recetaId, toast])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })

  const buildWhatsAppChatUrl = () => {
    if (!patient?.phone || !rx) return null
    const phone = patient.phone.replace(/\D/g, "")
    const msg = `Hola ${patient.first_name}, le enviamos su receta odontológica del ${formatDate(rx.date)}.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  /** Genera un PDF de la receta y lo devuelve como File. */
  const generatePrescriptionPdf = async (): Promise<File> => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ format: "a4", unit: "mm" })
    const W = 210
    const margin = 20
    const contentW = W - margin * 2
    let y = margin

    // ── Membrete ──────────────────────────────────────────────────────────
    // Logo (si existe)
    if (clinic?.logo_url) {
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
        doc.text(clinic?.name ?? "Clínica Odontológica", margin + 24, y + 6)
        if (clinic?.doctor_name) {
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.text(clinic.doctor_name, margin + 24, y + 12)
        }
        const subInfo = [clinic?.specialty, clinic?.professional_registration].filter(Boolean).join(" · ")
        if (subInfo) {
          doc.setFontSize(9)
          doc.text(subInfo, margin + 24, y + 17)
        }
        y += 25
      } catch {
        // Logo fetch failed — print without it
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(clinic?.name ?? "Clínica Odontológica", margin, y)
        y += 7
      }
    } else {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(clinic?.name ?? "Clínica Odontológica", margin, y)
      y += 7
      if (clinic?.doctor_name) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(clinic.doctor_name, margin, y)
        y += 5
      }
      const sub = [clinic?.specialty, clinic?.professional_registration].filter(Boolean).join(" · ")
      if (sub) { doc.setFontSize(9); doc.text(sub, margin, y); y += 5 }
    }
    if (clinic?.address) { doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(clinic.address, margin, y); y += 4 }
    if (clinic?.phone)   { doc.text(`Tel: ${clinic.phone}`, margin, y); y += 4 }

    // Línea separadora
    y += 3
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(margin, y, W - margin, y)
    y += 7

    // ── Encabezado de receta ───────────────────────────────────────────────
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Receta Odontológica", margin, y)
    y += 6

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const patName = patient ? `${patient.first_name} ${patient.last_name}` : "—"
    doc.text(`Paciente: ${patName}`, margin, y)
    doc.text(`Fecha: ${formatDate(rx!.date)}`, W - margin, y, { align: "right" })
    y += 5
    if (patient?.identity_number) {
      doc.text(`C.I.: ${patient.identity_number}`, margin, y)
      y += 5
    }
    y += 4

    // ── Diagnóstico ────────────────────────────────────────────────────────
    if (rx!.diagnosis) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Dx.", margin, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(rx!.diagnosis, contentW - 5)
      doc.text(lines, margin + 4, y)
      y += lines.length * 5.5 + 6
    }

    // ── Prescripción ───────────────────────────────────────────────────────
    if (rx!.prescription_text) {
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Rp.", margin, y)
      y += 7
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(rx!.prescription_text, contentW - 5)
      doc.text(lines, margin + 4, y)
      y += lines.length * 5.5 + 6
    }

    // ── Indicaciones ───────────────────────────────────────────────────────
    if (rx!.instructions_text) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Indicaciones", margin, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(rx!.instructions_text, contentW - 5)
      doc.text(lines, margin + 4, y)
      y += lines.length * 5.5 + 6
    }

    // ── Validez ────────────────────────────────────────────────────────────
    y += 4
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    doc.text("Válido por 1 mes a partir de la fecha de emisión.", margin, y)
    doc.setTextColor(0, 0, 0)

    // ── Firma ──────────────────────────────────────────────────────────────
    const signY = 250
    if (clinic?.signature_url) {
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
      } catch { /* skip */ }
    }
    doc.setDrawColor(120, 120, 120)
    doc.line(W / 2 - 30, signY, W / 2 + 30, signY)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(rx!.signed_by_name ?? "", W / 2, signY + 5, { align: "center" })
    if (clinic?.specialty) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(clinic.specialty, W / 2, signY + 10, { align: "center" })
    }
    if (clinic?.professional_registration) {
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(clinic.professional_registration, W / 2, signY + 15, { align: "center" })
    }

    const filename = `receta-${(patient?.last_name ?? "paciente").toLowerCase()}-${rx!.date}.pdf`
    const pdfBlob = doc.output("blob")
    return new File([pdfBlob], filename, { type: "application/pdf" })
  }

  /** Genera el PDF y lo envía por WhatsApp (Web Share API en móvil, descarga+link en escritorio) */
  const handleWhatsAppPdf = async () => {
    if (!rx) return
    setGeneratingPdf(true)
    try {
      const pdfFile = await generatePrescriptionPdf()

      // Intentar Web Share API (mobile browsers)
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: "Receta Odontológica",
          text: `Receta para ${patient?.first_name ?? ""} ${patient?.last_name ?? ""} — ${formatDate(rx.date)}`,
        })
      } else {
        // Fallback: descargar PDF + abrir WhatsApp
        const url = URL.createObjectURL(pdfFile)
        const a = document.createElement("a")
        a.href = url
        a.download = pdfFile.name
        a.click()
        URL.revokeObjectURL(url)

        // Abrir WhatsApp con un mensaje corto
        const waUrl = buildWhatsAppChatUrl()
        if (waUrl) {
          setTimeout(() => window.open(waUrl, "_blank"), 800)
          toast({
            title: "PDF descargado",
            description: "Adjuntá el archivo en WhatsApp que se abrió.",
          })
        } else {
          toast({ title: "PDF descargado", description: "El paciente no tiene teléfono registrado para abrir WhatsApp." })
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Error al generar PDF", description: err?.message ?? String(err), variant: "destructive" })
      }
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #rx-print, #rx-print * { visibility: visible; }
          #rx-print { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; font-family: serif; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col p-6 space-y-6">
        {/* Nav bar */}
        <div className="flex items-center gap-4 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/pacientes/${params.id}/receta`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Receta</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleWhatsAppPdf}
              disabled={generatingPdf || !rx}
              title={patient?.phone ? "Generar PDF y enviar por WhatsApp" : "El paciente no tiene teléfono registrado"}
              className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 disabled:opacity-40"
            >
              {generatingPdf ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
              ) : (
                <><MessageCircle className="h-4 w-4" />WhatsApp (PDF)</>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : !rx ? (
          <p className="text-muted-foreground">Receta no encontrada.</p>
        ) : (
          <div
            id="rx-print"
            className="max-w-2xl mx-auto border rounded-lg p-8 space-y-6 bg-white text-gray-900"
          >
            {/* Membrete */}
            <div className="border-b pb-4 flex items-start gap-4">
              {clinic?.logo_url && (
                <Image
                  src={clinic.logo_url}
                  alt="Logo"
                  width={72}
                  height={72}
                  className="object-contain shrink-0"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
                {clinic?.doctor_name && (
                  <p className="text-sm font-medium text-gray-700">{clinic.doctor_name}</p>
                )}
                {(clinic?.specialty || clinic?.professional_registration) && (
                  <p className="text-sm text-gray-600">
                    {[clinic?.specialty, clinic?.professional_registration].filter(Boolean).join(" · ")}
                  </p>
                )}
                {clinic?.address && <p className="text-sm text-gray-600">{clinic.address}</p>}
                {clinic?.phone && <p className="text-sm text-gray-600">Tel: {clinic.phone}</p>}
              </div>
            </div>

            {/* Encabezado */}
            <div className="flex justify-between text-sm">
              <div>
                <p>
                  <span className="font-semibold">Paciente:</span>{" "}
                  {patient ? `${patient.first_name} ${patient.last_name}` : "—"}
                </p>
                {patient?.identity_number && (
                  <p>
                    <span className="font-semibold">C.I.:</span> {patient.identity_number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">Fecha:</span> {formatDate(rx.date)}
                </p>
              </div>
            </div>

            {/* Dx */}
            {rx.diagnosis && (
              <div>
                <p className="font-bold mb-1">Dx.</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.diagnosis}
                </div>
              </div>
            )}

            {/* Rp. */}
            {rx.prescription_text && (
              <div>
                <p className="font-bold text-lg mb-1">Rp.</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.prescription_text}
                </div>
              </div>
            )}

            {/* Indicaciones */}
            {rx.instructions_text && (
              <div>
                <p className="font-bold mb-1">Indicaciones</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.instructions_text}
                </div>
              </div>
            )}

            {/* Validez */}
            <p className="text-xs text-gray-500 italic">
              Válido por 1 mes a partir de la fecha de emisión.
            </p>

            {/* Firma */}
            <div className="pt-6 border-t text-center text-sm">
              {clinic?.signature_url && (
                <div className="flex justify-center mb-2">
                  <Image
                    src={clinic.signature_url}
                    alt="Firma"
                    width={160}
                    height={64}
                    className="object-contain"
                  />
                </div>
              )}
              <div className="border-t border-gray-400 w-56 mx-auto pt-2">
                <p className="font-semibold">{rx.signed_by_name}</p>
                {clinic?.specialty && <p className="text-gray-600">{clinic.specialty}</p>}
                {clinic?.professional_registration && (
                  <p className="text-gray-500 text-xs">{clinic.professional_registration}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
