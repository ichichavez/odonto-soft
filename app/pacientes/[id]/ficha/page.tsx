"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { dentalRecordService } from "@/services/dental-records"
import { consentService } from "@/services/consent"
import { patientService } from "@/services/patients"
import { FormSection } from "@/components/dental-record/form-section"
import { CheckboxGroup } from "@/components/dental-record/checkbox-group"
import { RadioGroupField } from "@/components/dental-record/radio-group-field"
import {
  ArrowLeft, Save, Clock, Baby, User2, ClipboardList, Stethoscope,
  AlertCircle, FileSignature, History
} from "lucide-react"
import Link from "next/link"
import type {
  DentalRecord, ExtraOralExam, IntraOralExam, Habits,
  MedicalHistory, DentalHistory, FeedingHistory, DietRecord,
} from "@/types/database"

// ─── Valores por defecto ───────────────────────────────────────────

const defaultExtraOral = (): ExtraOralExam => ({
  atm: { pain_palpation: false, pain_opening: false, pain_closing: false, joint_noise: false, no_issues: true, other: "" },
  head: { scar: false, asymmetry: false, normal_size: true, normal_shape: true, other: "" },
  face: { asymmetric_front: false, convex_profile: false, concave_profile: false, straight_profile: false, no_particularities: true },
  lymph_nodes: { no_particularities: true, enlarged: false, enlarged_detail: "", other: "" },
  lips: { short: false, normal: true, dry_cracked: false, injured_commissures: false, labial_incompetence: false },
})

const defaultIntraOral = (): IntraOralExam => ({
  gums: { localized_gingivitis: false, generalized_gingivitis: false, healthy: true, periodontal_pockets: false, other: "" },
  tongue: { no_anomalies: true, short_frenulum: false, geographic: false, coated: false, other: "" },
  hard_palate: { color: "", normal_size: true, normal_shape: true, color_anomaly: false, ulcers: false, size_anomaly: false, torus: false, burns: false, erythema: false, other: "" },
  soft_palate: { no_particularities: true, burns: false, ulcers: false, petechiae_erythema: false },
  pharynx: { normal: true, grade1: false, grade2: false, grade3: false, grade4: false, surgically_removed: false },
  floor_of_mouth: { no_abnormalities: true, ranula: false, short_frenulum: false, lingual_tori: false },
  occlusion_temporary: { straight_terminal_plane: false, mesial_terminal_plane: false, distal_terminal_plane: false },
  occlusion_mixed_permanent: { class1: false, class2: false, class3: false },
  bite_type: { normal: true, anterior_crossbite: false, posterior_crossbite: false, single_tooth_crossbite: false, anterior_open_bite: false, scissor_bite: false, other: "" },
})

const defaultHabits = (): Habits => ({
  finger_sucking: false, finger_sucking_which: "", nail_biting: false,
  pencil_biting: false, pen_biting: false, lip_interposition: false, no_bad_habits: true,
  mouth_opening: "normal", lip_closure: "normal", lip_closure_other: "",
  breathing: "nasal", swallowing: "normal",
})

const defaultMedicalHistory = (): MedicalHistory => ({
  under_medical_treatment: false, treatment_duration: "", taking_medication: false, medication_detail: "",
  diseases: {
    tuberculosis: false, leprosy: false, cardiac: false, sexual_diseases: false, asthma: false,
    hepatitis: false, hypertension: false, malaria: false, allergy: false, aids: false, chagas: false,
    psychiatric: false, rheumatic_fever: false, seizures: false, epilepsy: false, fainting: false,
    sinusitis: false, coagulation_problems: false, anemia: false, diabetes: false, hemophilia: false,
    ulcers: false, other: false, other_detail: "",
  },
  needs_blood_transfusion: false, transfusion_reason: "", had_surgery: false, surgery_detail: "",
  bleeds_excessively: false, smokes: false, smoking_duration: "", cigarettes_per_day: "",
  drinks_alcohol: false, alcohol_duration: "", pregnant: false, pregnancy_duration: "",
  tolerates_anesthesia: true, never_had_anesthesia: false, elisa_test: false,
  elisa_test_duration: "", consultation_reason: "",
})

const defaultDentalHistory = (): DentalHistory => ({
  last_dentist_visit: "", has_tooth_loss: false, tooth_loss_reason: "",
  brushing_frequency: "", hygiene_brush: true, hygiene_floss: false, hygiene_mouthwash: false, hygiene_other: "",
})

const defaultFeedingHistory = (): FeedingHistory => ({
  breastfeeding_type: "", breastfeeding_duration: "", breastfeeding_duration_other: "",
  solid_food_age: "", breakfast: "", mid_morning: "", lunch: "", snack: "", dinner: "",
})

const defaultDietRecord = (): DietRecord => ({
  preferred_foods: { cakes: false, cookies: false, flan: false, homemade_sweets: false, condensed_milk: false, excess_sugar: false, pasta: false, gum: false, candy: false, chocolate: false, lollipops: false, sodas: false, juice_boxes: false },
  weekly_diet: {
    monday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    tuesday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    wednesday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    thursday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    friday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
  },
})

