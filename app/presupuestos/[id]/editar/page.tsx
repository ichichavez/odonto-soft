"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { budgetService } from "@/services/budgets"
import { treatmentService } from "@/services/treatments"
import { patientService } from "@/services/patients"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleGuard } from "@/components/role-guard"

interface BudgetItem {
  id?: string
  treatment_id: string
  description: string
  tooth: string
  quantity: number
  price: number
  total: number
}

export default function EditarPresupuestoPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const { clinic } = useClinic()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [treatments, setTreatments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])

  // Estado del presupuesto
  const [budgetData, setBudgetData] = useState({
    patient_id: "",
    date: "",
    notes: "",
    status: "pendiente",
  })

  const [items, setItems] = useState<BudgetItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar datos del presupuesto
        const budget = await budgetService.getById(params.id)

        setBudgetData({
          patient_id: budget.patient_id,
          date: budget.date.split("T")[0], // Formato YYYY-MM-DD
          notes: budget.notes || "",
          status: budget.status,
        })

        // Convertir los items del presupuesto
        const budgetItems = budget.budget_items.map((item: any) => ({
          id: item.id,
          treatment_id: item.treatment_id,
          description: item.description,
          tooth: item.tooth ?? "",
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }))
        setItems(budgetItems)

        // Cargar tratamientos y pacientes
        const [treatmentsData, patientsData] = await Promise.all([treatmentService.getAll(), patientService.getAll()])

        setTreatments(treatmentsData)
        setPatients(patientsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del presupuesto",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, toast])

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      treatment_id: "",
      description: "",
      tooth: "",
      quantity: 1,
      price: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
    setItems(
      items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }

          // Si se selecciona un tratamiento, actualizar descripción y precio
          if (field === "treatment_id" && value) {
            const treatment = treatments.find((t) => t.id === value)
            if (treatment) {
              updatedItem.description = treatment.name
              updatedItem.price = treatment.price
            }
          }

          // Recalcular el total si cambia el precio o la cantidad
          if (field === "price" || field === "quantity") {
            updatedItem.total = updatedItem.price * updatedItem.quantity
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calcularImpuestos = (subtotal: number) => {
    const rate = clinic?.tax_rate ?? 10
    return subtotal * (rate / 100)
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    const impuestos = calcularImpuestos(subtotal)
    return subtotal + impuestos
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un tratamiento",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const subtotal = calcularSubtotal()
      const taxAmount = calcularImpuestos(subtotal)
      const total = subtotal + taxAmount

      const budgetUpdate = {
        patient_id: budgetData.patient_id,
        date: budgetData.date,
        notes: budgetData.notes,
        status: budgetData.status as any,
        subtotal,
        tax_rate: clinic?.tax_rate ?? 10,
        tax_amount: taxAmount,
        total,
        updated_at: new Date().toISOString(),
      }

      const budgetItems = items.map((item) => ({
        treatment_id: item.treatment_id || null,
        description: item.description,
        tooth: item.tooth || null,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }))

      await budgetService.update(params.id, budgetUpdate, budgetItems)

      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado exitosamente.",
      })

      router.push(`/presupuestos/${params.id}`)
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/presupuestos/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Presupuesto</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Presupuesto</CardTitle>
                <CardDescription>Datos básicos del presupuesto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente">Paciente</Label>
                    <Select
                      value={budgetData.patient_id}
                      onValueChange={(value) => setBudgetData({ ...budgetData, patient_id: value })}
                      required
                    >
                      <SelectTrigger id="paciente">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={budgetData.date}
                      onChange={(e) => setBudgetData({ ...budgetData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={budgetData.status}
                    onValueChange={(value) => setBudgetData({ ...budgetData, status: value })}
                  >
                    <SelectTrigger id="estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aceptado">Aceptado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de Tratamientos</CardTitle>
                <CardDescription>
                  Seleccione del catálogo para autocompletar descripción y precio, o escriba directamente.
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
                      {items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-1 py-1">
                            <Input
                              value={item.tooth}
                              onChange={(e) => handleItemChange(index, "tooth", e.target.value)}
                              placeholder="Ej. 36"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex gap-1">
                              <Input
                                value={item.description}
                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                placeholder="Descripción del tratamiento"
                                className="h-8 text-xs flex-1"
                              />
                              {treatments.length > 0 && (
                                <Select
                                  value={item.treatment_id || ""}
                                  onValueChange={(v) => handleItemChange(index, "treatment_id", v)}
                                >
                                  <SelectTrigger className="h-8 w-8 px-1 shrink-0" title="Cargar desde catálogo">
                                    <span className="text-xs">▾</span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">— Manual —</SelectItem>
                                    {treatments.map((t) => (
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
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number" min="0" step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="px-1 py-1 text-right font-medium pr-2">
                            ₲ {item.total.toLocaleString("es-PY")}
                          </td>
                          <td className="px-1 py-1">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={4} className="py-2 px-2 text-right text-sm font-medium">Subtotal</td>
                        <td className="py-2 px-2 text-right font-medium">₲ {calcularSubtotal().toLocaleString("es-PY")}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="py-1 px-2 text-right text-sm text-muted-foreground">IVA (16%)</td>
                        <td className="py-1 px-2 text-right text-sm text-muted-foreground">₲ {calcularImpuestos(calcularSubtotal()).toLocaleString("es-PY")}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={4} className="py-2 px-2 text-right font-bold">TOTAL</td>
                        <td className="py-2 px-2 text-right font-bold text-primary text-base">₲ {calcularTotal().toLocaleString("es-PY")}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}
                  className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Agregar ítem
                </Button>

                {/* Observaciones */}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="notas">Observaciones</Label>
                  <Textarea
                    id="notas"
                    placeholder="Condiciones del presupuesto, aclaraciones, etc."
                    value={budgetData.notes}
                    onChange={(e) => setBudgetData({ ...budgetData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" asChild>
                <Link href={`/presupuestos/${params.id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}
