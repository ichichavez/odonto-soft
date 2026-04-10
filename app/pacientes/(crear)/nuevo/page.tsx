"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Baby, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { patientService } from "@/services/patients"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { useBranch } from "@/context/branch-context"
import { FormSection } from "@/components/dental-record/form-section"
import { CheckboxGroup } from "@/components/dental-record/checkbox-group"

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
}

export default function NuevoPacientePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientData, setPatientData] = useState(emptyPatient)

  // ── Antecedentes médicos ──
  const [allergyChecks, setAllergyChecks] = useState<Record<string, boolean | string>>({
    penicilina: false, amoxicilina: false, aines: false,
    anestesia_local: false, latex: false, yodo: false,
    otros: false, otros_detail: "",
  })
  const [diseaseChecks, setDiseaseChecks] = useState<Record<string, boolean | string>>({
    diabetes: false, hipertension: false, cardiaca: false, asma: false,
    epilepsia: false, hepatitis: false, vih_sida: false, coagulacion: false,
    anemia: false, hemofilia: false, tuberculosis: false,
    otros: false, otros_detail: "",
  })
  const [medications, setMedications] = useState("")
  const [medObservations, setMedObservations] = useState("")

  const patientType = patientData.patient_type

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientData.first_name || !patientData.last_name) {
      toast({ title: "Error", description: "El nombre y apellido son requeridos.", variant: "destructive" })
      return
    }
    // Serializar checkboxes de antecedentes médicos a texto
    const ALLERGY_LABELS: Record<string, string> = {
      penicilina: "Penicilina", amoxicilina: "Amoxicilina", aines: "AINEs/Ibuprofeno",
      anestesia_local: "Anestesia local", latex: "Látex", yodo: "Yodo",
    }
    const DISEASE_LABELS: Record<string, string> = {
      diabetes: "Diabetes", hipertension: "Hipertensión arterial",
      cardiaca: "Enf. Cardíacas", asma: "Asma", epilepsia: "Epilepsia",
      hepatitis: "Hepatitis", vih_sida: "VIH/SIDA", coagulacion: "Probl. de coagulación",
      anemia: "Anemia", hemofilia: "Hemofilia", tuberculosis: "Tuberculosis",
    }

    const allergiesArr = Object.entries(allergyChecks)
      .filter(([k, v]) => v === true && k !== "otros")
      .map(([k]) => ALLERGY_LABELS[k])
    if (allergyChecks.otros && (allergyChecks.otros_detail as string).trim())
      allergiesArr.push((allergyChecks.otros_detail as string).trim())

    const diseasesArr = Object.entries(diseaseChecks)
      .filter(([k, v]) => v === true && k !== "otros")
      .map(([k]) => DISEASE_LABELS[k])
    if (diseaseChecks.otros && (diseaseChecks.otros_detail as string).trim())
      diseasesArr.push((diseaseChecks.otros_detail as string).trim())

    const medicalSanitized = {
      allergies:        allergiesArr.length ? allergiesArr.join(", ") : null,
      medications:      medications.trim() || null,
      chronic_diseases: [...diseasesArr, medObservations.trim() || null]
        .filter(Boolean).join("; ") || null,
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
      // Non-blocking: proceed if check fails
    }
    try {
      // Convertir strings vacíos a null (evita errores de tipo date, unique constraint, etc.)
      const sanitized = Object.fromEntries(
        Object.entries(patientData).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v])
      ) as typeof patientData

      await patientService.create(
        { ...sanitized, clinic_id: clinic?.id ?? null },
        medicalSanitized,
        {},
        activeBranch?.id
      )
      toast({ title: "Paciente registrado", description: "El paciente ha sido registrado exitosamente." })
      router.push("/pacientes")
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
            <TabsTrigger value="medico">Antecedentes Médicos</TabsTrigger>
          </TabsList>

          <TabsContent value="informacion">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Ingrese los datos del paciente.</CardDescription>
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

          <TabsContent value="medico" className="space-y-4 mt-2">
            <FormSection title="Alergias">
              <CheckboxGroup
                items={[
                  { key: "penicilina",     label: "Penicilina" },
                  { key: "amoxicilina",    label: "Amoxicilina" },
                  { key: "aines",          label: "AINEs / Ibuprofeno" },
                  { key: "anestesia_local",label: "Anestesia local" },
                  { key: "latex",          label: "Látex" },
                  { key: "yodo",           label: "Yodo" },
                  { key: "otros",          label: "Otras", withInput: true, inputPlaceholder: "Especificar..." },
                ]}
                values={allergyChecks}
                onChange={(k, v) => setAllergyChecks(prev => ({ ...prev, [k]: v }))}
                columns={2}
              />
            </FormSection>

            <FormSection title="Enfermedades / Condiciones">
              <CheckboxGroup
                items={[
                  { key: "diabetes",    label: "Diabetes" },
                  { key: "hipertension",label: "Hipertensión arterial" },
                  { key: "cardiaca",    label: "Enf. Cardíacas" },
                  { key: "asma",        label: "Asma" },
                  { key: "epilepsia",   label: "Epilepsia" },
                  { key: "hepatitis",   label: "Hepatitis" },
                  { key: "vih_sida",    label: "VIH / SIDA" },
                  { key: "coagulacion", label: "Probl. de coagulación" },
                  { key: "anemia",      label: "Anemia" },
                  { key: "hemofilia",   label: "Hemofilia" },
                  { key: "tuberculosis",label: "Tuberculosis" },
                  { key: "otros",       label: "Otras", withInput: true, inputPlaceholder: "Especificar..." },
                ]}
                values={diseaseChecks}
                onChange={(k, v) => setDiseaseChecks(prev => ({ ...prev, [k]: v }))}
                columns={2}
              />
            </FormSection>

            <FormSection title="Medicamentos actuales">
              <Textarea
                placeholder="Medicamentos que toma actualmente..."
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                rows={3}
              />
            </FormSection>

            <FormSection title="Observaciones">
              <Textarea
                placeholder="Observaciones adicionales, alergias a alimentos, condiciones relevantes..."
                value={medObservations}
                onChange={(e) => setMedObservations(e.target.value)}
                rows={3}
              />
            </FormSection>
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