// ─── Componente principal ──────────────────────────────────────────

export default function FichaOdontologicaPage() {
  const params = useParams()
  const patientId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { clinic } = useClinic()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [history, setHistory] = useState<{ saved_at: string; saved_by_name: string | null }[]>([])
  const [activeTab, setActiveTab] = useState("datos")

  // ── Form state ──
  const [patientType, setPatientType] = useState<"adulto" | "nino">("adulto")
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().slice(0, 10))
  const [reasonOfVisit, setReasonOfVisit] = useState<string[]>([])
  const [reasonOther, setReasonOther] = useState("")
  const [referredBy, setReferredBy] = useState("")

  // Adulto
  const [profession, setProfession] = useState("")
  const [civilStatus, setCivilStatus] = useState("")
  const [workAddress, setWorkAddress] = useState("")

  // Niño
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [guardianName, setGuardianName] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [feedingHistory, setFeedingHistory] = useState<FeedingHistory>(defaultFeedingHistory())
  const [dietRecord, setDietRecord] = useState<DietRecord>(defaultDietRecord())

  // Compartidos
  const [extraOral, setExtraOral] = useState<ExtraOralExam>(defaultExtraOral())
  const [intraOral, setIntraOral] = useState<IntraOralExam>(defaultIntraOral())
  const [habits, setHabits] = useState<Habits>(defaultHabits())
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>(defaultMedicalHistory())
  const [dentalHistory, setDentalHistory] = useState<DentalHistory>(defaultDentalHistory())

  // Consentimiento
  const [signedByName, setSignedByName] = useState("")
  const [signedByCi, setSignedByCi] = useState("")
  const [signingConsent, setSigningConsent] = useState(false)
  const [consentSigned, setConsentSigned] = useState(false)

  // ── Cargar datos ──
  const load = useCallback(async () => {
    try {
      const [patient, record, hist] = await Promise.all([
        patientService.getById(patientId).catch(() => null),
        dentalRecordService.getByPatient(patientId).catch(() => null),
        dentalRecordService.getHistory(patientId).catch(() => []),
      ])

      if (patient) {
        setPatientName(`${patient.first_name} ${patient.last_name}`)
      }

      setHistory(hist)

      if (record) {
        setPatientType(record.patient_type)
        setConsultationDate(record.consultation_date ?? new Date().toISOString().slice(0, 10))
        setReasonOfVisit(record.reason_of_visit ?? [])
        setReasonOther(record.reason_other ?? "")
        setReferredBy(record.referred_by ?? "")
        setProfession(record.profession ?? "")
        setCivilStatus(record.civil_status ?? "")
        setWorkAddress(record.work_address ?? "")
        setWeight(record.weight?.toString() ?? "")
        setHeight(record.height?.toString() ?? "")
        setGuardianName(record.guardian_name ?? "")
        setGuardianPhone(record.guardian_phone ?? "")
        if (record.feeding_history) setFeedingHistory(record.feeding_history as FeedingHistory)
        if (record.diet_record) setDietRecord(record.diet_record as DietRecord)
        if (record.extra_oral_exam) setExtraOral(record.extra_oral_exam as ExtraOralExam)
        if (record.intra_oral_exam) setIntraOral(record.intra_oral_exam as IntraOralExam)
        if (record.habits) setHabits(record.habits as Habits)
        if (record.medical_history) setMedicalHistory(record.medical_history as MedicalHistory)
        if (record.dental_history) setDentalHistory(record.dental_history as DentalHistory)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load() }, [load])

  // ── Guardar ──
  const handleSave = async () => {
    setSaving(true)
    try {
      await dentalRecordService.upsert(
        {
          patient_id: patientId,
          clinic_id: clinic?.id ?? null,
          patient_type: patientType,
          consultation_date: consultationDate,
          reason_of_visit: reasonOfVisit,
          reason_other: reasonOther || null,
          referred_by: referredBy || null,
          profession: patientType === "adulto" ? profession || null : null,
          civil_status: patientType === "adulto" ? civilStatus || null : null,
          work_address: patientType === "adulto" ? workAddress || null : null,
          weight: patientType === "nino" && weight ? parseFloat(weight) : null,
          height: patientType === "nino" && height ? parseFloat(height) : null,
          guardian_name: patientType === "nino" ? guardianName || null : null,
          guardian_phone: patientType === "nino" ? guardianPhone || null : null,
          feeding_history: patientType === "nino" ? feedingHistory : null,
          diet_record: patientType === "nino" ? dietRecord : null,
          extra_oral_exam: extraOral,
          intra_oral_exam: intraOral,
          habits: habits,
          medical_history: medicalHistory,
          dental_history: patientType === "adulto" ? dentalHistory : null,
        },
        user?.name ?? "Sistema",
        user?.id
      )

      const hist = await dentalRecordService.getHistory(patientId)
      setHistory(hist)

      toast({ title: "Ficha guardada", description: "Los cambios fueron guardados correctamente." })
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ── Firmar consentimiento ──
  const handleSignConsent = async () => {
    if (!signedByName.trim()) {
      toast({ title: "Nombre requerido", description: "Ingrese el nombre del firmante.", variant: "destructive" })
      return
    }
    if (!clinic?.consent_template) {
      toast({ title: "Sin template", description: "Configure el texto del consentimiento en Ajustes.", variant: "destructive" })
      return
    }
    setSigningConsent(true)
    try {
      await consentService.sign({
        patient_id: patientId,
        clinic_id: clinic.id,
        consent_text_snapshot: clinic.consent_template,
        signed_by_name: signedByName,
        signed_by_ci: signedByCi || null,
        created_by: user?.id ?? null,
      })
      setConsentSigned(true)
      toast({ title: "Consentimiento registrado", description: `Firmado por ${signedByName}.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSigningConsent(false)
    }
  }

  const toggleReason = (r: string) =>
    setReasonOfVisit((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])

  const patchSection = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: string, val: any) =>
    setter((prev) => ({ ...prev, [key]: val }))

  const patchNested = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, section: string, key: string, val: any) =>
    setter((prev) => ({ ...prev, [section]: { ...(prev as any)[section], [key]: val } }))

  // ── Loading ──
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="container mx-auto max-w-4xl p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={`/pacientes/${patientId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">Ficha Odontológica</h1>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Última modificación: {new Date(history[0].saved_at).toLocaleDateString("es-PY")}
              {history[0].saved_by_name && ` — ${history[0].saved_by_name}`}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar ficha"}
          </Button>
        </div>
      </div>

      {/* Selector tipo paciente */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <span className="text-sm font-medium mr-2">Tipo de paciente:</span>
        <button
          onClick={() => setPatientType("adulto")}
          className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            patientType === "adulto"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-accent"
          }`}
        >
          <User2 className="h-4 w-4" />
          Adulto
        </button>
        <button
          onClick={() => setPatientType("nino")}
          className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            patientType === "nino"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-accent"
          }`}
        >
          <Baby className="h-4 w-4" />
          Niño/a
        </button>
        {patientType === "nino" && (
          <Badge variant="secondary" className="ml-2 text-xs">Campos pediátricos activos</Badge>
        )}
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <details className="rounded-lg border bg-muted/20 p-3 text-sm">
          <summary className="cursor-pointer flex items-center gap-2 font-medium select-none">
            <History className="h-4 w-4 text-muted-foreground" />
            Historial de cambios ({history.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-6">
            {history.map((h, i) => (
              <li key={i} className="text-muted-foreground text-xs">
                {new Date(h.saved_at).toLocaleString("es-PY")}
                {h.saved_by_name && ` — ${h.saved_by_name}`}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Tabs del formulario */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="datos" className="gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" />Datos</TabsTrigger>
          {patientType === "nino" && (
            <TabsTrigger value="alimentacion" className="gap-1.5 text-xs"><Baby className="h-3.5 w-3.5" />Alimentación</TabsTrigger>
          )}
          <TabsTrigger value="extraoral" className="gap-1.5 text-xs"><Stethoscope className="h-3.5 w-3.5" />Extra Oral</TabsTrigger>
          <TabsTrigger value="intraoral" className="gap-1.5 text-xs"><Stethoscope className="h-3.5 w-3.5" />Intra Oral</TabsTrigger>
          <TabsTrigger value="habitos" className="gap-1.5 text-xs">Hábitos</TabsTrigger>
          <TabsTrigger value="medica" className="gap-1.5 text-xs"><AlertCircle className="h-3.5 w-3.5" />Hist. Médica</TabsTrigger>
          {patientType === "adulto" && (
            <TabsTrigger value="odontologica" className="gap-1.5 text-xs">Hist. Dental</TabsTrigger>
          )}
          {patientType === "nino" && (
            <TabsTrigger value="dieta" className="gap-1.5 text-xs">Dieta</TabsTrigger>
          )}
          <TabsTrigger value="consentimiento" className="gap-1.5 text-xs"><FileSignature className="h-3.5 w-3.5" />Consentimiento</TabsTrigger>
        </TabsList>

        {/* ── TAB: DATOS ── */}
        <TabsContent value="datos" className="space-y-4">
          <FormSection title="Datos de la consulta">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de consulta</Label>
                <Input type="date" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Derivado por</Label>
                <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Nombre del profesional" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo de consulta</Label>
              <div className="flex flex-wrap gap-2">
                {["dolor", "caries", "traumatismo", "control", "otro"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleReason(r)}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors capitalize ${
                      reasonOfVisit.includes(r)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {reasonOfVisit.includes("otro") && (
                <Input value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} placeholder="Especificar otro motivo" />
              )}
            </div>
          </FormSection>

          {/* Adulto: datos adicionales */}
          {patientType === "adulto" && (
            <FormSection title="Datos profesionales y civiles">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Profesión</Label>
                  <Input value={profession} onChange={(e) => setProfession(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado civil</Label>
                  <Input value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Dirección laboral</Label>
                  <Input value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} />
                </div>
              </div>
            </FormSection>
          )}

          {/* Niño: datos adicionales */}
          {patientType === "nino" && (
            <FormSection title="Datos pediátricos">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 25.5" />
                </div>
                <div className="space-y-1.5">
                  <Label>Altura (cm)</Label>
                  <Input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ej: 120" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Madre, padre o encargado</Label>
                  <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Teléfono del encargado</Label>
                  <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                </div>
              </div>
            </FormSection>
          )}
        </TabsContent>

        {/* ── TAB: ALIMENTACIÓN (niño) ── */}
        {patientType === "nino" && (
          <TabsContent value="alimentacion" className="space-y-4">
            <FormSection title="Tipo de lactancia">
              <RadioGroupField
                name="breastfeeding_type"
                value={feedingHistory.breastfeeding_type}
                onChange={(v) => patchSection(setFeedingHistory, "breastfeeding_type", v)}
                options={[
                  { value: "maternal", label: "Materna exclusiva (pecho)" },
                  { value: "formula", label: "Fórmula o Artificial" },
                  { value: "mixed", label: "Mixta (pecho y fórmula)" },
                ]}
                columns={3}
              />
            </FormSection>

            <FormSection title="Duración de la lactancia">
              <RadioGroupField
                name="breastfeeding_duration"
                value={feedingHistory.breastfeeding_duration}
                onChange={(v) => patchSection(setFeedingHistory, "breastfeeding_duration", v)}
                options={[
                  { value: "3months", label: "3 meses" },
                  { value: "6months", label: "6 meses" },
                  { value: "1year", label: "1 año" },
                  { value: "1.5years", label: "1 año y medio" },
                  { value: "2years", label: "2 años" },
                  { value: "2.5years", label: "2 años y medio" },
                  { value: "3years", label: "3 años" },
                  { value: "other", label: "Otro" },
                ]}
                columns={4}
              />
              {feedingHistory.breastfeeding_duration === "other" && (
                <Input
                  value={feedingHistory.breastfeeding_duration_other}
                  onChange={(e) => patchSection(setFeedingHistory, "breastfeeding_duration_other", e.target.value)}
                  placeholder="Especificar"
                  className="mt-2 max-w-xs"
                />
              )}
            </FormSection>

            <FormSection title="Alimentación actual">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Edad de inicio de alimentos sólidos</Label>
                  <Input value={feedingHistory.solid_food_age} onChange={(e) => patchSection(setFeedingHistory, "solid_food_age", e.target.value)} placeholder="Ej: 6 meses" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["breakfast", "mid_morning", "lunch", "snack", "dinner"] as const).map((meal) => {
                  const labels: Record<string, string> = { breakfast: "Desayuno", mid_morning: "Media mañana", lunch: "Almuerzo", snack: "Merienda", dinner: "Cena" }
                  return (
                    <div key={meal} className="space-y-1.5">
                      <Label>{labels[meal]}</Label>
                      <Input value={(feedingHistory as any)[meal]} onChange={(e) => patchSection(setFeedingHistory, meal, e.target.value)} />
                    </div>
                  )
                })}
              </div>
            </FormSection>
          </TabsContent>
        )}

        {/* ── TAB: EXAMEN EXTRA ORAL ── */}
        <TabsContent value="extraoral" className="space-y-4">
          <FormSection title="ATM">
            <CheckboxGroup
              items={[
                { key: "pain_palpation", label: "Dolor a la palpación" },
                { key: "pain_opening", label: "Dolor en apertura bucal" },
                { key: "pain_closing", label: "Dolor en cierre bucal" },
                { key: "joint_noise", label: "Ruido articular" },
                { key: "no_issues", label: "Sin molestias" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={extraOral.atm}
              onChange={(k, v) => patchNested(setExtraOral, "atm", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Cabeza">
            <CheckboxGroup
              items={[
                { key: "scar", label: "Tiene cicatriz" },
                { key: "asymmetry", label: "Asimetría" },
                { key: "normal_size", label: "Tamaño normal" },
                { key: "normal_shape", label: "Forma normal" },
                { key: "other", label: "Otro", withInput: true },
              ]}
              values={extraOral.head}
              onChange={(k, v) => patchNested(setExtraOral, "head", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Cara">
            <CheckboxGroup
              items={[
                { key: "asymmetric_front", label: "Asimétrica visto de frente" },
                { key: "convex_profile", label: "Perfil convexo" },
                { key: "concave_profile", label: "Perfil cóncavo" },
                { key: "straight_profile", label: "Perfil recto" },
                { key: "no_particularities", label: "Sin particularidades" },
              ]}
              values={extraOral.face}
              onChange={(k, v) => patchNested(setExtraOral, "face", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Ganglios">
            <CheckboxGroup
              items={[
                { key: "no_particularities", label: "Sin particularidades" },
                { key: "enlarged", label: "Aumento de tamaño", withInput: true, inputPlaceholder: "Especificar ganglios" },
                { key: "other", label: "Otro", withInput: true },
              ]}
              values={{ ...extraOral.lymph_nodes, enlarged_detail: extraOral.lymph_nodes.enlarged_detail }}
              onChange={(k, v) => patchNested(setExtraOral, "lymph_nodes", k, v)}
            />
          </FormSection>

          <FormSection title="Labios">
            <CheckboxGroup
              items={[
                { key: "short", label: "Cortos" },
                { key: "normal", label: "Normales, sin particularidades" },
                { key: "dry_cracked", label: "Secos, agrietados" },
                { key: "injured_commissures", label: "Comisuras lastimadas" },
                { key: "labial_incompetence", label: "Incompetencia labial" },
              ]}
              values={extraOral.lips}
              onChange={(k, v) => patchNested(setExtraOral, "lips", k, v)}
              columns={2}
            />
          </FormSection>
        </TabsContent>

        {/* ── TAB: EXAMEN INTRA ORAL ── */}
        <TabsContent value="intraoral" className="space-y-4">
          <FormSection title="Encía">
            <CheckboxGroup
              items={[
                { key: "localized_gingivitis", label: "Gingivitis localizada" },
                { key: "generalized_gingivitis", label: "Gingivitis generalizada" },
                { key: "healthy", label: "Encía sana" },
                { key: "periodontal_pockets", label: "Bolsas periodontales" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={intraOral.gums}
              onChange={(k, v) => patchNested(setIntraOral, "gums", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Lengua">
            <CheckboxGroup
              items={[
                { key: "no_anomalies", label: "Sin anomalías" },
                { key: "short_frenulum", label: "Frenillo lingual corto" },
                { key: "geographic", label: "Lengua geográfica" },
                { key: "coated", label: "Lengua saburral" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={intraOral.tongue}
              onChange={(k, v) => patchNested(setIntraOral, "tongue", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Paladar duro">
            <CheckboxGroup
              items={[
                { key: "normal_size", label: "Tamaño normal" },
                { key: "normal_shape", label: "Forma normal" },
                { key: "color_anomaly", label: "Anomalía de color" },
                { key: "ulcers", label: "Úlceras" },
                { key: "size_anomaly", label: "Anomalía de tamaño" },
                { key: "torus", label: "Torus palatino" },
                { key: "burns", label: "Quemaduras" },
                { key: "erythema", label: "Eritemas" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={intraOral.hard_palate}
              onChange={(k, v) => patchNested(setIntraOral, "hard_palate", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Paladar blando">
            <CheckboxGroup
              items={[
                { key: "no_particularities", label: "Sin particularidades" },
                { key: "burns", label: "Quemaduras" },
                { key: "ulcers", label: "Úlceras" },
                { key: "petechiae_erythema", label: "Petequias / Eritemas" },
              ]}
              values={intraOral.soft_palate}
              onChange={(k, v) => patchNested(setIntraOral, "soft_palate", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Faringe (Clasificación de Brosky)">
            <CheckboxGroup
              items={[
                { key: "normal", label: "Normales" },
                { key: "grade1", label: "Grado 1" },
                { key: "grade2", label: "Grado 2" },
                { key: "grade3", label: "Grado 3" },
                { key: "grade4", label: "Grado 4" },
                { key: "surgically_removed", label: "Extirpado quirúrgicamente" },
              ]}
              values={intraOral.pharynx}
              onChange={(k, v) => patchNested(setIntraOral, "pharynx", k, v)}
              columns={3}
            />
          </FormSection>

          <FormSection title="Piso de boca">
            <CheckboxGroup
              items={[
                { key: "no_abnormalities", label: "Sin anormalidades" },
                { key: "ranula", label: "Ránula" },
                { key: "short_frenulum", label: "Frenillo lingual corto" },
                { key: "lingual_tori", label: "Torus linguales" },
              ]}
              values={intraOral.floor_of_mouth}
              onChange={(k, v) => patchNested(setIntraOral, "floor_of_mouth", k, v)}
              columns={2}
            />
          </FormSection>

          {patientType === "nino" && (
            <FormSection title="Tipo de oclusión — Dentición temporal">
              <CheckboxGroup
                items={[
                  { key: "straight_terminal_plane", label: "Plano terminal recto" },
                  { key: "mesial_terminal_plane", label: "Plano terminal mesial" },
                  { key: "distal_terminal_plane", label: "Plano terminal distal" },
                ]}
                values={intraOral.occlusion_temporary}
                onChange={(k, v) => patchNested(setIntraOral, "occlusion_temporary", k, v)}
                columns={3}
              />
            </FormSection>
          )}

          <FormSection title="Tipo de oclusión — Mixta o permanente (1ros Molares)">
            <CheckboxGroup
              items={[
                { key: "class1", label: "Clase I" },
                { key: "class2", label: "Clase II" },
                { key: "class3", label: "Clase III" },
              ]}
              values={intraOral.occlusion_mixed_permanent}
              onChange={(k, v) => patchNested(setIntraOral, "occlusion_mixed_permanent", k, v)}
              columns={3}
            />
          </FormSection>

          <FormSection title="Tipo de mordida">
            <CheckboxGroup
              items={[
                { key: "normal", label: "Normal" },
                { key: "anterior_crossbite", label: "Cruzada anterior" },
                { key: "posterior_crossbite", label: "Cruzada posterior" },
                { key: "single_tooth_crossbite", label: "Cruzada de un diente" },
                { key: "anterior_open_bite", label: "Mordida abierta anterior" },
                { key: "scissor_bite", label: "Mordida en tijera" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={intraOral.bite_type}
              onChange={(k, v) => patchNested(setIntraOral, "bite_type", k, v)}
              columns={2}
            />
          </FormSection>
        </TabsContent>

        {/* ── TAB: HÁBITOS ── */}
        <TabsContent value="habitos" className="space-y-4">
          <FormSection title="Hábitos">
            <CheckboxGroup
              items={[
                { key: "finger_sucking", label: "Chuparse el dedo", withInput: true, inputPlaceholder: "¿Cuál?" },
                { key: "nail_biting", label: "Onicofagia (morderse las uñas)" },
                { key: "pencil_biting", label: "Morder lápices" },
                { key: "pen_biting", label: "Morder bolígrafos" },
                { key: "lip_interposition", label: "Interposición labial" },
                { key: "no_bad_habits", label: "Ningún mal hábito" },
              ]}
              values={{ ...habits, finger_sucking_detail: habits.finger_sucking_which }}
              onChange={(k, v) => {
                if (k === "finger_sucking_detail") {
                  setHabits((p) => ({ ...p, finger_sucking_which: v as string }))
                } else {
                  patchSection(setHabits, k, v)
                }
              }}
              columns={2}
            />
          </FormSection>

          <FormSection title="Apertura bucal">
            <RadioGroupField
              name="mouth_opening"
              value={habits.mouth_opening}
              onChange={(v) => patchSection(setHabits, "mouth_opening", v)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "limited", label: "Limitada" },
                { value: "right", label: "Desviada a la derecha" },
                { value: "left", label: "Desviada a la izquierda" },
              ]}
            />
          </FormSection>

          <FormSection title="Cierre labial">
            <RadioGroupField
              name="lip_closure"
              value={habits.lip_closure}
              onChange={(v) => patchSection(setHabits, "lip_closure", v)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "insufficient", label: "Insuficiente" },
                { value: "other", label: "Otros" },
              ]}
              columns={3}
            />
            {habits.lip_closure === "other" && (
              <Input value={habits.lip_closure_other} onChange={(e) => patchSection(setHabits, "lip_closure_other", e.target.value)} placeholder="Especificar" className="max-w-xs" />
            )}
          </FormSection>

          <FormSection title="Respiración">
            <RadioGroupField
              name="breathing"
              value={habits.breathing}
              onChange={(v) => patchSection(setHabits, "breathing", v)}
              options={[
                { value: "nasal", label: "Nasal" },
                { value: "oral", label: "Bucal" },
                { value: "mixed", label: "Mixta" },
              ]}
              columns={3}
            />
          </FormSection>

          <FormSection title="Deglución">
            <RadioGroupField
              name="swallowing"
              value={habits.swallowing}
              onChange={(v) => patchSection(setHabits, "swallowing", v)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "chin_wrinkle", label: "Arruga el mentón al deglutir" },
                { value: "lingual_interposition", label: "Con interposición lingual" },
                { value: "lower_lip_interposition", label: "Con interposición labial inferior" },
              ]}
            />
          </FormSection>
        </TabsContent>

        {/* ── TAB: HISTORIA MÉDICA ── */}
        <TabsContent value="medica" className="space-y-4">
          <FormSection title="Tratamiento médico actual">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="under_treatment"
                checked={medicalHistory.under_medical_treatment}
                onChange={(e) => patchSection(setMedicalHistory, "under_medical_treatment", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="under_treatment">Está bajo tratamiento médico actualmente</Label>
            </div>
            {medicalHistory.under_medical_treatment && (
              <Input value={medicalHistory.treatment_duration} onChange={(e) => patchSection(setMedicalHistory, "treatment_duration", e.target.value)} placeholder="¿Hace cuánto tiempo?" className="max-w-xs" />
            )}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="taking_medication"
                checked={medicalHistory.taking_medication}
                onChange={(e) => patchSection(setMedicalHistory, "taking_medication", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="taking_medication">Está tomando medicamentos</Label>
            </div>
            {medicalHistory.taking_medication && (
              <Input value={medicalHistory.medication_detail} onChange={(e) => patchSection(setMedicalHistory, "medication_detail", e.target.value)} placeholder="¿Cuál/Cuáles?" />
            )}
          </FormSection>

          <FormSection title="Enfermedades">
            <CheckboxGroup
              items={[
                { key: "tuberculosis", label: "Tuberculosis" },
                { key: "leprosy", label: "Lepra" },
                { key: "cardiac", label: "Enf. Cardíacas" },
                { key: "sexual_diseases", label: "Enf. Sexuales" },
                { key: "asthma", label: "Asma" },
                { key: "hepatitis", label: "Hepatitis" },
                { key: "hypertension", label: "Hiper. Arterial" },
                { key: "malaria", label: "Malaria" },
                { key: "allergy", label: "Alergia" },
                { key: "aids", label: "SIDA" },
                { key: "chagas", label: "Enf. de Chagas" },
                { key: "psychiatric", label: "Disturbios Psíquicos" },
                { key: "rheumatic_fever", label: "Fiebre Reumática" },
                { key: "seizures", label: "Convulsiones" },
                { key: "epilepsy", label: "Epilepsia" },
                { key: "fainting", label: "Desmayos" },
                { key: "sinusitis", label: "Sinusitis" },
                { key: "coagulation_problems", label: "Probl. de coagulación" },
                { key: "anemia", label: "Anemia" },
                { key: "diabetes", label: "Diabetes" },
                { key: "hemophilia", label: "Hemofilia" },
                { key: "ulcers", label: "Úlceras" },
                { key: "other", label: "Otros", withInput: true },
              ]}
              values={medicalHistory.diseases}
              onChange={(k, v) => patchNested(setMedicalHistory as any, "diseases", k, v)}
              columns={2}
            />
          </FormSection>

          <FormSection title="Otros antecedentes">
            <div className="space-y-3">
              {[
                { key: "needs_blood_transfusion", label: "Necesita transfusiones sanguíneas", detailKey: "transfusion_reason", detailLabel: "Motivo" },
                { key: "had_surgery", label: "Fue sometido a cirugías", detailKey: "surgery_detail", detailLabel: "¿Cuáles?" },
              ].map(({ key, label, detailKey, detailLabel }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={key} checked={(medicalHistory as any)[key]} onChange={(e) => patchSection(setMedicalHistory, key, e.target.checked)} className="h-4 w-4 accent-primary" />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                  {(medicalHistory as any)[key] && (
                    <Input value={(medicalHistory as any)[detailKey]} onChange={(e) => patchSection(setMedicalHistory, detailKey, e.target.value)} placeholder={detailLabel} className="ml-6 max-w-sm" />
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="bleeds" checked={medicalHistory.bleeds_excessively} onChange={(e) => patchSection(setMedicalHistory, "bleeds_excessively", e.target.checked)} className="h-4 w-4 accent-primary" />
                <Label htmlFor="bleeds">Sangra mucho post extracción o corte</Label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="smokes" checked={medicalHistory.smokes} onChange={(e) => patchSection(setMedicalHistory, "smokes", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="smokes">Fuma</Label>
                </div>
                {medicalHistory.smokes && (
                  <div className="ml-6 grid grid-cols-2 gap-2">
                    <Input value={medicalHistory.smoking_duration} onChange={(e) => patchSection(setMedicalHistory, "smoking_duration", e.target.value)} placeholder="¿Desde hace cuánto?" />
                    <Input value={medicalHistory.cigarettes_per_day} onChange={(e) => patchSection(setMedicalHistory, "cigarettes_per_day", e.target.value)} placeholder="Cantidad por día" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="alcohol" checked={medicalHistory.drinks_alcohol} onChange={(e) => patchSection(setMedicalHistory, "drinks_alcohol", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="alcohol">Toma bebidas alcohólicas</Label>
                </div>
                {medicalHistory.drinks_alcohol && (
                  <Input value={medicalHistory.alcohol_duration} onChange={(e) => patchSection(setMedicalHistory, "alcohol_duration", e.target.value)} placeholder="¿Desde hace cuánto?" className="ml-6 max-w-xs" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pregnant" checked={medicalHistory.pregnant} onChange={(e) => patchSection(setMedicalHistory, "pregnant", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="pregnant">Embarazada</Label>
                </div>
                {medicalHistory.pregnant && (
                  <Input value={medicalHistory.pregnancy_duration} onChange={(e) => patchSection(setMedicalHistory, "pregnancy_duration", e.target.value)} placeholder="¿De cuánto tiempo?" className="ml-6 max-w-xs" />
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <input type="checkbox" id="anesthesia" checked={medicalHistory.tolerates_anesthesia} onChange={(e) => patchSection(setMedicalHistory, "tolerates_anesthesia", e.target.checked)} className="h-4 w-4 accent-primary" />
                <Label htmlFor="anesthesia">Tolera la anestesia odontológica</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="no_anesthesia" checked={medicalHistory.never_had_anesthesia} onChange={(e) => patchSection(setMedicalHistory, "never_had_anesthesia", e.target.checked)} className="h-4 w-4 accent-primary" />
                <Label htmlFor="no_anesthesia">Nunca le aplicaron anestesia</Label>
              </div>
            </div>
          </FormSection>
        </TabsContent>

        {/* ── TAB: HISTORIA ODONTOLÓGICA (adulto) ── */}
        {patientType === "adulto" && (
          <TabsContent value="odontologica" className="space-y-4">
            <FormSection title="Historia odontológica">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Última visita al odontólogo</Label>
                  <Input value={dentalHistory.last_dentist_visit} onChange={(e) => patchSection(setDentalHistory, "last_dentist_visit", e.target.value)} placeholder="Ej: hace 6 meses" />
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia de cepillado diario</Label>
                  <Input value={dentalHistory.brushing_frequency} onChange={(e) => patchSection(setDentalHistory, "brushing_frequency", e.target.value)} placeholder="Ej: 2 veces" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tooth_loss" checked={dentalHistory.has_tooth_loss} onChange={(e) => patchSection(setDentalHistory, "has_tooth_loss", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="tooth_loss">Tiene pérdida de dientes</Label>
                </div>
                {dentalHistory.has_tooth_loss && (
                  <RadioGroupField
                    name="tooth_loss_reason"
                    value={dentalHistory.tooth_loss_reason}
                    onChange={(v) => patchSection(setDentalHistory, "tooth_loss_reason", v)}
                    options={[
                      { value: "caries", label: "Caries" },
                      { value: "accident", label: "Accidente" },
                      { value: "mobility", label: "Movilidad" },
                      { value: "orthodontic", label: "Ortodóntico" },
                    ]}
                    columns={4}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Elementos de higiene dental</Label>
                <CheckboxGroup
                  items={[
                    { key: "hygiene_brush", label: "Cepillo" },
                    { key: "hygiene_floss", label: "Hilo dental" },
                    { key: "hygiene_mouthwash", label: "Enjuagues" },
                    { key: "hygiene_other", label: "Otros", withInput: true },
                  ]}
                  values={dentalHistory}
                  onChange={(k, v) => patchSection(setDentalHistory, k, v)}
                  columns={2}
                />
              </div>
            </FormSection>
          </TabsContent>
        )}

        {/* ── TAB: DIETA (niño) ── */}
        {patientType === "nino" && (
          <TabsContent value="dieta" className="space-y-4">
            <FormSection title="Alimentos preferidos">
              <CheckboxGroup
                items={[
                  { key: "cakes", label: "Tortas" }, { key: "cookies", label: "Galletitas" },
                  { key: "flan", label: "Flan" }, { key: "homemade_sweets", label: "Dulces caseros" },
                  { key: "condensed_milk", label: "Leche condensada" }, { key: "excess_sugar", label: "Azúcar en exceso" },
                  { key: "pasta", label: "Pastas" }, { key: "gum", label: "Chicles" },
                  { key: "candy", label: "Caramelos" }, { key: "chocolate", label: "Chocolates" },
                  { key: "lollipops", label: "Chupetines" }, { key: "sodas", label: "Gaseosas" },
                  { key: "juice_boxes", label: "Jugos en cajas" },
                ]}
                values={dietRecord.preferred_foods}
                onChange={(k, v) => patchNested(setDietRecord as any, "preferred_foods", k, v)}
                columns={3}
              />
            </FormSection>

            <FormSection title="Dieta semanal">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-24">Día</th>
                      {["Desayuno", "Media mañana", "Almuerzo", "Merienda"].map((h) => (
                        <th key={h} className="text-left py-2 pr-3 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(["monday", "tuesday", "wednesday", "thursday", "friday"] as const).map((day) => {
                      const labels: Record<string, string> = { monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves", friday: "Viernes" }
                      return (
                        <tr key={day}>
                          <td className="py-2 pr-3 font-medium text-muted-foreground">{labels[day]}</td>
                          {(["breakfast", "mid_morning", "lunch", "snack"] as const).map((meal) => (
                            <td key={meal} className="py-2 pr-3">
                              <Input
                                value={dietRecord.weekly_diet[day][meal]}
                                onChange={(e) =>
                                  setDietRecord((p) => ({
                                    ...p,
                                    weekly_diet: {
                                      ...p.weekly_diet,
                                      [day]: { ...p.weekly_diet[day], [meal]: e.target.value },
                                    },
                                  }))
                                }
                                className="h-7 text-xs min-w-[80px]"
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </FormSection>
          </TabsContent>
        )}

        {/* ── TAB: CONSENTIMIENTO ── */}
        <TabsContent value="consentimiento" className="space-y-4">
          <FormSection title="Texto del consentimiento informado">
            {clinic?.consent_template ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {clinic.consent_template}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay template configurado.{" "}
                <Link href="/settings" className="text-primary underline underline-offset-2">
                  Configurarlo en Ajustes
                </Link>
              </p>
            )}
          </FormSection>

          {!consentSigned ? (
            <FormSection title="Firma del paciente o responsable">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre y apellido *</Label>
                  <Input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Firmante" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cédula de identidad</Label>
                  <Input value={signedByCi} onChange={(e) => setSignedByCi(e.target.value)} placeholder="CI" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Al registrar la firma, se guardará una copia inmutable del texto del consentimiento vigente.
              </p>
              <Button onClick={handleSignConsent} disabled={signingConsent || !clinic?.consent_template} className="gap-2">
                <FileSignature className="h-4 w-4" />
                {signingConsent ? "Registrando..." : "Registrar firma"}
              </Button>
            </FormSection>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <FileSignature className="h-4 w-4 shrink-0" />
              Consentimiento registrado correctamente para {signedByName}.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Botón guardar sticky bottom */}
      <div className="sticky bottom-4 flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar ficha"}
        </Button>
      </div>
    </div>
  )
}
