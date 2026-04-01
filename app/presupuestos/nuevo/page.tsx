"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Minus, Plus } from "lucide-react"
import { useState } from "react"

export default function NuevoPresupuestoPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState([{ id: 1, tratamiento: "Limpieza Dental", precio: 80, cantidad: 1, total: 80 }])

  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
    setItems([...items, { id: newId, tratamiento: "", precio: 0, cantidad: 1, total: 0 }])
  }

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          // Recalcular el total si cambia el precio o la cantidad
          if (field === "precio" || field === "cantidad") {
            updatedItem.total = updatedItem.precio * updatedItem.cantidad
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulación de envío
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado exitosamente.",
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <h1 className="text-2xl font-bold">Crear Nuevo Presupuesto</h1>

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
                  <Select required>
                    <SelectTrigger id="paciente">
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="juan-diaz">Juan Díaz</SelectItem>
                      <SelectItem value="maria-garcia">María García</SelectItem>
                      <SelectItem value="pedro-rodriguez">Pedro Rodríguez</SelectItem>
                      <SelectItem value="laura-martinez">Laura Martínez</SelectItem>
                      <SelectItem value="carlos-sanchez">Carlos Sánchez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input id="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" placeholder="Notas adicionales sobre el presupuesto" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Tratamientos</CardTitle>
              <CardDescription>Agregue los tratamientos incluidos en el presupuesto.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.tratamiento || undefined}
                          onValueChange={(value) => handleItemChange(item.id, "tratamiento", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tratamiento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Limpieza Dental">Limpieza Dental</SelectItem>
                            <SelectItem value="Empaste">Empaste</SelectItem>
                            <SelectItem value="Extracción">Extracción</SelectItem>
                            <SelectItem value="Blanqueamiento">Blanqueamiento</SelectItem>
                            <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                            <SelectItem value="Radiografía">Radiografía</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.precio}
                          onChange={(e) => handleItemChange(item.id, "precio", Number.parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(item.id, "cantidad", Number.parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </TableCell>
                      <TableCell>${item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Tratamiento
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-lg font-semibold">Total: ${calcularTotal().toFixed(2)}</div>
            </CardFooter>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Presupuesto"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
