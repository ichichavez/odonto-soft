"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { appointmentService } from "@/services/appointments"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"

export function RecentAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      // Verificar si el usuario está autenticado antes de hacer la consulta
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        // Obtener la fecha actual en formato YYYY-MM-DD
        const today = new Date().toISOString().split("T")[0]
        const data = await appointmentService.getByDate(today)

        // Limitar a 5 citas
        setAppointments(data.slice(0, 5))
      } catch (error: any) {
        console.error("Error al cargar citas recientes:", error)
        setError(error.message || "Error al cargar citas recientes")
        setAppointments([]) // Establecer array vacío en caso de error
      } finally {
        setLoading(false)
      }
    }

    fetchRecentAppointments()
  }, [user]) // Añadir user como dependencia

  // Función para obtener las iniciales del nombre
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "text-green-500"
      case "pendiente":
        return "text-yellow-500"
      case "cancelada":
        return "text-red-500"
      case "completada":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Inicia sesión para ver las citas recientes</div>
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>
  }

  if (appointments.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No hay citas programadas para hoy</div>
  }

  return (
    <div className="space-y-8">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
            <AvatarFallback>
              {getInitials(appointment.patients.first_name, appointment.patients.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {appointment.patients.first_name} {appointment.patients.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {appointment.treatments?.name || "Consulta general"} - {appointment.time.substring(0, 5)}
            </p>
          </div>
          <div className={`ml-auto font-medium ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </div>
        </div>
      ))}
    </div>
  )
}
