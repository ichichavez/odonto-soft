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
import { ArrowLeft, Minus, Plus, Save, PackagePlus } from "lucide-react"
import { purchaseService, type NewPurchaseItem } from "@/services/purchases"
import { inventoryService } from "@/services/inventory"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { useBranch } from "@/context/branch-context"

interface FormItem extends NewPurchaseItem { _key: number }
let keyCounter = 0
const emptyItem = (): FormItem => ({
  _key: ++keyCounter,
  material_id: null,
  description: "",
  quantity: 1,
  unit_cost: 0,
  total: 0,
})

function fmt(n: number) { return `₲ ${n.toLocaleString("es-PY")}` }

export default function NuevaCompraPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const [saving, setSaving] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    notes: "",
  })
  const [items, setItems] = useState<FormItem[]>([emptyItem()])

  useEffect(() => {
    inventoryService.materials.getAll()
      .then(setMaterials)
      .catch(() => {})
  }, [])

  const updateItem = (key: number, field: keyof FormItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item._key !== key) return item
      const updated = { ...item, [field]: value }

      // Auto-fill description y cost desde material
      if (field === "material_id" && value) {
        const mat = materials.find(m => m.id === value)
        if (mat) {
          updated.description = mat.name
          updated.unit_cost = mat.cost_price ?? 0
        }
      }

      // Recalcular total
      if (field === "quantity" || field === "unit_cost") {
        const qty  = field === "quantity"  ? Number(value) : updated.quantity
        const cost = field === "unit_cost" ? Number(value) : updated.unit_cost
        updated.total = qty * cost
      }

      return updated
    }))
  }

  const grandTotal = items.reduce((s, i) => s + i.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (items.some(i => !i.description.trim())) {
      toast({ title: "Error", description: "Complete la descripción de todos los ítems", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const purchase = await purchaseService.create(
        {
          clinic_id: clinic?.id ?? null,
          created_by: user.id,
          date: form.date,
          supplier: form.supplier.trim() || null,
          notes: form.notes.trim() || null,
          total: grandTotal,
        },
        items.map(({ _key, ...rest }) => rest),
        user.id,
        activeBranch?.id
      )
      toast({ title: "Compra registrada", description: "El stock de los materiales fue actualizado." })
      router.push(`/compras/${purchase.id}`)
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la compra.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/compras"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nueva Compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabecera */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la compra</CardTitle>
            <CardDescription>Proveedor, fecha y notas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Proveedor</Label>
              <Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}
                placeholder="Nombre del proveedor (opcional)" />
            </div>
          </CardContent>
        </Card>

        {/* Ítems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5"/>Materiales comprados</CardTitle>
            <CardDescription>
              Selecciona un material del inventario para auto-rellenar, o escribe manualmente.
              Al guardar, se actualiza el stock automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="text-left py-2 px-1">Descripción / Material</th>
                    <th className="text-right py-2 px-1 w-24">Cantidad</th>
                    <th className="text-right py-2 px-1 w-28">Costo unit.</th>
                    <th className="text-right py-2 px-1 w-28">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._key} className="border-b">
                      <td className="px-1 py-1">
                        <div className="flex gap-1">
                          <Input
                            value={item.description}
                            onChange={e => updateItem(item._key, "description", e.target.value)}
                            placeholder="Descripción del material"
                            className="h-8 text-xs flex-1"
                          />
                          {materials.length > 0 && (
                            <Select
                              value={item.material_id || ""}
                              onValueChange={v => updateItem(item._key, "material_id", v || null)}
                            >
                              <SelectTrigger className="h-8 w-8 px-1 shrink-0" title="Seleccionar del inventario">
                                <span className="text-xs">▾</span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">— Manual —</SelectItem>
                                {materials.map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.unit}) — Stock: {m.stock_quantity}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          type="number" min="0.001" step="any"
                          value={item.quantity}
                          onChange={e => updateItem(item._key, "quantity", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          type="number" min="0" step="any"
                          value={item.unit_cost}
                          onChange={e => updateItem(item._key, "unit_cost", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-1 py-1 text-right font-medium pr-2">
                        {fmt(item.total)}
                      </td>
                      <td className="px-1 py-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setItems(prev => prev.length > 1 ? prev.filter(i => i._key !== item._key) : prev)}>
                          <Minus className="h-3.5 w-3.5"/>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={3} className="py-2 px-2 text-right font-bold">TOTAL</td>
                    <td className="py-2 px-2 text-right font-bold text-primary text-base">{fmt(grandTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <Button type="button" variant="outline" size="sm"
              onClick={() => setItems(prev => [...prev, emptyItem()])}
              className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5"/> Agregar ítem
            </Button>

            <div className="space-y-2 pt-2">
              <Label>Notas</Label>
              <Textarea rows={2} value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Número de factura del proveedor, observaciones..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/compras">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4"/>
            {saving ? "Guardando y actualizando stock..." : "Registrar Compra"}
          </Button>
        </div>
      </form>
    </div>
  )
}
