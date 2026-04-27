"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Receipt, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { treatmentPaymentService, type TreatmentPayment, type ReceiptData } from "@/services/treatment-payments"
import { ReceiptDialog } from "@/components/receipt-dialog"
import type { TreatmentPlanItem } from "@/services/treatment-plan"
import type { Clinic } from "@/context/clinic-context"

interface TreatmentPaymentHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: TreatmentPlanItem
  payments: TreatmentPayment[]
  patientName: string
  clinic: Clinic
  isAdmin: boolean
  onDeleted: (paymentId: string) => void
}

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otros: "Otros",
}

export function TreatmentPaymentHistory({
  open,
  onOpenChange,
  item,
  payments,
  patientName,
  clinic,
  isAdmin,
  onDeleted,
}: TreatmentPaymentHistoryProps) {
  const { toast } = useToast()
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fmt = (n: number) => `₲ ${n.toLocaleString("es-PY")}`
  const formatDate = (d: string) => {
    const [year, month, day] = d.split("-")
    return `${day}/${month}/${year}`
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, item.cost - totalPaid)

  // Ordenado ASC para calcular acumulados correctamente
  const paymentsAsc = [...payments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.created_at.localeCompare(b.created_at)
  })

  const handleViewReceipt = (payment: TreatmentPayment) => {
    const data = treatmentPaymentService.buildReceiptData(payment, item, paymentsAsc, patientName)
    setReceiptData(data)
    setReceiptOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await treatmentPaymentService.delete(deleteTarget)
      onDeleted(deleteTarget)
      toast({ title: "Pago eliminado" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "No se pudo eliminar el pago.", variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Historial de Pagos</SheetTitle>
          </SheetHeader>

          {/* Resumen del item */}
          <div className="space-y-1 text-sm bg-muted/40 rounded-md p-3 mb-4">
            <p className="font-semibold">{item.description}</p>
            {item.tooth && <p className="text-muted-foreground">Pieza: {item.tooth}</p>}
            <div className="flex gap-4 pt-1 text-xs">
              <span>Costo: <strong>{fmt(item.cost)}</strong></span>
              <span>Abonado: <strong className="text-green-700">{fmt(totalPaid)}</strong></span>
              <span>Saldo: <strong className={remaining > 0 ? "text-red-600" : "text-green-700"}>{fmt(remaining)}</strong></span>
            </div>
          </div>

          {/* Lista de pagos */}
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Sin pagos registrados
            </p>
          ) : (
            <div className="space-y-2">
              {[...payments]
                .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatDate(p.date)}</span>
                        <Badge variant="secondary" className="text-xs">{p.receipt_number}</Badge>
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {METHOD_LABELS[p.method] ?? p.method}
                        {p.concept && ` · ${p.concept}`}
                      </div>
                    </div>
                    <span className="font-semibold text-green-700 shrink-0">{fmt(p.amount)}</span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Ver recibo"
                        onClick={() => handleViewReceipt(p)}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Eliminar pago"
                          onClick={() => setDeleteTarget(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Receipt dialog */}
      {receiptData && (
        <ReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          receiptData={receiptData}
          clinic={clinic}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El saldo del tratamiento se recalculará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
