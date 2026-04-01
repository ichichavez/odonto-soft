"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { treatmentService } from "@/services/treatments"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function NuevoTratamientoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "30",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const formatPrice = (value: string) => {
    // Eliminar caracteres no numéricos excepto punto decimal
    const numericValue = value.replace(/[^\d.]/g, "")

    // Asegurar que solo hay un punto decimal
    const parts = numericValue.split(".")
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("")
    }

    return numericValue
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPrice(e.target.value)
    setFormData((prev) => ({ ...prev, price: formattedValue }))
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números enteros para la duración
    const numericValue = e.target.value.replace(/\D/g, "")
    setFormData((prev) => ({ ...prev, duration: numericValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convertir valores a números
      const treatmentData = {
        ...formData,
        price: Number.parseFloat(formData.price) || 0,
        duration: Number.parseInt(formData.duration) || 30,
      }

      const newTreatment = await treatmentService.create(treatmentData)

      toast({
        title: "Tratamiento creado",
        description: "El tratamiento ha sido creado exitosamente",
      })

      router.push(`/tratamientos/${newTreatment.id}`)
    } catch (error) {
      console.error("Error al crear tratamiento:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el tratamiento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tratamientos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Tratamiento</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información del Tratamiento</CardTitle>
              <CardDescription>Ingrese los detalles del nuevo tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Nombre del tratamiento"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del tratamiento"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio ($) *</Label>
                  <Input id="price" placeholder="0.00" value={formData.price} onChange={handlePriceChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    placeholder="30"
                    value={formData.duration}
                    onChange={handleDurationChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href="/tratamientos">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Tratamiento"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RoleGuard>
  )
}
