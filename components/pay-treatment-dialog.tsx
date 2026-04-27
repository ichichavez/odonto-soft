"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { treatmentPaymentService, type TreatmentPayment, type ReceiptData } from "@/services/treatment-payments"
import type { TreatmentPlanItem } from "@/services/treatment-plan"

interface PayTreatmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: TreatmentPlanItem
  patientId: string
  patientName: string
  clinicId: string
  userId: string | null
  onPaid: (payment: TreatmentPayment, receiptData: ReceiptData) => void
}

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "cheque", label: "Cheque" },
  { value: "otros", label: "Otros" },
]

export function PayTreatmentDialog({
  open,
  onOpenChange,
  item,
  patientId,
  patientName,
  clinicId,
  userId,
  onPaid,
}: PayTreatmentDialogProps) {
  const { toast } = useToast()
  const remaining = Math.max(0, item.cost - item.payment)

  const [amount, setAmount] = useState<number>(remaining)
  const [method, setMethod] = useState("efectivo")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [concept, setConcept] = useState(item.description)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0) {
      toast({ title: "Error", description: "El monto debe ser mayor a cero.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payment = await treatmentPaymentService.create({
        patient_id: patientId,
        clinic_id: clinicId,
        treatment_plan_item_id: item.id,
        date,
        amount,
        method,
        concept: concept.trim() || null,
        created_by: userId,
      })

      // Obtener todos los pagos del item para calcular acumulados correctamente
      const allItemPayments = await treatmentPaymentService.getByItem(item.id)
      const receiptData = treatmentPaymentService.buildReceiptData(payment, item, allItemPayments, patientName)

      onPaid(payment, receiptData)
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err?.message ?? "No se pudo registrar el pago.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1 bg-muted/40 rounded-md p-3">
            <p><span className="font-medium">Tratamiento:</span> {item.description}</p>
            {item.tooth && <p><span className="font-medium">Pieza:</span> {item.tooth}</p>}
            <p><span className="font-medium">Costo:</span> ₲ {item.cost.toLocaleString("es-PY")}</p>
            <p><span className="font-medium">Abonado:</span> ₲ {item.payment.toLocaleString("es-PY")}</p>
            <p><span className="font-medium">Saldo:</span> ₲ {remaining.toLocaleString("es-PY")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Monto a pagar *</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              step="any"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-method">Método de pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="pay-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-concept">Concepto (opcional)</Label>
            <Input
              id="pay-concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Descripción del pago"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
