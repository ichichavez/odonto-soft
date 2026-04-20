"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormSection } from "@/components/dental-record/form-section"
import { CheckboxGroup } from "@/components/dental-record/checkbox-group"
import { RadioGroupField } from "@/components/dental-record/radio-group-field"
import { Textarea } from "@/components/ui/textarea"
import {
  Baby, User2, ClipboardList, Stethoscope, AlertCircle, Plus, Trash2, Grid3X3, ExternalLink,
} from "lucide-react"
import type {
  ExtraOralExam, IntraOralExam, Habits, MedicalHistory,
  DentalHistory, FeedingHistory, DietRecord,
} from "@/types/dental"

// ─── Public types ───────────────────────────────────────────────────────────

export interface ArmonizacionData {
  // [2] Motivo / Expectativas
  que_mejorar: string
  resultado_esperado: string
  tratamientos_previos: string
  // [3] Antecedentes médicos
  enfermedad_cronica: boolean
  enfermedad_cronica_detalle: string
  alergias: boolean
  alergias_detalle: string
  herpes: boolean
  anticoagulantes: boolean
  anticoagulantes_detalle: string
  trastornos_neurologicos: boolean
  trastornos_neurologicos_detalle: string
  cicatrizacion_problemas: boolean
  embarazo_lactancia: boolean
  // [4] Medicamentos
  medicamentos_actuales: string
  suplementos: string
  // [5] Antecedentes quirúrgicos / estéticos
  cirugias_recientes: string
  tratamientos_esteticos_previos: string
  ultimo_tratamiento: string
  // [6] Hábitos
  fuma: boolean
  alcohol: boolean
  exposicion_solar: string
  rutina_facial: string
  // [7] Examen físico facial
  simetria_facial: string
  tonicidad_piel: string
  volumenes_faciales: string
  movilidad_muscular: string
  arrugas: string
  presencia_de: string
  estado_labios_surcos: string
  // [8] Consentimiento / Firma
  firma_paciente: string
  fecha_consentimiento: string
  notas_adicionales: string
}

export interface DentalFormData {
  patientType: "adulto" | "nino"
  consultationDate: string
  reasonOfVisit: string[]
  reasonOther: string
  referredBy: string
  profession: string
  civilStatus: string
  workAddress: string
  weight: string
  height: string
  guardianName: string
  guardianPhone: string
  feedingHistory: FeedingHistory
  dietRecord: DietRecord
  extraOral: ExtraOralExam
  intraOral: IntraOralExam
  habits: Habits
  medicalHistory: MedicalHistory
  dentalHistory: DentalHistory
  treatmentsDone: { date: string; tooth: string; description: string }[]
  specialtyNotes: { ortodoncia: string; armonizacion: ArmonizacionData; perio: string }
}

export interface DentalRecordFormHandle {
  getData(): DentalFormData
}

export interface ExtraTab {
  value: string
  trigger: React.ReactNode
  content: React.ReactNode
}

interface Props {
  /** Pre-populate all fields (for edit/view). Use a stable reference or the component will re-mount via key. */
  initialData?: Partial<DentalFormData>
  /** Additional tabs appended at the end (e.g. Consentimiento in ficha/page.tsx). */
  extraTabs?: ExtraTab[]
  /** Patient ID used to build a link to the full odontogram page. */
  patientId?: string
}

// ─── Defaults ───────────────────────────────────────────────────────────────

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
    monday:    { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    tuesday:   { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    wednesday: { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    thursday:  { breakfast: "", mid_morning: "", lunch: "", snack: "" },
    friday:    { breakfast: "", mid_morning: "", lunch: "", snack: "" },
  },
})

const defaultArmonizacion = (): ArmonizacionData => ({
  que_mejorar: "", resultado_esperado: "", tratamientos_previos: "",
  enfermedad_cronica: false, enfermedad_cronica_detalle: "",
  alergias: false, alergias_detalle: "",
  herpes: false,
  anticoagulantes: false, anticoagulantes_detalle: "",
  trastornos_neurologicos: false, trastornos_neurologicos_detalle: "",
  cicatrizacion_problemas: false, embarazo_lactancia: false,
  medicamentos_actuales: "", suplementos: "",
  cirugias_recientes: "", tratamientos_esteticos_previos: "", ultimo_tratamiento: "",
  fuma: false, alcohol: false, exposicion_solar: "", rutina_facial: "",
  simetria_facial: "", tonicidad_piel: "", volumenes_faciales: "",
  movilidad_muscular: "", arrugas: "", presencia_de: "", estado_labios_surcos: "",
  firma_paciente: "", fecha_consentimiento: new Date().toISOString().slice(0, 10), notas_adicionales: "",
})

const defaultSpecialtyNotes = () => ({
  ortodoncia: "",
  armonizacion: defaultArmonizacion(),
  perio: "",
})

// ─── Component ──────────────────────────────────────────────────────────────

