"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { appointmentService } from "@/services/appointments"
import { patientService } from "@/services/patients"
import { treatmentService } from "@/services/treatments"
import { userService } from "@/services/users"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NuevaCitaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [dentists, setDentists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patient_id: "",
    dentist_id: "",
    treatment_id: "",
    date: new Date().toISOString().split("T")[0], // Fecha actual por defecto
    time: "09:00", // Hora por defecto
    duration: 30, // Valor por defecto
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🔄 Cargando datos iniciales...")

        const [patientsData, treatmentsData, dentistsData] = await Promise.all([
          patientService.getAll(),
          treatmentService.getAll(),
          userService.getDentists(),
        ])

        console.log("📊 Datos cargados:")
        console.log("👥 Pacientes:", patientsData.length)
        console.log("🦷 Tratamientos:", treatmentsData.length)
        console.log("👨‍⚕️ Dentistas:", dentistsData.length)

        setPatients(patientsData)
        setTreatments(treatmentsData)
        setDentists(dentistsData)

        // Si hay dentistas, seleccionar el primero por defecto
        if (dentistsData.length > 0) {
          setFormData((prev) => ({ ...prev, dentist_id: dentistsData[0].id }))
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("No se pudieron cargar los datos necesarios. Por favor, intente de nuevo.")
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
  }, [toast])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTreatmentChange = (treatmentId: string) => {
    setFormData((prev) => ({ ...prev, treatment_id: treatmentId }))

    if (treatmentId) {
      const selectedTreatment = treatments.find((t) => t.id === treatmentId)
      if (selectedTreatment && selectedTreatment.duration_minutes) {
        setFormData((prev) => ({ ...prev, duration: selectedTreatment.duration_minutes }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      console.log("🎯 FORMULARIO: Iniciando envío")
      console.log("📋 FormData:", formData)

      // Validar campos requeridos
      if (!formData.patient_id || !formData.dentist_id || !formData.date || !formData.time) {
        throw new Error("Por favor complete todos los campos requeridos")
      }

      // Incluir TODOS los campos, especialmente duration
      const appointmentData = {
        patient_id: formData.patient_id,
        dentist_id: formData.dentist_id,
        treatment_id: formData.treatment_id || null,
        date: formData.date,
        time: formData.time,
        duration: Number(formData.duration) || 30, // Asegurar que sea un número
        notes: formData.notes || null,
      }

      console.log("📤 Enviando datos completos:", appointmentData)

      const result = await appointmentService.create(appointmentData)

      console.log("✅ Resultado exitoso:", result)

      toast({
        title: "Cita creada",
        description: "La cita ha sido programada exitosamente.",
      })

      router.push("/citas")
    } catch (err) {
      console.log("💥 ERROR EN FORMULARIO")
      console.log("🔍 Error completo:", err)

      let errorMessage = "Error desconocido al crear la cita"

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === "string") {
        errorMessage = err
      }

      console.log("📢 Mensaje final:", errorMessage)
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
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
          <Button variant="outline" size="icon" asChild>
            <Link href="/citas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nueva Cita</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/citas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nueva Cita</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Programar Nueva Cita</CardTitle>
          <CardDescription>Complete los datos para programar una nueva cita.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => handleInputChange("patient_id", value)}
                  required
                >
                  <SelectTrigger>
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
                <Label htmlFor="dentist_id">Dentista *</Label>
                <Select
                  value={formData.dentist_id}
                  onValueChange={(value) => handleInputChange("dentist_id", value)}
                  required
                >
                  <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_id">Tratamiento</Label>
              <Select value={formData.treatment_id} onValueChange={handleTreatmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      {treatment.name} - ${treatment.price}
                      {treatment.duration_minutes && ` (${treatment.duration_minutes} min)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", Number.parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre la cita..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/citas">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Cita"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
