"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { appointmentService } from "@/services/appointments"
import { patientService } from "@/services/patients"
import { treatmentService } from "@/services/treatments"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"

export default function EditarCitaPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [dentists, setDentists] = useState<any[]>([])
  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_id: "",
    dentist_id: "",
    date: "",
    time: "",
    duration: "",
    status: "",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar la cita
        const appointmentData = await appointmentService.getById(params.id)

        // Cargar pacientes
        const patientsData = await patientService.getAll()
        setPatients(patientsData)

        // Cargar tratamientos
        const treatmentsData = await treatmentService.getAll()
        setTreatments(treatmentsData)

        // Simular carga de dentistas (en un sistema real, esto vendría de un servicio)
        // Por ahora, usamos datos de ejemplo
        setDentists([
          { id: user?.id || "1", name: user?.name || "Dr. Actual" },
          { id: "2", name: "Dra. María López" },
          { id: "3", name: "Dr. Carlos Rodríguez" },
        ])

        // Formatear la fecha para el input date
        const formattedDate = appointmentData.date ? appointmentData.date.split("T")[0] : ""

        // Llenar el formulario con los datos de la cita
        setFormData({
          patient_id: appointmentData.patient_id || "",
          treatment_id: appointmentData.treatment_id || "",
          dentist_id: appointmentData.dentist_id || user?.id || "",
          date: formattedDate,
          time: appointmentData.time || "09:00",
          duration: appointmentData.duration ? appointmentData.duration.toString() : "30",
          status: appointmentData.status || "pendiente",
          notes: appointmentData.notes || "",
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, toast, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      // Convertir duración a número
      const appointmentData = {
        ...formData,
        duration: Number.parseInt(formData.duration) || 30,
      }

      await appointmentService.update(params.id, appointmentData)

      toast({
        title: "Cita actualizada",
        description: "La cita ha sido actualizada exitosamente",
      })

      router.push(`/citas/${params.id}`)
    } catch (error) {
      console.error("Error al actualizar cita:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita",
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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/citas/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Cita</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información de la Cita</CardTitle>
              <CardDescription>Actualice los detalles de la cita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Paciente *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => handleSelectChange("patient_id", value)}
                    required
                  >
                    <SelectTrigger id="patient_id">
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
                  <Label htmlFor="treatment_id">Tratamiento *</Label>
                  <Select
                    value={formData.treatment_id}
                    onValueChange={(value) => handleSelectChange("treatment_id", value)}
                    required
                  >
                    <SelectTrigger id="treatment_id">
                      <SelectValue placeholder="Seleccionar tratamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta-general">Consulta general</SelectItem>
                      {treatments.map((treatment) => (
                        <SelectItem key={treatment.id} value={treatment.id}>
                          {treatment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora *</Label>
                  <Input id="time" type="time" value={formData.time} onChange={handleChange} required />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dentist_id">Dentista *</Label>
                  <Select
                    value={formData.dentist_id}
                    onValueChange={(value) => handleSelectChange("dentist_id", value)}
                    required
                  >
                    <SelectTrigger id="dentist_id">
                      <SelectValue placeholder="Seleccionar dentista" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.id} value={dentist.id}>
                          {dentist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                    required
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre la cita"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href={`/citas/${params.id}`}>Cancelar</Link>
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
