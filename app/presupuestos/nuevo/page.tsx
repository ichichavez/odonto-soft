"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import { budgetService } from "@/services/budgets"
import { treatmentService } from "@/services/treatments"
import { patientService } from "@/services/patients"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { RoleGuard } from "@/components/role-guard"

interface Item {
  treatment_id: string
  description: string
  tooth: string
  quantity: number
  price: number
  total: number
}

function addOneMonth(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString("es-ES")
}

const emptyItem = (): Item => ({
  treatment_id: "",
  description: "",
  tooth: "",
  quantity: 1,
  price: 0,
  total: 0,
})

export default function NuevoPresupuestoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const { clinic } = useClinic()
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])

  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({ patient_id: "", date: today, status: "pendiente", notes: "" })
  const [items, setItems] = useState<Item[]>([emptyItem()])

  useEffect(() => {
    Promise.all([patientService.getAll(), treatmentService.getAll()])
      .then(([p, t]) => { setPatients(p); setTreatments(t) })
      .catch(() => toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (idx: number, field: keyof Item, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === "treatment_id" && value) {
        const t = treatments.find(t => t.id === value)
        if (t) { updated.description = t.name; updated.price = t.price }
      }
      if (field === "price" || field === "quantity") {
        updated.total = (field === "price" ? value : updated.price) *
                        (field === "quantity" ? value : updated.quantity)
      }
      return updated
    }))
  }

  const taxRate = clinic?.tax_rate ?? 10
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.patient_id) {
      toast({ title: "Error", description: "Seleccione un paciente", variant: "destructive" }); return
    }
    if (items.some(i => !i.description.trim())) {
      toast({ title: "Error", description: "Complete la descripción de todos los ítems", variant: "destructive" }); return
    }

    setSaving(true)
    try {
      const number = await budgetService.generateBudgetNumber()
      const budget = await budgetService.create(
        {
          number,
          patient_id: form.patient_id,
          user_id: user.id,
          clinic_id: clinic?.id ?? null,
          date: form.date,
          status: form.status as any,
          notes: form.notes || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
        },
        items.map(i => ({
          treatment_id: i.treatment_id || null,
          description: i.description,
          tooth: i.tooth || null,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        }))
      )
      toast({ title: "Presupuesto creado", description: `Presupuesto ${number} creado exitosamente.` })
      router.push(`/presupuestos/${budget.id}`)
    } catch {
      toast({ title: "Error", description: "No se pudo crear el presupuesto", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) => `₲ ${n.toLocaleString("es-PY")}`

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/presupuestos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Presupuesto</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos básicos */}
          <Card>
            <CardHeader>
              <CardTitle>Información del paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Paciente</Label>
                  <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de emisión</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  {form.date && (
                    <p className="text-xs text-muted-foreground">Válido hasta: {addOneMonth(form.date)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aceptado">Aceptado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de tratamientos</CardTitle>
              <CardDescription>
                Seleccione un tratamiento del catálogo para autocompletar, o escriba directamente en Descripción.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase">
                      <th className="text-left py-2 px-1 w-20">Diente</th>
                      <th className="text-left py-2 px-1">Descripción</th>
                      <th className="text-right py-2 px-1 w-20">Cant.</th>
                      <th className="text-right py-2 px-1 w-28">Precio unit.</th>
                      <th className="text-right py-2 px-1 w-28">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-1 py-1">
                          <Input
                            value={item.tooth}
                            onChange={e => updateItem(idx, "tooth", e.target.value)}
                            placeholder="Ej. 36"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <div className="flex gap-1">
                            <Input
                              value={item.description}
                              onChange={e => updateItem(idx, "description", e.target.value)}
                              placeholder="Descripción del tratamiento"
                              className="h-8 text-xs flex-1"
                            />
                            {treatments.length > 0 && (
                              <Select
                                value={item.treatment_id || ""}
                                onValueChange={v => updateItem(idx, "treatment_id", v)}
                              >
                                <SelectTrigger className="h-8 w-8 px-1 shrink-0 text-xs" title="Cargar desde catálogo">
                                  <span className="text-xs">▾</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">— Manual —</SelectItem>
                                  {treatments.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number" min="0" step="any"
                            value={item.price}
                            onChange={e => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="px-1 py-1 text-right font-medium pr-2">
                          {fmt(item.total)}
                        </td>
                        <td className="px-1 py-1">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={4} className="py-2 px-2 text-right text-sm font-medium">Subtotal</td>
                      <td className="py-2 px-2 text-right font-medium">{fmt(subtotal)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1 px-2 text-right text-sm text-muted-foreground">IVA (16%)</td>
                      <td className="py-1 px-2 text-right text-sm text-muted-foreground">{fmt(taxAmount)}</td>
                      <td></td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={4} className="py-2 px-2 text-right font-bold">TOTAL</td>
                      <td className="py-2 px-2 text-right font-bold text-primary text-base">{fmt(total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, emptyItem()])}
                className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" /> Agregar ítem
              </Button>

              {/* Observaciones */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="notas">Observaciones</Label>
                <Textarea
                  id="notas"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Condiciones del presupuesto, aclaraciones, etc."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" asChild>
              <Link href="/presupuestos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear Presupuesto"}
            </Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}
