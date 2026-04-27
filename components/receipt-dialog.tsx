"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Loader2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateReceiptPdf } from "@/lib/receipt-pdf"
import type { ReceiptData } from "@/services/treatment-payments"
import type { Clinic } from "@/context/clinic-context"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptData: ReceiptData
  clinic: Clinic
}

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia bancaria",
  cheque: "Cheque",
  otros: "Otros",
}

export function ReceiptDialog({ open, onOpenChange, receiptData, clinic }: ReceiptDialogProps) {
  const { toast } = useToast()
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const fmt = (n: number) => `₲ ${n.toLocaleString("es-PY")}`
  const formatDate = (d: string) => {
    const [year, month, day] = d.split("-")
    return `${day}/${month}/${year}`
  }

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true)
    try {
      const file = await generateReceiptPdf(receiptData, clinic)
      const url = URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast({ title: "Error al generar PDF", description: err?.message ?? String(err), variant: "destructive" })
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recibo de Pago</DialogTitle>
        </DialogHeader>

        {/* Recibo visual */}
        <div
          id="receipt-print"
          className="border rounded-lg p-6 space-y-4 bg-white text-gray-900 text-sm"
        >
          {/* Membrete */}
          <div className="border-b pb-3">
            <p className="font-bold text-base">{clinic.name}</p>
            {clinic.doctor_name && <p className="text-xs text-gray-600">{clinic.doctor_name}</p>}
            {clinic.address && <p className="text-xs text-gray-500">{clinic.address}</p>}
            {clinic.phone && <p className="text-xs text-gray-500">Tel: {clinic.phone}</p>}
          </div>

          {/* Título + N° */}
          <div className="flex justify-between items-center">
            <p className="font-bold text-base uppercase tracking-wide">Recibo de Pago</p>
            <p className="font-bold text-primary">{receiptData.receipt_number}</p>
          </div>

          {/* Datos */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Fecha:</span>
              <span className="font-medium">{formatDate(receiptData.date)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Paciente:</span>
              <span className="font-medium">{receiptData.patient_name}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Tratamiento:</span>
              <span className="font-medium">{receiptData.treatment_description}</span>
            </div>
            {receiptData.tooth && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">Pieza:</span>
                <span className="font-medium">{receiptData.tooth}</span>
              </div>
            )}
          </div>

          {/* Tabla de montos */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-1.5 text-left">Concepto</th>
                  <th className="px-3 py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-1.5">Costo total del tratamiento</td>
                  <td className="px-3 py-1.5 text-right">{fmt(receiptData.treatment_cost)}</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-1.5">Total abonado anteriormente</td>
                  <td className="px-3 py-1.5 text-right">{fmt(receiptData.total_paid_before)}</td>
                </tr>
                <tr className="border-t bg-green-50">
                  <td className="px-3 py-1.5 font-bold">Abono de hoy</td>
                  <td className="px-3 py-1.5 text-right font-bold text-green-700">{fmt(receiptData.amount_this_payment)}</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-1.5 font-bold">Saldo restante</td>
                  <td className={`px-3 py-1.5 text-right font-bold ${receiptData.remaining > 0 ? "text-red-600" : "text-green-700"}`}>
                    {fmt(receiptData.remaining)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Método / concepto */}
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>Método: {METHOD_LABELS[receiptData.method] ?? receiptData.method}</p>
            {receiptData.concept && <p>Concepto: {receiptData.concept}</p>}
          </div>

          <p className="text-xs text-gray-400 text-center pt-2 border-t">
            Documento generado por OdontoSoft
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadPdf} disabled={generatingPdf} className="flex items-center gap-2">
            {generatingPdf ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
            ) : (
              <><Download className="h-4 w-4" />Descargar PDF</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
