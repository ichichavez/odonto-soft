"use client"

import type React from "react"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Printer, Save, Trash2 } from "lucide-react"
import { patientService } from "@/services/patients"
import { treatmentPlanService, type TreatmentPlanItem } from "@/services/treatment-plan"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"

interface Row {
  _key: number
  date: string
  tooth: string
  description: string
  cost: number
  payment: number
}

let keyCounter = 0
function newRow(): Row {
  return {
    _key: ++keyCounter,
    date: new Date().toISOString().split("T")[0],
    tooth: "",
    description: "",
    cost: 0,
    payment: 0,
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

  useEffect(() => {
    const load = async () => {
      try {
        const [pat, items] = await Promise.all([
          patientService.getById(params.id),
          treatmentPlanService.getByPatient(params.id),
        ])
        setPatient(pat)
        if (items.length > 0) {
          setRows(
            items.map((item) => ({
              _key: ++keyCounter,
              date: item.date,
              tooth: item.tooth ?? "",
              description: item.description,
              cost: item.cost,
              payment: item.payment,
            })),
          )
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
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    )
  }, [])

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (key: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev))

  const totalCost = rows.reduce((s, r) => s + (r.cost || 0), 0)
  const totalPayment = rows.reduce((s, r) => s + (r.payment || 0), 0)
  const totalBalance = totalCost - totalPayment

  const handleSave = async () => {
    const valid = rows.every((r) => r.description.trim())
    if (!valid) {
      toast({ title: "Error", description: "Complete la descripción de todos los ítems", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const items: Omit<TreatmentPlanItem, "id" | "created_at">[] = rows.map((r) => ({
        patient_id: params.id,
        clinic_id: clinic?.id ?? null,
        created_by: user?.id ?? null,
        date: r.date,
        tooth: r.tooth || null,
        description: r.description,
        cost: r.cost,
        payment: r.payment,
      }))
      await treatmentPlanService.upsertItems(params.id, items)
      toast({ title: "Guardado", description: "Plan de tratamiento guardado exitosamente." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo guardar el plan", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => window.print()

  const fmt = (n: number) => `₲ ${n.toLocaleString("es-PY")}`

  return (
    <>
      {/* ── Print styles ── */}
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
      `}</style>

      <div id="plan-print" className="flex flex-col p-6 space-y-6">
        {/* ── Header ── */}
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
            <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* ── Print header (visible only on print) ── */}
        <div className="hidden print:block mb-4">
          <h2 className="text-xl font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
          <p className="text-sm">Plan de Tratamiento</p>
          {patient && (
            <p className="text-sm">
              Paciente: {patient.first_name} {patient.last_name}
            </p>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Diente</th>
                  <th className="px-3 py-2 font-medium w-[35%]">Tratamiento</th>
                  <th className="px-3 py-2 font-medium text-right">Costo</th>
                  <th className="px-3 py-2 font-medium text-right">Entrega</th>
                  <th className="px-3 py-2 font-medium text-right">Saldo</th>
                  <th className="px-3 py-2 no-print"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const balance = (row.cost || 0) - (row.payment || 0)
                  return (
                    <tr key={row._key} className="border-t">
                      <td className="px-1 py-1">
                        <Input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(row._key, "date", e.target.value)}
                          className="h-8 text-xs w-36 no-print"
                        />
                        <span className="hidden print:inline">{row.date}</span>
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          value={row.tooth}
                          onChange={(e) => updateRow(row._key, "tooth", e.target.value)}
                          placeholder="Ej. 36"
                          className="h-8 text-xs w-20 no-print"
                        />
                        <span className="hidden print:inline">{row.tooth}</span>
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          value={row.description}
                          onChange={(e) => updateRow(row._key, "description", e.target.value)}
                          placeholder="Descripción del tratamiento"
                          className="h-8 text-xs no-print"
                        />
                        <span className="hidden print:inline">{row.description}</span>
                      </td>
                      <td className="px-1 py-1 text-right">
                        <Input
                          type="number"
                          value={row.cost}
                          onChange={(e) => updateRow(row._key, "cost", parseFloat(e.target.value) || 0)}
                          min="0"
                          className="h-8 text-xs w-28 text-right no-print"
                        />
                        <span className="hidden print:inline">{fmt(row.cost)}</span>
                      </td>
                      <td className="px-1 py-1 text-right">
                        <Input
                          type="number"
                          value={row.payment}
                          onChange={(e) => updateRow(row._key, "payment", parseFloat(e.target.value) || 0)}
                          min="0"
                          className="h-8 text-xs w-28 text-right no-print"
                        />
                        <span className="hidden print:inline">{fmt(row.payment)}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(balance)}
                      </td>
                      <td className="px-1 py-1 no-print">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row._key)}
                          disabled={rows.length === 1}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="no-print">
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar fila
          </Button>
        </div>
      </div>
    </>
  )
}
