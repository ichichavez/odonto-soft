"use client"

import type React from "react"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, History, Lock, Pencil, Printer, Save, Trash2, CreditCard } from "lucide-react"
import { patientService } from "@/services/patients"
import { treatmentPlanService, type TreatmentPlanItem } from "@/services/treatment-plan"
import { treatmentPaymentService, type TreatmentPayment, type ReceiptData } from "@/services/treatment-payments"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { PayTreatmentDialog } from "@/components/pay-treatment-dialog"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { TreatmentPaymentHistory } from "@/components/treatment-payment-history"

interface Row {
  _key: number
  id: string          // ID real del DB item (vacío = nuevo)
  date: string
  tooth: string
  description: string
  cost: number
  payment: number
  editing: boolean
}

let keyCounter = 0
function newRow(): Row {
  return {
    _key: ++keyCounter,
    id: "",
    date: new Date().toISOString().split("T")[0],
    tooth: "",
    description: "",
    cost: 0,
    payment: 0,
    editing: true,
  }
}

export default function PlanTratamientoPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [rows, setRows] = useState<Row[]>([newRow()])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mapa itemId → pagos (para contar/mostrar)
  const [paymentsMap, setPaymentsMap] = useState<Map<string, TreatmentPayment[]>>(new Map())

  // Dialogs
  const [payDialog, setPayDialog] = useState<{ open: boolean; item: TreatmentPlanItem | null }>({ open: false, item: null })
  const [receiptDialog, setReceiptDialog] = useState<{ open: boolean; data: ReceiptData | null }>({ open: false, data: null })
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item: TreatmentPlanItem | null }>({ open: false, item: null })

  const isAdmin = user?.role === "admin" || user?.role === "superadmin"

  useEffect(() => {
    const load = async () => {
      try {
        const [pat, items, allPayments] = await Promise.all([
          patientService.getById(params.id),
          treatmentPlanService.getByPatient(params.id),
          treatmentPaymentService.getByPatient(params.id),
        ])
        setPatient(pat)

        // Construir mapa de pagos por itemId
        const map = new Map<string, TreatmentPayment[]>()
        for (const p of allPayments) {
          if (p.treatment_plan_item_id) {
            const arr = map.get(p.treatment_plan_item_id) ?? []
            arr.push(p)
            map.set(p.treatment_plan_item_id, arr)
          }
        }
        setPaymentsMap(map)

        if (items.length > 0) {
          setRows([
            ...items.map((item) => ({
              _key: ++keyCounter,
              id: item.id,
              date: item.date,
              tooth: item.tooth ?? "",
              description: item.description,
              cost: item.cost,
              payment: item.payment,
              editing: false,
            })),
            newRow(),
          ])
        }
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "No se pudo cargar el plan de tratamiento", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, toast])

  const updateRow = useCallback((key: number, field: keyof Row, value: any) => {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)))
  }, [])

  const removeRow = (key: number) => {
    setRows((prev) => {
      const next = prev.length > 1 ? prev.filter((r) => r._key !== key) : prev
      const last = next[next.length - 1]
      if (last && last.description.trim()) return [...next, newRow()]
      return next
    })
  }

  const totalCost    = rows.reduce((s, r) => s + (r.cost    || 0), 0)
  const totalPayment = rows.reduce((s, r) => s + (r.payment || 0), 0)
  const totalBalance = totalCost - totalPayment

  const saveRows = async (rowsToSave: Row[]) => {
    const contentRows = rowsToSave.filter((r) => r.description.trim())
    setSaving(true)
    try {
      const items = contentRows.map((r) => ({
        id: r.id || undefined,
        patient_id:  params.id,
        clinic_id:   clinic?.id ?? null,
        created_by:  user?.id ?? null,
        date:        r.date,
        tooth:       r.tooth || null,
        description: r.description,
        cost:        r.cost,
        payment:     r.payment,
      }))
      const updated = await treatmentPlanService.upsertItems(params.id, items as any)

      // Re-sync rows con IDs reales retornados
      setRows((prev) => {
        const updatedById = new Map(updated.map((u) => [u.id, u]))
        const result: Row[] = []
        let dbIdx = 0
        for (const row of prev) {
          if (!row.description.trim()) {
            result.push(row)
            continue
          }
          if (row.id && updatedById.has(row.id)) {
            const u = updatedById.get(row.id)!
            result.push({ ...row, payment: u.payment })
          } else {
            // Nuevo item — asignar ID del updated en orden
            const u = updated[dbIdx++]
            if (u) result.push({ ...row, id: u.id })
            else result.push(row)
          }
        }
        return result
      })

      toast({ title: "Guardado", description: "Plan de tratamiento guardado exitosamente." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo guardar el plan", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => saveRows(rows)

  const handleEntregaEnter = async (key: number) => {
    let updated = rows.map((r) => (r._key === key ? { ...r, editing: false } : r))
    const last = updated[updated.length - 1]
    if (last.description.trim() || last.cost || last.payment) {
      updated = [...updated, newRow()]
    } else {
      updated = updated.map((r, i) => (i === updated.length - 1 ? { ...r, editing: true } : r))
    }
    setRows(updated)
    await saveRows(updated)
  }

  // Convierte una Row en TreatmentPlanItem para los dialogs
  const rowToItem = (row: Row): TreatmentPlanItem => ({
    id: row.id,
    patient_id: params.id,
    clinic_id: clinic?.id ?? null,
    date: row.date,
    tooth: row.tooth || null,
    description: row.description,
    cost: row.cost,
    payment: row.payment,
  })

  const handlePaid = (payment: TreatmentPayment, receiptData: ReceiptData) => {
    // Actualizar paymentsMap
    setPaymentsMap((prev) => {
      const next = new Map(prev)
      const itemId = payment.treatment_plan_item_id!
      const arr = [...(next.get(itemId) ?? []), payment]
      next.set(itemId, arr)
      return next
    })

    // Actualizar payment en la row
    if (payment.treatment_plan_item_id) {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== payment.treatment_plan_item_id) return r
          const newPayment = r.payment + payment.amount
          return { ...r, payment: newPayment }
        })
      )
    }

    // Abrir recibo
    setReceiptDialog({ open: true, data: receiptData })
  }

  const handlePaymentDeleted = (paymentId: string) => {
    setPaymentsMap((prev) => {
      const next = new Map(prev)
      for (const [itemId, ps] of next.entries()) {
        const remaining = ps.filter((p) => p.id !== paymentId)
        if (remaining.length !== ps.length) {
          next.set(itemId, remaining)
          const totalPaid = remaining.reduce((s, p) => s + p.amount, 0)
          // Actualizar row
          setRows((prevRows) =>
            prevRows.map((r) => (r.id === itemId ? { ...r, payment: totalPaid } : r))
          )
          break
        }
      }
      return next
    })
  }

  const fmt = (n: number) => `₲ ${n.toLocaleString("es-PY")}`

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #plan-print, #plan-print * { visibility: visible; }
          #plan-print { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
          th { background: #f0f0f0; }
        }
        @media print {
          #receipt-print, #receipt-print * { visibility: visible; }
        }
      `}</style>

      <div id="plan-print" className="flex flex-col p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/pacientes/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Plan de Tratamiento</h1>
            {patient && (
              <p className="text-muted-foreground text-sm">
                {patient.first_name} {patient.last_name}
              </p>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Encabezado impresión */}
        <div className="hidden print:block mb-4">
          <h2 className="text-xl font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
          <p className="text-sm">Plan de Tratamiento</p>
          {patient && (
            <p className="text-sm">Paciente: {patient.first_name} {patient.last_name}</p>
          )}
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Diente</th>
                  <th className="px-3 py-2 font-medium w-[30%]">Tratamiento</th>
                  <th className="px-3 py-2 font-medium text-right">Costo</th>
                  <th className="px-3 py-2 font-medium text-right">Pagado</th>
                  <th className="px-3 py-2 font-medium text-right">Saldo</th>
                  <th className="px-3 py-2 no-print w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const balance = (row.cost || 0) - (row.payment || 0)
                  const rowPayments = row.id ? (paymentsMap.get(row.id) ?? []) : []
                  const hasPayments = rowPayments.length > 0

                  return (
                    <tr
                      key={row._key}
                      className={`border-t ${row.editing ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    >
                      {row.editing ? (
                        <>
                          <td className="px-1 py-1">
                            <Input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateRow(row._key, "date", e.target.value)}
                              className="h-8 text-xs w-36"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={row.tooth}
                              onChange={(e) => updateRow(row._key, "tooth", e.target.value)}
                              placeholder="Ej. 36"
                              className="h-8 text-xs w-20"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={row.description}
                              onChange={(e) => updateRow(row._key, "description", e.target.value)}
                              placeholder="Descripción del tratamiento"
                              className="h-8 text-xs"
                              autoFocus={!row.description}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              value={row.cost || ""}
                              onChange={(e) => updateRow(row._key, "cost", parseFloat(e.target.value) || 0)}
                              min="0"
                              placeholder="0"
                              className="h-8 text-xs w-28 text-right"
                            />
                          </td>
                          <td className="px-1 py-1">
                            {hasPayments ? (
                              <Badge variant="secondary" className="text-xs">
                                {fmt(row.payment)}
                              </Badge>
                            ) : (
                              <Input
                                type="number"
                                value={row.payment || ""}
                                onChange={(e) => updateRow(row._key, "payment", parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleEntregaEnter(row._key)
                                  }
                                }}
                                min="0"
                                placeholder="0"
                                className="h-8 text-xs w-28 text-right"
                              />
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{row.date}</td>
                          <td className="px-3 py-2 text-xs">{row.tooth || "—"}</td>
                          <td className="px-3 py-2">{row.description}</td>
                          <td className="px-3 py-2 text-right">{fmt(row.cost)}</td>
                          <td className="px-3 py-2 text-right">
                            {hasPayments ? (
                              <Badge variant="secondary" className="text-xs">
                                {fmt(row.payment)}
                              </Badge>
                            ) : (
                              fmt(row.payment)
                            )}
                          </td>
                        </>
                      )}
                      <td className={`px-3 py-2 text-right font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(balance)}
                      </td>
                      <td className="px-1 py-1 no-print">
                        <div className="flex items-center gap-0.5">
                          {/* Botón Pagar: solo si hay descripción y hay saldo */}
                          {row.description.trim() && balance > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPayDialog({ open: true, item: rowToItem(row) })}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Registrar pago"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Botón Historial: si hay pagos */}
                          {hasPayments && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setHistoryDialog({ open: true, item: rowToItem(row) })}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title={`Historial (${rowPayments.length} pago${rowPayments.length > 1 ? "s" : ""})`}
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Editar: solo si no está en modo edición */}
                          {!row.editing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateRow(row._key, "editing", true)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Editar fila"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Eliminar: bloqueado si tiene pagos */}
                          {hasPayments ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled
                              className="h-8 w-8 text-muted-foreground/40 cursor-not-allowed"
                              title="No se puede eliminar: tiene pagos asociados"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(row._key)}
                              disabled={rows.length === 1}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Eliminar fila"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">Totales</td>
                  <td className="px-3 py-2 text-right">{fmt(totalCost)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalPayment)}</td>
                  <td className={`px-3 py-2 text-right ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {fmt(totalBalance)}
                  </td>
                  <td className="no-print" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Dialog: Registrar pago */}
      {payDialog.item && clinic && (
        <PayTreatmentDialog
          open={payDialog.open}
          onOpenChange={(o) => setPayDialog({ open: o, item: payDialog.item })}
          item={payDialog.item}
          patientId={params.id}
          patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""}
          clinicId={clinic.id}
          userId={user?.id ?? null}
          onPaid={handlePaid}
        />
      )}

      {/* Dialog: Ver recibo */}
      {receiptDialog.data && clinic && (
        <ReceiptDialog
          open={receiptDialog.open}
          onOpenChange={(o) => setReceiptDialog({ open: o, data: receiptDialog.data })}
          receiptData={receiptDialog.data}
          clinic={clinic}
        />
      )}

      {/* Sheet: Historial de pagos */}
      {historyDialog.item && clinic && (
        <TreatmentPaymentHistory
          open={historyDialog.open}
          onOpenChange={(o) => setHistoryDialog({ open: o, item: historyDialog.item })}
          item={historyDialog.item}
          payments={paymentsMap.get(historyDialog.item.id) ?? []}
          patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""}
          clinic={clinic}
          isAdmin={isAdmin}
          onDeleted={handlePaymentDeleted}
        />
      )}
    </>
  )
}
