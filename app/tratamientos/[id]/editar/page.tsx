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
import { useState, useEffect } from "react"
import { treatmentService } from "@/services/treatments"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditarTratamientoPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  })

  useEffect(() => {
    const fetchTreatment = async () => {
      try {
        setLoading(true)
        const data = await treatmentService.getById(params.id)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: data.price ? data.price.toString() : "",
          duration: data.duration ? data.duration.toString() : "",
        })
      } catch (error) {
        console.error("Error al cargar tratamiento:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del tratamiento",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTreatment()
  }, [params.id, toast])

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

      await treatmentService.update(params.id, treatmentData)

      toast({
        title: "Tratamiento actualizado",
        description: "El tratamiento ha sido actualizado exitosamente",
      })

      router.push(`/tratamientos/${params.id}`)
    } catch (error) {
      console.error("Error al actualizar tratamiento:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el tratamiento",
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/tratamientos/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Tratamiento</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información del Tratamiento</CardTitle>
              <CardDescription>Actualice los detalles del tratamiento</CardDescription>
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
                <Link href={`/tratamientos/${params.id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RoleGuard>
  )
}
