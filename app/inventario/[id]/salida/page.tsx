"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/role-guard"
import { AlertTriangle, ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { inventoryService } from "@/services/inventory"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SalidaInventarioPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState("")
  const [reference, setReference] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.materials.getById(params.id)
        setMaterial(data)
      } catch (error) {
        console.error("Error al cargar material:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del material",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMaterial()
  }, [params.id, toast])

  useEffect(() => {
    if (material && quantity > material.stock_quantity) {
      setError(
        `La cantidad a retirar no puede ser mayor que el stock actual (${material.stock_quantity} ${material.unit})`,
      )
    } else {
      setError(null)
    }
  }, [quantity, material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!material || !user) return

    if (quantity > material.stock_quantity) {
      setError(
        `La cantidad a retirar no puede ser mayor que el stock actual (${material.stock_quantity} ${material.unit})`,
      )
      return
    }

    setIsSubmitting(true)

    try {
      await inventoryService.movements.create({
        material_id: material.id,
        user_id: user.id,
        movement_type: "salida",
        quantity: quantity,
        notes: notes,
        reference: reference,
      })

      toast({
        title: "Salida registrada",
        description: `Se ha registrado la salida de ${quantity} ${material.unit} de ${material.name}`,
      })

      router.push(`/inventario/${params.id}`)
    } catch (error) {
      console.error("Error al registrar salida:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la salida",
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
          <CardContent>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Material no encontrado</h2>
          <p className="text-muted-foreground mt-2">El material que busca no existe o ha sido eliminado.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/inventario">Volver a Inventario</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "asistente"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/inventario/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Registrar Salida de Material</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Salida de Inventario</CardTitle>
              <CardDescription>
                Registrar salida de {material.name} ({material.unit})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{material.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Stock actual: {material.stock_quantity} {material.unit}
                  </p>
                </div>
              </div>

              {material.stock_quantity <= 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sin stock disponible</AlertTitle>
                  <AlertDescription>
                    No hay stock disponible para este material. Por favor, registre una entrada antes de realizar una
                    salida.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad a retirar ({material.unit})</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  max={material.stock_quantity}
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseFloat(e.target.value))}
                  required
                  disabled={material.stock_quantity <= 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Referencia (opcional)</Label>
                <Input
                  id="reference"
                  placeholder="Tratamiento, paciente, etc."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={material.stock_quantity <= 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional sobre esta salida"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={material.stock_quantity <= 0}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href={`/inventario/${params.id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || material.stock_quantity <= 0 || !!error}>
                {isSubmitting ? "Registrando..." : "Registrar Salida"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RoleGuard>
  )
}
