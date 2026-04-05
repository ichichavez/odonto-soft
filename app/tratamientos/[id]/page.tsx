"use client"

import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Clock, Pencil } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { treatmentService } from "@/services/treatments"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function TratamientoDetallePage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const [treatment, setTreatment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    appointmentsCount: 0,
    budgetsCount: 0,
  })

  useEffect(() => {
    const fetchTreatment = async () => {
      try {
        setLoading(true)
        const data = await treatmentService.getById(params.id)
        setTreatment(data)

        // En un sistema real, aquí obtendríamos estadísticas del tratamiento
        // Por ahora, usamos datos simulados
        setStats({
          appointmentsCount: Math.floor(Math.random() * 20),
          budgetsCount: Math.floor(Math.random() * 15),
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

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!treatment) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Tratamiento no encontrado</h2>
          <p className="text-muted-foreground mt-2">El tratamiento que busca no existe o ha sido eliminado.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/tratamientos">Volver a Tratamientos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista", "asistente"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tratamientos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{treatment.name}</h1>
          <div className="ml-auto">
            <RoleGuard allowedRoles={["admin"]}>
              <Button asChild>
                <Link href={`/tratamientos/${params.id}/editar`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar Tratamiento
                </Link>
              </Button>
            </RoleGuard>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información del Tratamiento</CardTitle>
              <CardDescription>Detalles y especificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descripción</h3>
                <p className="text-base mt-1">{treatment.description || "Sin descripción"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Precio</h3>
                  <p className="text-xl font-semibold mt-1">${treatment.price?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Duración</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="text-base">{treatment.duration || 30} minutos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Citas Realizadas</h3>
                <p className="text-base">{stats.appointmentsCount}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Presupuestos Incluidos</h3>
                <p className="text-base">{stats.budgetsCount}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Última Actualización</h3>
                <p className="text-base">
                  {treatment.updated_at ? new Date(treatment.updated_at).toLocaleDateString("es-ES") : "No disponible"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
