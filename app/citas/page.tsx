"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { userService } from "@/services/users"

export default function CitasPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dentists, setDentists] = useState<any[]>([])
  const [selectedDentist, setSelectedDentist] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const { toast } = useToast()

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const data = await userService.getDentists()
        setDentists(data)
      } catch (error) {
        console.error("Error al cargar dentistas:", error)
      }
    }

    fetchDentists()
  }, [])

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!date) return

      try {
        setLoading(true)
        const formattedDate = date.toISOString().split("T")[0]
        const data = await appointmentService.getByDate(formattedDate)

        // Aplicar filtros
        let filteredData = data

        // Filtrar por dentista
        if (selectedDentist !== "todos") {
          filteredData = filteredData.filter((appointment) => appointment.dentist_id === selectedDentist)
        }

        // Filtrar por estado
        if (statusFilter !== "todos") {
          filteredData = filteredData.filter((appointment) => appointment.status === statusFilter)
        }

        setAppointments(filteredData)
      } catch (error) {
        console.error("Error al cargar citas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las citas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [date, selectedDentist, statusFilter, toast])

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmada":
        return "border-l-4 border-l-green-500"
      case "pendiente":
        return "border-l-4 border-l-yellow-500"
      case "cancelada":
        return "border-l-4 border-l-red-500"
      case "completada":
        return "border-l-4 border-l-blue-500"
      default:
        return "border-l-4 border-l-gray-500"
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda de Citas</h1>
        <Link href="/citas/nueva">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dentista</label>
                  <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dentista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.id} value={dentist.id}>
                          {dentist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Calendar mode="single" selected={date} onSelect={setDate} className="border rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Citas para el {formatDate(date)}</h2>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="confirmada">Confirmadas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="completada">Completadas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {loading ? (
                  // Esqueletos de carga
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-12" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay citas programadas para esta fecha</div>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-3 border rounded-lg flex items-center justify-between ${getStatusClass(
                        appointment.status,
                      )}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold">{appointment.time.substring(0, 5)}</div>
                        <div>
                          <div className="font-medium">
                            {appointment.patients.first_name} {appointment.patients.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.treatments?.name || "Consulta general"} • {appointment.duration} min
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/citas/${appointment.id}`}>Ver</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/citas/${appointment.id}/editar`}>Editar</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
