"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { patientService } from "@/services/patients"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NuevoPacientePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createBrowserClient()

  // Estado para los datos del paciente
  const [patientData, setPatientData] = useState({
    first_name: "",
    last_name: "",
    identity_number: "", // Nuevo campo C.I.
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    marital_status: "",
    address: "",
  })

  // Estado para el historial médico
  const [medicalData, setMedicalData] = useState({
    allergies: "",
    medications: "",
    chronic_diseases: "",
  })

  // Estado para el historial dental
  const [dentalData, setDentalData] = useState({
    last_visit: "",
    previous_treatments: "",
    hygiene_habits: "",
    observations: "",
  })

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setPatientData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMedicalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setMedicalData((prev) => ({ ...prev, [id.replace("medical-", "")]: value }))
  }

  const handleDentalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setDentalData((prev) => ({ ...prev, [id.replace("dental-", "")]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("Creating patient with data:", patientData)

      // Validar campos requeridos
      if (!patientData.first_name || !patientData.last_name) {
        toast({
          title: "Error",
          description: "El nombre y apellido son requeridos.",
          variant: "destructive",
        })
        return
      }

      // Crear el paciente
      const patient = await patientService.create(patientData, medicalData, dentalData)

      console.log("Patient created successfully:", patient)

      toast({
        title: "Paciente registrado",
        description: "El paciente ha sido registrado exitosamente.",
      })

      // Redirigir a la lista de pacientes
      router.push("/pacientes")
    } catch (error) {
      console.error("Error al registrar paciente:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el paciente. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Registrar Nuevo Paciente</h1>
      </div>

      <Tabs defaultValue="informacion">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion">Información Personal</TabsTrigger>
          <TabsTrigger value="medico">Historial Médico</TabsTrigger>
          <TabsTrigger value="dental">Historial Dental</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="informacion">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Ingrese los datos personales del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre *</Label>
                    <Input
                      id="first_name"
                      placeholder="Nombre"
                      required
                      value={patientData.first_name}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellidos *</Label>
                    <Input
                      id="last_name"
                      placeholder="Apellidos"
                      required
                      value={patientData.last_name}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="identity_number">C.I. (Cédula de Identidad)</Label>
                    <Input
                      id="identity_number"
                      placeholder="1.234.567"
                      value={patientData.identity_number}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="Teléfono" value={patientData.phone} onChange={handlePatientChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={patientData.email}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                    <Input id="birth_date" type="date" value={patientData.birth_date} onChange={handlePatientChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select value={patientData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Estado Civil</Label>
                    <Select
                      value={patientData.marital_status}
                      onValueChange={(value) => handleSelectChange("marital_status", value)}
                    >
                      <SelectTrigger id="marital_status">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    placeholder="Dirección completa"
                    value={patientData.address}
                    onChange={handlePatientChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medico">
            <Card>
              <CardHeader>
                <CardTitle>Historial Médico</CardTitle>
                <CardDescription>Información médica relevante del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medical-allergies">Alergias</Label>
                  <Textarea
                    id="medical-allergies"
                    placeholder="Alergias conocidas"
                    value={medicalData.allergies}
                    onChange={handleMedicalChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical-medications">Medicamentos Actuales</Label>
                  <Textarea
                    id="medical-medications"
                    placeholder="Medicamentos que toma actualmente"
                    value={medicalData.medications}
                    onChange={handleMedicalChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical-chronic_diseases">Enfermedades Crónicas</Label>
                  <Textarea
                    id="medical-chronic_diseases"
                    placeholder="Enfermedades crónicas o condiciones médicas"
                    value={medicalData.chronic_diseases}
                    onChange={handleMedicalChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dental">
            <Card>
              <CardHeader>
                <CardTitle>Historial Dental</CardTitle>
                <CardDescription>Información sobre la salud dental del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dental-last_visit">Última Visita al Dentista</Label>
                  <Input
                    id="dental-last_visit"
                    type="date"
                    value={dentalData.last_visit}
                    onChange={handleDentalChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dental-previous_treatments">Tratamientos Previos</Label>
                  <Textarea
                    id="dental-previous_treatments"
                    placeholder="Tratamientos dentales previos"
                    value={dentalData.previous_treatments}
                    onChange={handleDentalChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dental-hygiene_habits">Hábitos de Higiene Dental</Label>
                  <Textarea
                    id="dental-hygiene_habits"
                    placeholder="Frecuencia de cepillado, uso de hilo dental, etc."
                    value={dentalData.hygiene_habits}
                    onChange={handleDentalChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dental-observations">Observaciones</Label>
                  <Textarea
                    id="dental-observations"
                    placeholder="Observaciones adicionales"
                    value={dentalData.observations}
                    onChange={handleDentalChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" type="button" onClick={() => router.push("/pacientes")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Paciente"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
