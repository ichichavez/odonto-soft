"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Baby, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { patientService } from "@/services/patients"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { useBranch } from "@/context/branch-context"
import {
  DentalRecordFormTabs,
  type DentalRecordFormHandle,
} from "@/components/dental-record/dental-record-form-tabs"
import { PhoneInput } from "@/components/phone-input"

type PatientType = "adulto" | "nino"

const emptyPatient = {
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
  marital_status: "",
  profession: "",
  work_address: "",
  work_phone: "",
  guardian_name: "",
  guardian_identity_number: "",
  guardian_relationship: "",
  guardian_phone: "",
  guardian_secondary_phone: "",
}

export default function NuevoPacientePage() {
  const { toast }       = useToast()
  const router          = useRouter()
  const { clinic }      = useClinic()
  const { user }        = useAuth()
  const { activeBranch } = useBranch()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientData,  setPatientData]  = useState(emptyPatient)

  // Ref al formulario de ficha odontológica
  const dentalFormRef = useRef<DentalRecordFormHandle>(null)

  const patientType = patientData.patient_type

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPatientData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelect = (field: string, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTypeChange = (type: PatientType) => {
    setPatientData((prev) => ({ ...prev, patient_type: type }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientData.first_name || !patientData.last_name) {
      toast({ title: "Error", description: "El nombre y apellido son requeridos.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    // Pre-check plan limit for patients
    try {
      const token = (await import("@/lib/supabase").then(m => m.createBrowserClient()).then(sb => sb.auth.getSession())).data.session?.access_token
      if (token) {
        const usageRes = await fetch("/api/plan/usage", { headers: { Authorization: `Bearer ${token}` } })
        if (usageRes.ok) {
          const { usage, limits } = await usageRes.json()
          if (limits.patients !== null && usage.patients >= limits.patients) {
            toast({
              title: "Límite alcanzado",
              description: `Tu plan permite hasta ${limits.patients} pacientes. Actualiza tu plan para continuar.`,
              variant: "destructive",
            })
            setIsSubmitting(false)
            return
          }
        }
      }
    } catch {
      // Non-blocking
    }

    try {
      const sanitized = Object.fromEntries(
        Object.entries(patientData).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v])
      ) as typeof patientData

      // Build dental record from the ficha form
      const fd = dentalFormRef.current?.getData()
      const dentalRecord = fd ? {
        patient_type:     fd.patientType,
        consultation_date: fd.consultationDate,
        reason_of_visit:  fd.reasonOfVisit,
        reason_other:     fd.reasonOther   || null,
        referred_by:      fd.referredBy    || null,
        profession:       fd.patientType === "adulto" ? fd.profession   || null : null,
        civil_status:     fd.patientType === "adulto" ? fd.civilStatus  || null : null,
        work_address:     fd.patientType === "adulto" ? fd.workAddress  || null : null,
        weight:           fd.patientType === "nino" && fd.weight  ? parseFloat(fd.weight)  : null,
        height:           fd.patientType === "nino" && fd.height ? parseFloat(fd.height) : null,
        guardian_name:    fd.patientType === "nino" ? fd.guardianName  || null : null,
        guardian_phone:   fd.patientType === "nino" ? fd.guardianPhone || null : null,
        feeding_history:  fd.patientType === "nino" ? fd.feedingHistory : null,
        diet_record:      fd.patientType === "nino" ? fd.dietRecord : null,
        extra_oral_exam:  fd.extraOral,
        intra_oral_exam:  fd.intraOral,
        habits:           fd.habits,
        medical_history:  fd.medicalHistory,
        dental_history:   fd.patientType === "adulto" ? fd.dentalHistory : null,
        treatments_done:  fd.treatmentsDone,
      } : {}

      const newPatient = await patientService.create(
        { ...sanitized, clinic_id: clinic?.id ?? null },
        {},
        dentalRecord as any,
        activeBranch?.id
      )
      toast({ title: "Paciente registrado", description: "Podés subir fotos en la pestaña Galería." })
      router.push(`/pacientes/${newPatient.id}?nuevo=1`)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo registrar el paciente. Inténtelo de nuevo.", variant: "destructive" })
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

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="informacion">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacion">Información Personal</TabsTrigger>
            <TabsTrigger value="ficha">Antecedentes / Ficha Odontológica</TabsTrigger>
          </TabsList>

          {/* ── Información Personal ── */}
          <TabsContent value="informacion">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Ingrese los datos del paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tipo de paciente */}
                <div className="space-y-2">
                  <Label>Tipo de paciente</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={patientType === "adulto" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => handleTypeChange("adulto")}>
                      <User className="h-4 w-4" />Adulto
                    </Button>
                    <Button type="button" variant={patientType === "nino" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => handleTypeChange("nino")}>
                      <Baby className="h-4 w-4" />Niño / Niña
                    </Button>
                  </div>
                </div>

                {/* Datos básicos */}
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
                      <SelectTrigger id="gender"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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

                {/* Adulto */}
                {patientType === "adulto" && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del paciente adulto</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <PhoneInput
                          id="phone"
                          value={patientData.phone}
                          onChange={(v) => handleSelect("phone", v)}
                          placeholder="Teléfono fijo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Celular</Label>
                        <PhoneInput
                          id="secondary_phone"
                          value={patientData.secondary_phone}
                          onChange={(v) => handleSelect("secondary_phone", v)}
                          placeholder="Teléfono celular"
                        />
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
                          <SelectTrigger id="marital_status"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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

                {/* Niño */}
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
                          <SelectTrigger id="guardian_relationship"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                        <Label>Teléfono del Encargado</Label>
                        <PhoneInput
                          id="guardian_phone"
                          value={patientData.guardian_phone}
                          onChange={(v) => handleSelect("guardian_phone", v)}
                          placeholder="Teléfono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Celular del Encargado</Label>
                        <PhoneInput
                          id="guardian_secondary_phone"
                          value={patientData.guardian_secondary_phone}
                          onChange={(v) => handleSelect("guardian_secondary_phone", v)}
                          placeholder="Celular"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo del Encargado</Label>
                        <Input id="email" type="email" placeholder="correo@ejemplo.com" value={patientData.email} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono del Paciente (si aplica)</Label>
                        <PhoneInput
                          id="phone"
                          value={patientData.phone}
                          onChange={(v) => handleSelect("phone", v)}
                          placeholder="Teléfono del paciente"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Antecedentes / Ficha Odontológica ── */}
          <TabsContent value="ficha" className="mt-2">
            <DentalRecordFormTabs ref={dentalFormRef} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" type="button" onClick={() => router.push("/pacientes")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