export const DentalRecordFormTabs = forwardRef<DentalRecordFormHandle, Props>(
  function DentalRecordFormTabs({ initialData, extraTabs, patientId }, ref) {
    const d = initialData

    const [patientType,      setPatientType]      = useState<"adulto" | "nino">(d?.patientType ?? "adulto")
    const [consultationDate, setConsultationDate] = useState(d?.consultationDate ?? new Date().toISOString().slice(0, 10))
    const [reasonOfVisit,    setReasonOfVisit]    = useState<string[]>(d?.reasonOfVisit ?? [])
    const [reasonOther,      setReasonOther]      = useState(d?.reasonOther ?? "")
    const [referredBy,       setReferredBy]       = useState(d?.referredBy ?? "")
    const [profession,       setProfession]       = useState(d?.profession ?? "")
    const [civilStatus,      setCivilStatus]      = useState(d?.civilStatus ?? "")
    const [workAddress,      setWorkAddress]      = useState(d?.workAddress ?? "")
    const [weight,           setWeight]           = useState(d?.weight ?? "")
    const [height,           setHeight]           = useState(d?.height ?? "")
    const [guardianName,     setGuardianName]     = useState(d?.guardianName ?? "")
    const [guardianPhone,    setGuardianPhone]    = useState(d?.guardianPhone ?? "")
    const [feedingHistory,   setFeedingHistory]   = useState<FeedingHistory>(() => ({ ...defaultFeedingHistory(), ...d?.feedingHistory }))
    const [dietRecord,       setDietRecord]       = useState<DietRecord>(() => {
      const def = defaultDietRecord()
      if (!d?.dietRecord) return def
      return {
        preferred_foods: { ...def.preferred_foods, ...d.dietRecord.preferred_foods },
        weekly_diet: {
          monday:    { ...def.weekly_diet.monday,    ...d.dietRecord.weekly_diet?.monday },
          tuesday:   { ...def.weekly_diet.tuesday,   ...d.dietRecord.weekly_diet?.tuesday },
          wednesday: { ...def.weekly_diet.wednesday, ...d.dietRecord.weekly_diet?.wednesday },
          thursday:  { ...def.weekly_diet.thursday,  ...d.dietRecord.weekly_diet?.thursday },
          friday:    { ...def.weekly_diet.friday,    ...d.dietRecord.weekly_diet?.friday },
        },
      }
    })
    const [extraOral,  setExtraOral]  = useState<ExtraOralExam>(() => {
      const def = defaultExtraOral()
      if (!d?.extraOral) return def
      const e = d.extraOral as any
      return {
        atm:         { ...def.atm,         ...(e.atm         ?? {}) },
        head:        { ...def.head,        ...(e.head        ?? {}) },
        face:        { ...def.face,        ...(e.face        ?? {}) },
        lymph_nodes: { ...def.lymph_nodes, ...(e.lymph_nodes ?? {}) },
        lips:        { ...def.lips,        ...(e.lips        ?? {}) },
      }
    })
    const [intraOral,  setIntraOral]  = useState<IntraOralExam>(() => {
      const def = defaultIntraOral()
      if (!d?.intraOral) return def
      const i = d.intraOral as any
      return {
        gums:                      { ...def.gums,                      ...(i.gums                      ?? {}) },
        tongue:                    { ...def.tongue,                    ...(i.tongue                    ?? {}) },
        hard_palate:               { ...def.hard_palate,               ...(i.hard_palate               ?? {}) },
        soft_palate:               { ...def.soft_palate,               ...(i.soft_palate               ?? {}) },
        pharynx:                   { ...def.pharynx,                   ...(i.pharynx                   ?? {}) },
        floor_of_mouth:            { ...def.floor_of_mouth,            ...(i.floor_of_mouth            ?? {}) },
        occlusion_temporary:       { ...def.occlusion_temporary,       ...(i.occlusion_temporary       ?? {}) },
        occlusion_mixed_permanent: { ...def.occlusion_mixed_permanent, ...(i.occlusion_mixed_permanent ?? {}) },
        bite_type:                 { ...def.bite_type,                 ...(i.bite_type                 ?? {}) },
      }
    })
    const [habits,         setHabits]         = useState<Habits>(() => ({ ...defaultHabits(), ...d?.habits }))
    const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>(() => {
      const def = defaultMedicalHistory()
      if (!d?.medicalHistory) return def
      return { ...def, ...d.medicalHistory, diseases: { ...def.diseases, ...(d.medicalHistory.diseases ?? {}) } }
    })
    const [dentalHistory,  setDentalHistory]  = useState<DentalHistory>(() => ({ ...defaultDentalHistory(), ...d?.dentalHistory }))
    const [treatmentsDone, setTreatmentsDone] = useState<{ date: string; tooth: string; description: string }[]>(d?.treatmentsDone ?? [])

    // Specialty notes
    const [ortodoncia, setOrtodoncia] = useState<string>(
      typeof d?.specialtyNotes?.ortodoncia === "string" ? d.specialtyNotes.ortodoncia : ""
    )
    const [perio, setPerio] = useState<string>(
      typeof d?.specialtyNotes?.perio === "string" ? d.specialtyNotes.perio : ""
    )
    const [armonizacion, setArmonizacion] = useState<ArmonizacionData>(() => {
      const saved = d?.specialtyNotes?.armonizacion
      if (saved && typeof saved === "object") return { ...defaultArmonizacion(), ...(saved as any) }
      return defaultArmonizacion()
    })

    // ── Expose data via ref ──────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getData: () => ({
        patientType, consultationDate, reasonOfVisit, reasonOther, referredBy,
        profession, civilStatus, workAddress, weight, height, guardianName, guardianPhone,
        feedingHistory, dietRecord, extraOral, intraOral, habits, medicalHistory, dentalHistory,
        treatmentsDone,
        specialtyNotes: { ortodoncia, armonizacion, perio },
      }),
    }))

    // ── Helpers ─────────────────────────────────────────────────────
    const patchSection = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: string, val: any) =>
      setter((prev) => ({ ...prev, [key]: val }))

    const patchNested = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, section: string, key: string, val: any) =>
      setter((prev) => ({ ...prev, [section]: { ...(prev as any)[section], [key]: val } }))

    const toggleReason = (r: string) =>
      setReasonOfVisit((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])

    const setArmo = (key: keyof ArmonizacionData, val: any) =>
      setArmonizacion((p) => ({ ...p, [key]: val }))

    // ── Render ──────────────────────────────────────────────────────
    return (
      <div className="space-y-4">
        {/* Tipo de paciente */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-sm font-medium mr-2">Tipo de paciente:</span>
          {(["adulto", "nino"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPatientType(t)}
              className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                patientType === t ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"
              }`}
            >
              {t === "adulto" ? <User2 className="h-4 w-4" /> : <Baby className="h-4 w-4" />}
              {t === "adulto" ? "Adulto" : "Niño/a"}
            </button>
          ))}
          {patientType === "nino" && (
            <Badge variant="secondary" className="ml-2 text-xs">Campos pediátricos activos</Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="datos">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
            <TabsTrigger value="datos"        className="gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" />Datos</TabsTrigger>
            <TabsTrigger value="medica"       className="gap-1.5 text-xs"><AlertCircle className="h-3.5 w-3.5" />Hist. Médico</TabsTrigger>
            {patientType === "adulto" && (
              <TabsTrigger value="odontologica" className="gap-1.5 text-xs">H. Dental</TabsTrigger>
            )}
            <TabsTrigger value="habitos"      className="gap-1.5 text-xs">Hábitos</TabsTrigger>
            <TabsTrigger value="extraoral"    className="gap-1.5 text-xs"><Stethoscope className="h-3.5 w-3.5" />Extra Oral</TabsTrigger>
            <TabsTrigger value="intraoral"    className="gap-1.5 text-xs"><Stethoscope className="h-3.5 w-3.5" />Intraoral</TabsTrigger>
            <TabsTrigger value="odontograma"  className="gap-1.5 text-xs"><Grid3X3 className="h-3.5 w-3.5" />Odontograma</TabsTrigger>
            <TabsTrigger value="tratamientos" className="gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" />Tratamiento</TabsTrigger>
            <TabsTrigger value="ortodoncia"   className="gap-1.5 text-xs">Ortodoncia</TabsTrigger>
            <TabsTrigger value="armonizacion" className="gap-1.5 text-xs">Armonización</TabsTrigger>
            <TabsTrigger value="perio"        className="gap-1.5 text-xs">Perio</TabsTrigger>
            {patientType === "nino" && (
              <TabsTrigger value="alimentacion" className="gap-1.5 text-xs"><Baby className="h-3.5 w-3.5" />Alimentación</TabsTrigger>
            )}
            {patientType === "nino" && (
              <TabsTrigger value="dieta" className="gap-1.5 text-xs">Dieta</TabsTrigger>
            )}
            {extraTabs?.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                {tab.trigger}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── DATOS ── */}
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

          {/* ── HISTORIA MÉDICA ── */}
          <TabsContent value="medica" className="space-y-4">
            <FormSection title="Tratamiento médico actual">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="under_treatment" checked={medicalHistory.under_medical_treatment}
                  onChange={(e) => patchSection(setMedicalHistory, "under_medical_treatment", e.target.checked)}
                  className="h-4 w-4 accent-primary" />
                <Label htmlFor="under_treatment">Está bajo tratamiento médico actualmente</Label>
              </div>
              {medicalHistory.under_medical_treatment && (
                <Input value={medicalHistory.treatment_duration} onChange={(e) => patchSection(setMedicalHistory, "treatment_duration", e.target.value)} placeholder="¿Hace cuánto tiempo?" className="max-w-xs" />
              )}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="taking_medication" checked={medicalHistory.taking_medication}
                  onChange={(e) => patchSection(setMedicalHistory, "taking_medication", e.target.checked)}
                  className="h-4 w-4 accent-primary" />
                <Label htmlFor="taking_medication">Está tomando medicamentos</Label>
              </div>
              {medicalHistory.taking_medication && (
                <Input value={medicalHistory.medication_detail} onChange={(e) => patchSection(setMedicalHistory, "medication_detail", e.target.value)} placeholder="¿Cuál/Cuáles?" />
              )}
            </FormSection>
            <FormSection title="Enfermedades">
              <CheckboxGroup items={[
                { key: "tuberculosis",       label: "Tuberculosis" },
                { key: "leprosy",            label: "Lepra" },
                { key: "cardiac",            label: "Enf. Cardíacas" },
                { key: "sexual_diseases",    label: "Enf. Sexuales" },
                { key: "asthma",             label: "Asma" },
                { key: "hepatitis",          label: "Hepatitis" },
                { key: "hypertension",       label: "Hiper. Arterial" },
                { key: "malaria",            label: "Malaria" },
                { key: "allergy",            label: "Alergia" },
                { key: "aids",               label: "SIDA" },
                { key: "chagas",             label: "Enf. de Chagas" },
                { key: "psychiatric",        label: "Disturbios Psíquicos" },
                { key: "rheumatic_fever",    label: "Fiebre Reumática" },
                { key: "seizures",           label: "Convulsiones" },
                { key: "epilepsy",           label: "Epilepsia" },
                { key: "fainting",           label: "Desmayos" },
                { key: "sinusitis",          label: "Sinusitis" },
                { key: "coagulation_problems", label: "Probl. de coagulación" },
                { key: "anemia",             label: "Anemia" },
                { key: "diabetes",           label: "Diabetes" },
                { key: "hemophilia",         label: "Hemofilia" },
                { key: "ulcers",             label: "Úlceras" },
                { key: "other",              label: "Otros", withInput: true },
              ]} values={medicalHistory.diseases} onChange={(k, v) => patchNested(setMedicalHistory as any, "diseases", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Otros antecedentes">
              <div className="space-y-3">
                {([
                  { key: "needs_blood_transfusion", label: "Necesita transfusiones sanguíneas", detailKey: "transfusion_reason", detailLabel: "Motivo" },
                  { key: "had_surgery",             label: "Fue sometido a cirugías",            detailKey: "surgery_detail",    detailLabel: "¿Cuáles?" },
                ] as const).map(({ key, label, detailKey, detailLabel }) => (
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

          {/* ── HISTORIA DENTAL (adulto) ── */}
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
                    <RadioGroupField name="tooth_loss_reason" value={dentalHistory.tooth_loss_reason}
                      onChange={(v) => patchSection(setDentalHistory, "tooth_loss_reason", v)}
                      options={[
                        { value: "caries",      label: "Caries" },
                        { value: "accident",    label: "Accidente" },
                        { value: "mobility",    label: "Movilidad" },
                        { value: "orthodontic", label: "Ortodóntico" },
                      ]} columns={4} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Elementos de higiene dental</Label>
                  <CheckboxGroup items={[
                    { key: "hygiene_brush",     label: "Cepillo" },
                    { key: "hygiene_floss",     label: "Hilo dental" },
                    { key: "hygiene_mouthwash", label: "Enjuagues" },
                    { key: "hygiene_other",     label: "Otros", withInput: true },
                  ]} values={dentalHistory} onChange={(k, v) => patchSection(setDentalHistory, k, v)} columns={2} />
                </div>
              </FormSection>
            </TabsContent>
          )}

          {/* ── HÁBITOS ── */}
          <TabsContent value="habitos" className="space-y-4">
            <FormSection title="Hábitos">
              <CheckboxGroup items={[
                { key: "finger_sucking",  label: "Chuparse el dedo", withInput: true, inputPlaceholder: "¿Cuál?" },
                { key: "nail_biting",     label: "Onicofagia (morderse las uñas)" },
                { key: "pencil_biting",   label: "Morder lápices" },
                { key: "pen_biting",      label: "Morder bolígrafos" },
                { key: "lip_interposition", label: "Interposición labial" },
                { key: "no_bad_habits",   label: "Ningún mal hábito" },
              ]}
                values={{ ...habits, finger_sucking_detail: habits.finger_sucking_which }}
                onChange={(k, v) => {
                  if (k === "finger_sucking_detail") setHabits((p) => ({ ...p, finger_sucking_which: v as string }))
                  else patchSection(setHabits, k, v)
                }}
                columns={2}
              />
            </FormSection>
            <FormSection title="Apertura bucal">
              <RadioGroupField name="mouth_opening" value={habits.mouth_opening}
                onChange={(v) => patchSection(setHabits, "mouth_opening", v)}
                options={[
                  { value: "normal",  label: "Normal" },
                  { value: "limited", label: "Limitada" },
                  { value: "right",   label: "Desviada a la derecha" },
                  { value: "left",    label: "Desviada a la izquierda" },
                ]} />
            </FormSection>
            <FormSection title="Cierre labial">
              <RadioGroupField name="lip_closure" value={habits.lip_closure}
                onChange={(v) => patchSection(setHabits, "lip_closure", v)}
                options={[
                  { value: "normal",       label: "Normal" },
                  { value: "insufficient", label: "Insuficiente" },
                  { value: "other",        label: "Otros" },
                ]} columns={3} />
              {habits.lip_closure === "other" && (
                <Input value={habits.lip_closure_other} onChange={(e) => patchSection(setHabits, "lip_closure_other", e.target.value)} placeholder="Especificar" className="max-w-xs" />
              )}
            </FormSection>
            <FormSection title="Respiración">
              <RadioGroupField name="breathing" value={habits.breathing}
                onChange={(v) => patchSection(setHabits, "breathing", v)}
                options={[
                  { value: "nasal", label: "Nasal" },
                  { value: "oral",  label: "Bucal" },
                  { value: "mixed", label: "Mixta" },
                ]} columns={3} />
            </FormSection>
            <FormSection title="Deglución">
              <RadioGroupField name="swallowing" value={habits.swallowing}
                onChange={(v) => patchSection(setHabits, "swallowing", v)}
                options={[
                  { value: "normal",                    label: "Normal" },
                  { value: "chin_wrinkle",              label: "Arruga el mentón al deglutir" },
                  { value: "lingual_interposition",     label: "Con interposición lingual" },
                  { value: "lower_lip_interposition",   label: "Con interposición labial inferior" },
                ]} />
            </FormSection>
          </TabsContent>

          {/* ── EXTRA ORAL ── */}
          <TabsContent value="extraoral" className="space-y-4">
            <FormSection title="ATM">
              <CheckboxGroup items={[
                { key: "pain_palpation", label: "Dolor a la palpación" },
                { key: "pain_opening",   label: "Dolor en apertura bucal" },
                { key: "pain_closing",   label: "Dolor en cierre bucal" },
                { key: "joint_noise",    label: "Ruido articular" },
                { key: "no_issues",      label: "Sin molestias" },
                { key: "other",          label: "Otros", withInput: true },
              ]} values={extraOral.atm} onChange={(k, v) => patchNested(setExtraOral, "atm", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Cabeza">
              <CheckboxGroup items={[
                { key: "scar",         label: "Tiene cicatriz" },
                { key: "asymmetry",    label: "Asimetría" },
                { key: "normal_size",  label: "Tamaño normal" },
                { key: "normal_shape", label: "Forma normal" },
                { key: "other",        label: "Otro", withInput: true },
              ]} values={extraOral.head} onChange={(k, v) => patchNested(setExtraOral, "head", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Cara">
              <CheckboxGroup items={[
                { key: "asymmetric_front",    label: "Asimétrica visto de frente" },
                { key: "convex_profile",      label: "Perfil convexo" },
                { key: "concave_profile",     label: "Perfil cóncavo" },
                { key: "straight_profile",    label: "Perfil recto" },
                { key: "no_particularities",  label: "Sin particularidades" },
              ]} values={extraOral.face} onChange={(k, v) => patchNested(setExtraOral, "face", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Ganglios">
              <CheckboxGroup items={[
                { key: "no_particularities", label: "Sin particularidades" },
                { key: "enlarged",           label: "Aumento de tamaño", withInput: true, inputPlaceholder: "Especificar ganglios" },
                { key: "other",              label: "Otro", withInput: true },
              ]} values={{ ...extraOral.lymph_nodes, enlarged_detail: extraOral.lymph_nodes.enlarged_detail }}
                onChange={(k, v) => patchNested(setExtraOral, "lymph_nodes", k, v)} />
            </FormSection>
            <FormSection title="Labios">
              <CheckboxGroup items={[
                { key: "short",               label: "Cortos" },
                { key: "normal",              label: "Normales, sin particularidades" },
                { key: "dry_cracked",         label: "Secos, agrietados" },
                { key: "injured_commissures", label: "Comisuras lastimadas" },
                { key: "labial_incompetence", label: "Incompetencia labial" },
              ]} values={extraOral.lips} onChange={(k, v) => patchNested(setExtraOral, "lips", k, v)} columns={2} />
            </FormSection>
          </TabsContent>

          {/* ── INTRA ORAL ── */}
          <TabsContent value="intraoral" className="space-y-4">
            <FormSection title="Encía">
              <CheckboxGroup items={[
                { key: "localized_gingivitis",   label: "Gingivitis localizada" },
                { key: "generalized_gingivitis", label: "Gingivitis generalizada" },
                { key: "healthy",                label: "Encía sana" },
                { key: "periodontal_pockets",    label: "Bolsas periodontales" },
                { key: "other",                  label: "Otros", withInput: true },
              ]} values={intraOral.gums} onChange={(k, v) => patchNested(setIntraOral, "gums", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Lengua">
              <CheckboxGroup items={[
                { key: "no_anomalies",   label: "Sin anomalías" },
                { key: "short_frenulum", label: "Frenillo lingual corto" },
                { key: "geographic",     label: "Lengua geográfica" },
                { key: "coated",         label: "Lengua saburral" },
                { key: "other",          label: "Otros", withInput: true },
              ]} values={intraOral.tongue} onChange={(k, v) => patchNested(setIntraOral, "tongue", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Paladar duro">
              <CheckboxGroup items={[
                { key: "normal_size",   label: "Tamaño normal" },
                { key: "normal_shape",  label: "Forma normal" },
                { key: "color_anomaly", label: "Anomalía de color" },
                { key: "ulcers",        label: "Úlceras" },
                { key: "size_anomaly",  label: "Anomalía de tamaño" },
                { key: "torus",         label: "Torus palatino" },
                { key: "burns",         label: "Quemaduras" },
                { key: "erythema",      label: "Eritemas" },
                { key: "other",         label: "Otros", withInput: true },
              ]} values={intraOral.hard_palate} onChange={(k, v) => patchNested(setIntraOral, "hard_palate", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Paladar blando">
              <CheckboxGroup items={[
                { key: "no_particularities", label: "Sin particularidades" },
                { key: "burns",              label: "Quemaduras" },
                { key: "ulcers",             label: "Úlceras" },
                { key: "petechiae_erythema", label: "Petequias / Eritemas" },
              ]} values={intraOral.soft_palate} onChange={(k, v) => patchNested(setIntraOral, "soft_palate", k, v)} columns={2} />
            </FormSection>
            <FormSection title="Faringe (Clasificación de Brosky)">
              <CheckboxGroup items={[
                { key: "normal",              label: "Normales" },
                { key: "grade1",              label: "Grado 1" },
                { key: "grade2",              label: "Grado 2" },
                { key: "grade3",              label: "Grado 3" },
                { key: "grade4",              label: "Grado 4" },
                { key: "surgically_removed",  label: "Extirpado quirúrgicamente" },
              ]} values={intraOral.pharynx} onChange={(k, v) => patchNested(setIntraOral, "pharynx", k, v)} columns={3} />
            </FormSection>
            <FormSection title="Piso de boca">
              <CheckboxGroup items={[
                { key: "no_abnormalities", label: "Sin anormalidades" },
                { key: "ranula",           label: "Ránula" },
                { key: "short_frenulum",   label: "Frenillo lingual corto" },
                { key: "lingual_tori",     label: "Torus linguales" },
              ]} values={intraOral.floor_of_mouth} onChange={(k, v) => patchNested(setIntraOral, "floor_of_mouth", k, v)} columns={2} />
            </FormSection>
            {patientType === "nino" && (
              <FormSection title="Tipo de oclusión — Dentición temporal">
                <CheckboxGroup items={[
                  { key: "straight_terminal_plane", label: "Plano terminal recto" },
                  { key: "mesial_terminal_plane",   label: "Plano terminal mesial" },
                  { key: "distal_terminal_plane",   label: "Plano terminal distal" },
                ]} values={intraOral.occlusion_temporary} onChange={(k, v) => patchNested(setIntraOral, "occlusion_temporary", k, v)} columns={3} />
              </FormSection>
            )}
            <FormSection title="Tipo de oclusión — Mixta o permanente (1ros Molares)">
              <CheckboxGroup items={[
                { key: "class1", label: "Clase I" },
                { key: "class2", label: "Clase II" },
                { key: "class3", label: "Clase III" },
              ]} values={intraOral.occlusion_mixed_permanent} onChange={(k, v) => patchNested(setIntraOral, "occlusion_mixed_permanent", k, v)} columns={3} />
            </FormSection>
            <FormSection title="Tipo de mordida">
              <CheckboxGroup items={[
                { key: "normal",                  label: "Normal" },
                { key: "anterior_crossbite",      label: "Cruzada anterior" },
                { key: "posterior_crossbite",     label: "Cruzada posterior" },
                { key: "single_tooth_crossbite",  label: "Cruzada de un diente" },
                { key: "anterior_open_bite",      label: "Mordida abierta anterior" },
                { key: "scissor_bite",            label: "Mordida en tijera" },
                { key: "other",                   label: "Otros", withInput: true },
              ]} values={intraOral.bite_type} onChange={(k, v) => patchNested(setIntraOral, "bite_type", k, v)} columns={2} />
            </FormSection>
          </TabsContent>

          {/* ── ODONTOGRAMA ── */}
          <TabsContent value="odontograma" className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-4">
              <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
              <div>
                <p className="font-medium">Odontograma interactivo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El odontograma completo está disponible en el panel del paciente.
                </p>
              </div>
              {patientId && (
                <a
                  href={`/pacientes/${patientId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ir al odontograma
                </a>
              )}
            </div>
          </TabsContent>

          {/* ── TRATAMIENTOS ── */}
          <TabsContent value="tratamientos" className="space-y-4">
            <FormSection title="Tratamientos Realizados">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-32">Fecha</th>
                      <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-24">Diente</th>
                      <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Tratamiento</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {treatmentsDone.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3">
                          <Input type="date" value={row.date}
                            onChange={(e) => setTreatmentsDone((prev) => prev.map((r, idx) => idx === i ? { ...r, date: e.target.value } : r))}
                            className="h-7 text-xs" />
                        </td>
                        <td className="py-2 pr-3">
                          <Input value={row.tooth}
                            onChange={(e) => setTreatmentsDone((prev) => prev.map((r, idx) => idx === i ? { ...r, tooth: e.target.value } : r))}
                            placeholder="Ej: 21" className="h-7 text-xs" />
                        </td>
                        <td className="py-2 pr-3">
                          <Input value={row.description}
                            onChange={(e) => setTreatmentsDone((prev) => prev.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r))}
                            placeholder="Descripción" className="h-7 text-xs" />
                        </td>
                        <td className="py-2">
                          <button type="button" onClick={() => setTreatmentsDone((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2"
                onClick={() => setTreatmentsDone((prev) => [...prev, { date: new Date().toISOString().slice(0, 10), tooth: "", description: "" }])}>
                <Plus className="h-4 w-4" />
                Agregar tratamiento
              </Button>
            </FormSection>
          </TabsContent>

          {/* ── ORTODONCIA ── */}
          <TabsContent value="ortodoncia" className="space-y-4">
            <FormSection title="Notas de Ortodoncia">
              <Textarea
                value={ortodoncia}
                onChange={(e) => setOrtodoncia(e.target.value)}
                placeholder="Observaciones, diagnóstico y plan de tratamiento ortodóntico, evolución, tipo de aparatología..."
                rows={10}
                className="resize-y"
              />
            </FormSection>
          </TabsContent>

          {/* ── ARMONIZACIÓN OROFACIAL ── */}
          <TabsContent value="armonizacion" className="space-y-4">

            {/* [2] Motivo / Expectativas */}
            <FormSection title="Motivo de la consulta y expectativas">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>¿Qué le gustaría mejorar de su rostro?</Label>
                  <Textarea
                    value={armonizacion.que_mejorar}
                    onChange={(e) => setArmo("que_mejorar", e.target.value)}
                    placeholder="Describir zona/s de interés..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>¿Qué resultado espera del tratamiento?</Label>
                  <Textarea
                    value={armonizacion.resultado_esperado}
                    onChange={(e) => setArmo("resultado_esperado", e.target.value)}
                    placeholder="Expectativas del paciente..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>¿Ha recibido tratamientos previos de botox o rellenos? ¿Cuándo y en qué zonas?</Label>
                  <Textarea
                    value={armonizacion.tratamientos_previos}
                    onChange={(e) => setArmo("tratamientos_previos", e.target.value)}
                    placeholder="Especificar producto, zona y fecha aproximada..."
                    rows={2}
                  />
                </div>
              </div>
            </FormSection>

            {/* [3] Antecedentes médicos */}
            <FormSection title="Antecedentes médicos generales">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="armo_enfermedad_cronica" checked={armonizacion.enfermedad_cronica}
                      onChange={(e) => setArmo("enfermedad_cronica", e.target.checked)} className="h-4 w-4 accent-primary" />
                    <Label htmlFor="armo_enfermedad_cronica">Padece enfermedad crónica (diabetes, hipertensión, autoinmunes…)</Label>
                  </div>
                  {armonizacion.enfermedad_cronica && (
                    <Input value={armonizacion.enfermedad_cronica_detalle} onChange={(e) => setArmo("enfermedad_cronica_detalle", e.target.value)} placeholder="Especificar" className="ml-6 max-w-sm" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="armo_alergias" checked={armonizacion.alergias}
                      onChange={(e) => setArmo("alergias", e.target.checked)} className="h-4 w-4 accent-primary" />
                    <Label htmlFor="armo_alergias">Reacciones alérgicas a medicamentos o sustancias</Label>
                  </div>
                  {armonizacion.alergias && (
                    <Input value={armonizacion.alergias_detalle} onChange={(e) => setArmo("alergias_detalle", e.target.value)} placeholder="¿A qué?" className="ml-6 max-w-sm" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="armo_herpes" checked={armonizacion.herpes}
                    onChange={(e) => setArmo("herpes", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="armo_herpes">Antecedentes de herpes facial o perioral</Label>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="armo_anticoagulantes" checked={armonizacion.anticoagulantes}
                      onChange={(e) => setArmo("anticoagulantes", e.target.checked)} className="h-4 w-4 accent-primary" />
                    <Label htmlFor="armo_anticoagulantes">Usa anticoagulantes o antiagregantes plaquetarios</Label>
                  </div>
                  {armonizacion.anticoagulantes && (
                    <Input value={armonizacion.anticoagulantes_detalle} onChange={(e) => setArmo("anticoagulantes_detalle", e.target.value)} placeholder="¿Cuál/Cuáles?" className="ml-6 max-w-sm" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="armo_neurologico" checked={armonizacion.trastornos_neurologicos}
                      onChange={(e) => setArmo("trastornos_neurologicos", e.target.checked)} className="h-4 w-4 accent-primary" />
                    <Label htmlFor="armo_neurologico">Trastornos neurológicos (miastenia gravis, ELA…)</Label>
                  </div>
                  {armonizacion.trastornos_neurologicos && (
                    <Input value={armonizacion.trastornos_neurologicos_detalle} onChange={(e) => setArmo("trastornos_neurologicos_detalle", e.target.value)} placeholder="Especificar" className="ml-6 max-w-sm" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="armo_cicatrizacion" checked={armonizacion.cicatrizacion_problemas}
                    onChange={(e) => setArmo("cicatrizacion_problemas", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="armo_cicatrizacion">Problemas de cicatrización o tendencia a formar queloides</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="armo_embarazo" checked={armonizacion.embarazo_lactancia}
                    onChange={(e) => setArmo("embarazo_lactancia", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="armo_embarazo">Embarazada o en período de lactancia</Label>
                </div>
              </div>
            </FormSection>

            {/* [4] Medicamentos */}
            <FormSection title="Medicamentos y suplementos actuales">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Medicamentos actuales</Label>
                  <Textarea
                    value={armonizacion.medicamentos_actuales}
                    onChange={(e) => setArmo("medicamentos_actuales", e.target.value)}
                    placeholder="Nombre, dosis, frecuencia..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Suplementos, vitaminas o productos naturales</Label>
                  <Textarea
                    value={armonizacion.suplementos}
                    onChange={(e) => setArmo("suplementos", e.target.value)}
                    placeholder="Vitamina C, omega 3, colágeno..."
                    rows={3}
                  />
                </div>
              </div>
            </FormSection>

            {/* [5] Antecedentes quirúrgicos / estéticos */}
            <FormSection title="Antecedentes quirúrgicos y estéticos">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Cirugías recientes</Label>
                  <Input
                    value={armonizacion.cirugias_recientes}
                    onChange={(e) => setArmo("cirugias_recientes", e.target.value)}
                    placeholder="Tipo y fecha aproximada"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tratamientos estéticos previos (rellenos, toxina botulínica, hilos, láser, peelings profundos…)</Label>
                  <Textarea
                    value={armonizacion.tratamientos_esteticos_previos}
                    onChange={(e) => setArmo("tratamientos_esteticos_previos", e.target.value)}
                    placeholder="Describir producto, zona y resultado..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha del último tratamiento</Label>
                  <Input
                    value={armonizacion.ultimo_tratamiento}
                    onChange={(e) => setArmo("ultimo_tratamiento", e.target.value)}
                    placeholder="Ej: hace 6 meses"
                  />
                </div>
              </div>
            </FormSection>

            {/* [6] Hábitos y estilo de vida */}
            <FormSection title="Hábitos y estilo de vida">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="armo_fuma" checked={armonizacion.fuma}
                    onChange={(e) => setArmo("fuma", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="armo_fuma">Fuma</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="armo_alcohol" checked={armonizacion.alcohol}
                    onChange={(e) => setArmo("alcohol", e.target.checked)} className="h-4 w-4 accent-primary" />
                  <Label htmlFor="armo_alcohol">Consume alcohol</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Exposición solar frecuente</Label>
                    <Input
                      value={armonizacion.exposicion_solar}
                      onChange={(e) => setArmo("exposicion_solar", e.target.value)}
                      placeholder="Frecuencia y uso de protector solar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rutina de cuidado facial habitual</Label>
                    <Input
                      value={armonizacion.rutina_facial}
                      onChange={(e) => setArmo("rutina_facial", e.target.value)}
                      placeholder="Limpiador, hidratante, sérum…"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* [7] Examen físico facial */}
            <FormSection title="Examen físico facial">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Simetría facial</Label>
                  <Input value={armonizacion.simetria_facial} onChange={(e) => setArmo("simetria_facial", e.target.value)} placeholder="Simétrico / Asimétrico + observaciones" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tonicidad y calidad de la piel</Label>
                  <Input value={armonizacion.tonicidad_piel} onChange={(e) => setArmo("tonicidad_piel", e.target.value)} placeholder="Flácida, firme, hidratada, fotoenvejec…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Volúmenes faciales</Label>
                  <Input value={armonizacion.volumenes_faciales} onChange={(e) => setArmo("volumenes_faciales", e.target.value)} placeholder="Pérdida de volumen, asimetrías…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Movilidad muscular</Label>
                  <Input value={armonizacion.movilidad_muscular} onChange={(e) => setArmo("movilidad_muscular", e.target.value)} placeholder="Normal, disminuida, hiperkinética…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrugas estáticas y dinámicas</Label>
                  <Input value={armonizacion.arrugas} onChange={(e) => setArmo("arrugas", e.target.value)} placeholder="Zona y grado (leve / moderado / severo)" />
                </div>
                <div className="space-y-1.5">
                  <Label>Presencia de</Label>
                  <Input value={armonizacion.presencia_de} onChange={(e) => setArmo("presencia_de", e.target.value)} placeholder="Manchas, cicatrices, lesiones activas…" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Estado de labios, surcos, pómulos y mentón</Label>
                  <Textarea value={armonizacion.estado_labios_surcos} onChange={(e) => setArmo("estado_labios_surcos", e.target.value)} placeholder="Observaciones detalladas por zona…" rows={3} />
                </div>
              </div>
            </FormSection>

            {/* [8] Consentimiento / Firma */}
            <FormSection title="Consentimiento informado">
              <p className="text-sm text-muted-foreground leading-relaxed">
                He sido informado/a de los beneficios, posibles complicaciones, cuidados post-tratamiento y expectativas realistas del tratamiento.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label>Firma del paciente</Label>
                  <Input value={armonizacion.firma_paciente} onChange={(e) => setArmo("firma_paciente", e.target.value)} placeholder="Nombre y apellido" />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" value={armonizacion.fecha_consentimiento} onChange={(e) => setArmo("fecha_consentimiento", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notas adicionales</Label>
                <Textarea value={armonizacion.notas_adicionales} onChange={(e) => setArmo("notas_adicionales", e.target.value)} placeholder="Observaciones del profesional, plan de sesiones, próximo control…" rows={4} className="resize-y" />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── PERIODONCIA ── */}
          <TabsContent value="perio" className="space-y-4">
            <FormSection title="Notas de Periodoncia">
              <Textarea
                value={perio}
                onChange={(e) => setPerio(e.target.value)}
                placeholder="Diagnóstico periodontal, profundidad de bolsas, movilidad dentaria, plan de tratamiento, evolución..."
                rows={10}
                className="resize-y"
              />
            </FormSection>
          </TabsContent>

          {/* ── ALIMENTACIÓN (niño) ── */}
          {patientType === "nino" && (
            <TabsContent value="alimentacion" className="space-y-4">
              <FormSection title="Tipo de lactancia">
                <RadioGroupField
                  name="breastfeeding_type"
                  value={feedingHistory.breastfeeding_type}
                  onChange={(v) => patchSection(setFeedingHistory, "breastfeeding_type", v)}
                  options={[
                    { value: "maternal", label: "Materna exclusiva (pecho)" },
                    { value: "formula",  label: "Fórmula o Artificial" },
                    { value: "mixed",    label: "Mixta (pecho y fórmula)" },
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
                    { value: "3months", label: "3 meses" }, { value: "6months", label: "6 meses" },
                    { value: "1year",   label: "1 año" },   { value: "1.5years", label: "1 año y medio" },
                    { value: "2years",  label: "2 años" },  { value: "2.5years", label: "2 años y medio" },
                    { value: "3years",  label: "3 años" },  { value: "other",    label: "Otro" },
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

          {/* ── DIETA (niño) ── */}
          {patientType === "nino" && (
            <TabsContent value="dieta" className="space-y-4">
              <FormSection title="Alimentos preferidos">
                <CheckboxGroup items={[
                  { key: "cakes",          label: "Tortas" },        { key: "cookies",        label: "Galletitas" },
                  { key: "flan",           label: "Flan" },          { key: "homemade_sweets", label: "Dulces caseros" },
                  { key: "condensed_milk", label: "Leche condensada" }, { key: "excess_sugar",   label: "Azúcar en exceso" },
                  { key: "pasta",          label: "Pastas" },        { key: "gum",            label: "Chicles" },
                  { key: "candy",          label: "Caramelos" },     { key: "chocolate",      label: "Chocolates" },
                  { key: "lollipops",      label: "Chupetines" },    { key: "sodas",          label: "Gaseosas" },
                  { key: "juice_boxes",    label: "Jugos en cajas" },
                ]} values={dietRecord.preferred_foods} onChange={(k, v) => patchNested(setDietRecord as any, "preferred_foods", k, v)} columns={3} />
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
                                      weekly_diet: { ...p.weekly_diet, [day]: { ...p.weekly_diet[day], [meal]: e.target.value } },
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

          {/* ── EXTRA TABS (e.g. Consentimiento) ── */}
          {extraTabs?.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }
)
