"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import {
  expenseService,
  type ExpenseCategory,
  type PaymentMethod,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/services/expenses"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { useBranch } from "@/context/branch-context"

export default function NuevoGastoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "material_dental" as ExpenseCategory,
    description: "",
    amount: "",
    payment_method: "efectivo" as PaymentMethod,
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) {
      toast({ title: "Error", description: "Ingrese una descripción.", variant: "destructive" })
      return
    }
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Ingrese un monto válido.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await expenseService.create({
        clinic_id: clinic?.id ?? null,
        branch_id: null,
        created_by: user?.id ?? null,
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount,
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
      }, activeBranch?.id)
      toast({ title: "Gasto registrado", description: "El gasto fue guardado exitosamente." })
      router.push("/gastos")
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el gasto.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/gastos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Gasto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del gasto</CardTitle>
            <CardDescription>Registra un egreso de la clínica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Compra de composite 3M A2"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (₲)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="any"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de pago</Label>
                <Select
                  value={form.payment_method}
                  onValueChange={(v) => setForm({ ...form, payment_method: v as PaymentMethod })}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Proveedor, número de factura, observaciones..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/gastos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Gasto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
