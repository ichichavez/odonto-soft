"use client"

import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Calendar, Clock, Pencil, User } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function CitaDetallePage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        const data = await appointmentService.getById(params.id)
        setAppointment(data)
      } catch (error) {
        console.error("Error al cargar cita:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la cita",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [params.id, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return <Badge className="bg-green-500">Confirmada</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "cancelada":
        return <Badge className="bg-red-500">Cancelada</Badge>
      case "completada":
        return <Badge className="bg-blue-500">Completada</Badge>
      default:
        return <Badge className="bg-gray-500">Desconocido</Badge>
    }
  }

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

  if (!appointment) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Cita no encontrada</h2>
          <p className="text-muted-foreground mt-2">La cita que busca no existe o ha sido eliminada.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/citas">Volver a Citas</Link>
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
            <Link href="/citas">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalles de la Cita</h1>
          <div className="ml-auto">
            <RoleGuard allowedRoles={["admin", "dentista"]}>
              <Button asChild>
                <Link href={`/citas/${params.id}/editar`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar Cita
                </Link>
              </Button>
            </RoleGuard>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información de la Cita</CardTitle>
              <CardDescription>Detalles y especificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                  <p className="text-base font-medium">
                    {formatDate(appointment.date)} - {formatTime(appointment.time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duración</p>
                  <p className="text-base font-medium">{appointment.duration || 30} minutos</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="text-base font-medium">
                    {appointment.patients?.first_name} {appointment.patients?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.patients?.email || "Email no disponible"} •{" "}
                    {appointment.patients?.phone || "Teléfono no disponible"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dentista</p>
                  <p className="text-base font-medium">{appointment.users?.name || "No asignado"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tratamiento</h3>
                <p className="text-base">{appointment.treatments?.name || "Consulta general"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {appointment.treatments?.description || "Sin descripción"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notas</h3>
                <p className="text-base">{appointment.notes || "Sin notas adicionales"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
              <div className="pt-2">{getStatusBadge(appointment.status)}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Creada el</h3>
                <p className="text-base">
                  {appointment.created_at
                    ? new Date(appointment.created_at).toLocaleDateString("es-ES")
                    : "No disponible"}
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Última Actualización</h3>
                <p className="text-base">
                  {appointment.updated_at
                    ? new Date(appointment.updated_at).toLocaleDateString("es-ES")
                    : "No disponible"}
                </p>
              </div>
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <RoleGuard
                    allowedRoles={["admin", "dentista"]}
                    fallback={
                      <Button variant="outline" className="w-full" disabled>
                        Editar
                      </Button>
                    }
                  >
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/citas/${params.id}/editar`}>Editar</Link>
                    </Button>
                  </RoleGuard>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/pacientes/${appointment.patient_id}`}>Ver Paciente</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
