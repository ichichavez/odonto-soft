"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Baby, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { patientService } from "@/services/patients"
import { isValidUUID } from "@/lib/utils"
import { DentalGallery } from "@/components/dental-gallery"

type PatientType = "adulto" | "nino"

export default function EditarPacientePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [patientData, setPatientData] = useState({
    first_name: "",
    last_name: "",
    identity_number: "",
    email: "",
    phone: "",
    secondary_phone: "",
    birth_date: "",
    gender: "",
    address: "",
    patient_type: "adulto" as PatientType,
    // Adulto
    marital_status: "",
    profession: "",
    work_address: "",
    work_phone: "",
    // Niño
    guardian_name: "",
    guardian_identity_number: "",
    guardian_relationship: "",
    guardian_phone: "",
    guardian_secondary_phone: "",
  })

  const [medicalData, setMedicalData] = useState({
    allergies: "",
    medications: "",
    chronic_diseases: "",
  })

  const patientType = patientData.patient_type

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true)
        const patient = await patientService.getById(params.id)

        setPatientData({
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          identity_number: patient.identity_number || "",
          email: patient.email || "",
          phone: patient.phone || "",
          secondary_phone: patient.secondary_phone || "",
          birth_date: patient.birth_date || "",
          gender: patient.gender || "",
          address: patient.address || "",
          patient_type: (patient.patient_type as PatientType) || "adulto",
          marital_status: patient.marital_status || "",
          profession: patient.profession || "",
          work_address: patient.work_address || "",
          work_phone: patient.work_phone || "",
          guardian_name: patient.guardian_name || "",
          guardian_identity_number: patient.guardian_identity_number || "",
          guardian_relationship: patient.guardian_relationship || "",
          guardian_phone: patient.guardian_phone || "",
          guardian_secondary_phone: patient.guardian_secondary_phone || "",
        })

        if (patient.medical_records && patient.medical_records.length > 0) {
          const medical = patient.medical_records[0]
          setMedicalData({
            allergies: medical.allergies || "",
            medications: medical.medications || "",
            chronic_diseases: medical.chronic_diseases || "",
          })
        }
      } catch (error) {
        console.error("Error al cargar paciente:", error)
        toast({ title: "Error", description: "No se pudo cargar la información del paciente", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [params.id, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setPatientData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelect = (field: string, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTypeChange = (type: PatientType) => {
    setPatientData((prev) => ({ ...prev, patient_type: type }))
  }

  const handleMedicalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const key = e.target.id.replace("med-", "") as keyof typeof medicalData
    setMedicalData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await patientService.update(params.id, patientData)
      await patientService.updateMedicalRecord(params.id, medicalData)
      toast({ title: "Paciente actualizado", description: "La información ha sido actualizada exitosamente." })
      router.push(`/pacientes/${params.id}`)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo actualizar la información. Inténtelo de nuevo.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar Paciente</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="informacion">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacion">Información Personal</TabsTrigger>
            <TabsTrigger value="medico">Antecedentes Médicos</TabsTrigger>
            <TabsTrigger value="galeria">Galería</TabsTrigger>
          </TabsList>

          <TabsContent value="informacion">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Edite los datos del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Toggle adulto / niño */}
                <div className="space-y-2">
                  <Label>Tipo de paciente</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={patientType === "adulto" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => handleTypeChange("adulto")}
                    >
                      <User className="h-4 w-4" />
                      Adulto
                    </Button>
                    <Button
                      type="button"
                      variant={patientType === "nino" ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() => handleTypeChange("nino")}
                    >
                      <Baby className="h-4 w-4" />
                      Niño / Niña
                    </Button>
                  </div>
                </div>

                {/* Datos básicos — comunes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre *</Label>
                    <Input id="first_name" placeholder="Nombre" required value={patientData.first_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellidos *</Label>
                    <Input id="last_name" placeholder="Apellidos" required value={patientData.last_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="identity_number">C.I.</Label>
                    <Input id="identity_number" placeholder="1.234.567" value={patientData.identity_number} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                    <Input id="birth_date" type="date" value={patientData.birth_date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select value={patientData.gender} onValueChange={(v) => handleSelect("gender", v)}>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección de Domicilio</Label>
                  <Input id="address" placeholder="Dirección completa" value={patientData.address} onChange={handleChange} />
                </div>

                {/* ── Campos para ADULTO ── */}
                {patientType === "adulto" && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del paciente adulto</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" placeholder="Teléfono fijo" value={patientData.phone} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_phone">Celular</Label>
                        <Input id="secondary_phone" placeholder="Teléfono celular" value={patientData.secondary_phone} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" placeholder="correo@ejemplo.com" value={patientData.email} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Estado Civil</Label>
                        <Select value={patientData.marital_status} onValueChange={(v) => handleSelect("marital_status", v)}>
                          <SelectTrigger id="marital_status">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soltero">Soltero/a</SelectItem>
                            <SelectItem value="casado">Casado/a</SelectItem>
                            <SelectItem value="divorciado">Divorciado/a</SelectItem>
                            <SelectItem value="viudo">Viudo/a</SelectItem>
                            <SelectItem value="union_libre">Unión libre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profession">Profesión / Ocupación</Label>
                        <Input id="profession" placeholder="Profesión u ocupación" value={patientData.profession} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="work_phone">Teléfono Laboral</Label>
                        <Input id="work_phone" placeholder="Teléfono del trabajo" value={patientData.work_phone} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="work_address">Dirección Laboral</Label>
                      <Input id="work_address" placeholder="Dirección del lugar de trabajo" value={patientData.work_address} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {/* ── Campos para NIÑO ── */}
                {patientType === "nino" && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del encargado / tutor</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guardian_name">Nombre del Encargado</Label>
                        <Input id="guardian_name" placeholder="Nombre completo" value={patientData.guardian_name} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_identity_number">C.I. del Encargado</Label>
                        <Input id="guardian_identity_number" placeholder="C.I." value={patientData.guardian_identity_number} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guardian_relationship">Relación con el paciente</Label>
                        <Select value={patientData.guardian_relationship} onValueChange={(v) => handleSelect("guardian_relationship", v)}>
                          <SelectTrigger id="guardian_relationship">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="madre">Madre</SelectItem>
                            <SelectItem value="padre">Padre</SelectItem>
                            <SelectItem value="abuelo_a">Abuelo/a</SelectItem>
                            <SelectItem value="tutor_legal">Tutor Legal</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_phone">Teléfono del Encargado</Label>
                        <Input id="guardian_phone" placeholder="Teléfono" value={patientData.guardian_phone} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_secondary_phone">Celular del Encargado</Label>
                        <Input id="guardian_secondary_phone" placeholder="Celular" value={patientData.guardian_secondary_phone} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo del Encargado</Label>
                        <Input id="email" type="email" placeholder="correo@ejemplo.com" value={patientData.email} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono del Paciente (si aplica)</Label>
                        <Input id="phone" placeholder="Teléfono del paciente" value={patientData.phone} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medico">
            <Card>
              <CardHeader>
                <CardTitle>Antecedentes Médicos</CardTitle>
                <CardDescription>Información médica relevante del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="med-allergies">Alergias</Label>
                  <Textarea
                    id="med-allergies"
                    placeholder="Alergias conocidas (medicamentos, materiales, alimentos, etc.)"
                    value={medicalData.allergies}
                    onChange={handleMedicalChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-medications">Medicamentos Actuales</Label>
                  <Textarea
                    id="med-medications"
                    placeholder="Medicamentos que toma actualmente"
                    value={medicalData.medications}
                    onChange={handleMedicalChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-chronic_diseases">Enfermedades / Condiciones Médicas</Label>
                  <Textarea
                    id="med-chronic_diseases"
                    placeholder="Enfermedades crónicas o condiciones relevantes"
                    value={medicalData.chronic_diseases}
                    onChange={handleMedicalChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galeria">
            {isValidUUID(params.id) && <DentalGallery patientId={params.id} />}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" type="button" onClick={() => router.push(`/pacientes/${params.id}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
