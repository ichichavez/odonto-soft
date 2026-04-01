"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { inventoryService } from "@/services/inventory"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function NuevoMaterialPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    sku: "",
    unit: "unidad",
    stock_quantity: 0,
    min_stock_quantity: 5,
    cost_price: 0,
    profit_percentage: 30,
    price: 0,
    location: "",
    expiry_date: "",
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.categories.getAll()
        setCategories(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const numValue = Number.parseFloat(value) || 0

    setFormData((prev) => {
      const newData = { ...prev, [id]: numValue }

      // Actualizar precio de venta automáticamente si cambia el costo o el porcentaje
      if (id === "cost_price" || id === "profit_percentage") {
        newData.price = newData.cost_price * (1 + newData.profit_percentage / 100)
      }

      return newData
    })
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await inventoryService.materials.create(formData)

      toast({
        title: "Material creado",
        description: "El material ha sido creado exitosamente",
      })

      router.push("/inventario")
    } catch (error) {
      console.error("Error al crear material:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el material",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["admin", "asistente"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventario">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Material</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información del Material</CardTitle>
              <CardDescription>Complete la información para registrar un nuevo material</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Nombre del material"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoría</Label>
                  {loading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleSelectChange("category_id", value)}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del material"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Código</Label>
                  <Input id="sku" placeholder="Código del material" value={formData.sku} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad de Medida *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="paquete">Paquete</SelectItem>
                      <SelectItem value="ml">Mililitro (ml)</SelectItem>
                      <SelectItem value="l">Litro (l)</SelectItem>
                      <SelectItem value="g">Gramo (g)</SelectItem>
                      <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                      <SelectItem value="cm">Centímetro (cm)</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Ubicación física en el consultorio"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Inicial</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stock_quantity}
                    onChange={handleNumberChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_quantity">Stock Mínimo</Label>
                  <Input
                    id="min_stock_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_stock_quantity}
                    onChange={handleNumberChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se generará una alerta cuando el stock sea menor o igual a este valor
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Fecha de Caducidad (opcional)</Label>
                  <Input id="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Precio de Costo</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleNumberChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profit_percentage">% de Ganancia</Label>
                  <Input
                    id="profit_percentage"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.profit_percentage}
                    onChange={handleNumberChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio de Venta (calculado)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculado automáticamente: Costo × (1 + % Ganancia/100)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href="/inventario">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name || !formData.unit}>
                {isSubmitting ? "Guardando..." : "Guardar Material"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RoleGuard>
  )
}
