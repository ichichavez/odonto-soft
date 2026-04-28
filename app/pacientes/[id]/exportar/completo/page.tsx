"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { patientService } from "@/services/patients"
import { dentalRecordService } from "@/services/dental-records"
import { prescriptionService } from "@/services/prescriptions"
import { appointmentService } from "@/services/appointments"
import { budgetService } from "@/services/budgets"
import { treatmentPlanService } from "@/services/treatment-plan"
import { useClinic } from "@/context/clinic-context"

// ── helpers ──────────────────────────────────────────────────────────

function calcAge(birth: string): number {
  const d = new Date(birth)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--
  return age
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtCurrency(n: number) {
  return `₲ ${n.toLocaleString("es-PY")}`
}

function trueLabelList(obj: Record<string, any>, labelMap: Record<string, string>): string {
  return Object.entries(obj)
    .filter(([k, v]) => v === true && labelMap[k])
    .map(([k]) => labelMap[k])
    .join(", ") || "Ninguno"
}

function val(v: any): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Sí" : "No"
  return String(v)
}

const DISEASE_LABELS: Record<string, string> = {
  tuberculosis: "Tuberculosis", leprosy: "Lepra", cardiac: "Enf. Cardíacas",
  sexual_diseases: "Enf. Sexuales", asthma: "Asma", hepatitis: "Hepatitis",
  hypertension: "Hiper. Arterial", malaria: "Malaria", allergy: "Alergia",
  aids: "SIDA", chagas: "Enf. de Chagas", psychiatric: "Disturbios Psíquicos",
  rheumatic_fever: "Fiebre Reumática", seizures: "Convulsiones", epilepsy: "Epilepsia",
  fainting: "Desmayos", sinusitis: "Sinusitis", coagulation_problems: "Probl. de coagulación",
  anemia: "Anemia", diabetes: "Diabetes", hemophilia: "Hemofilia", ulcers: "Úlceras",
}

const Q_LABELS: Record<string, string> = {
  si: "Sí", no: "No",
  horas: "Horas", dias: "Días", semanas: "Semanas", meses: "Meses", anos: "Año/s", nunca: "Nunca molestó",
  solo: "Solo", provocado: "Provocado", primero_provocado: "Primero provocado, luego espontáneo",
  continuo: "Continuo", intermitente: "Intermitente", primero_intermitente: "Primero intermitente, luego continuo",
  fugaz: "Fugaz", persistente: "Persistente", primero_fugaz: "Primero fugaz, ahora persiste",
  agudo: "Agudo", sordo: "Sordo", punzante: "Punzante",
  leve: "Leve", moderado: "Moderado", severo: "Severo",
  frio: "Frío", caliente: "Caliente", ninguno: "Ninguno", ambos: "Ambos",
  superficial: "Superficial", media: "Media", profunda: "Profunda", pulpa_expuesta: "Pulpa expuesta",
  oze: "OZE", resina: "Resina", amalgama: "Amalgama", incrustacion: "Incrustación",
  corona: "Corona", perno_corona: "Perno-Corona", corona_cariada: "Corona Cariada s/ Rest.",
  ausente: "Ausente", presente: "Presente",
  erosion: "Erosión", abrasion: "Abrasión", atricion: "Atrición",
  esmalte: "Esmalte", esmalte_dentina: "Esmalte/Dentina",
  esmalte_dentina_pulpa: "Esmalte/Dentina/Pulpa", cambio_color: "Cambio de color",
  presencia_dolor: "Presencia de dolor", ausencia_dolor: "Ausencia de dolor",
  ausencia_estimulo: "Ausencia de estímulo", alivio: "Alivio", estimulo: "Estímulo",
  inicial: "Inicial", en_evolucion: "En evolución", evolucionado: "Evolucionado",
  local: "Local", facial: "Facial", antecedentes: "Antecedentes",
}

function labelOf(v: string) {
  return Q_LABELS[v] ?? v
}

// ── Section / Row helpers ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-1 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 ml-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "—") return null
  return (
    <p className="text-sm mb-0.5">
      <span className="font-semibold">{label}: </span>
      <span>{value}</span>
    </p>
  )
}

function RowAlways({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="text-sm mb-0.5">
      <span className="font-semibold">{label}: </span>
      <span>{value || "—"}</span>
    </p>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">{children}</div>
}

function CheckRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return <Row label={label} value={items.join(", ")} />
}

// ── Page ─────────────────────────────────────────────────────────────

export default function ExportarCompletoPage() {
  const params = useParams() as { id: string }
  const { clinic } = useClinic()
  const [patient, setPatient] = useState<any>(null)
  const [record, setRecord] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [planItems, setPlanItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      patientService.getById(params.id),
      dentalRecordService.getByPatient(params.id).catch(() => null),
      prescriptionService.getByPatient(params.id).catch(() => []),
      appointmentService.getAll().catch(() => []),
      budgetService.getAll().catch(() => []),
      treatmentPlanService.getByPatient(params.id).catch(() => []),
    ]).then(([pat, rec, rxs, apps, buds, plan]) => {
      setPatient(pat)
      setRecord(rec)
      setPrescriptions(rxs)
      setAppointments((apps as any[]).filter((a: any) => a.patient_id === params.id))
      setBudgets((buds as any[]).filter((b: any) => b.patient_id === params.id))
      setPlanItems(plan)
    }).catch(console.error).finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!patient) return <div className="p-8 text-center text-muted-foreground">Paciente no encontrado.</div>

  const med: any = record?.medical_history ?? {}
  const dent: any = record?.dental_history ?? {}
  const extraOral: any = record?.extra_oral_exam ?? {}
  const intraOral: any = record?.intra_oral_exam ?? {}
  const habits: any = record?.habits ?? {}
  const treatmentsDone: any[] = (record?.treatments_done as any[]) ?? []
  const specialty: any = record?.specialty_notes ?? {}
  const endo: any = specialty?.endodoncia ?? {}
  const perio: any = specialty?.perio ?? {}
  const orto: any = specialty?.ortodoncia ?? {}
  const armo: any = specialty?.armonizacion ?? {}

  // helpers para endodoncia
  const endoChecks = (keys: string[]) =>
    keys.filter((k) => endo[k] === true).map((k) => {
      const LABELS: Record<string, string> = {
        camara_normal: "Normal", camara_amplia: "Amplia", camara_nodulos: "Nódulos de calcificación",
        camara_cariada: "Cariada", camara_estrecha: "Estrecha", camara_calcificada: "Calcificada",
        cond_V: "V", cond_P: "P", cond_MV: "MV", cond_ML: "ML", cond_DV: "DV", cond_DL: "DL",
        cond_D: "D", cond_unico: "Único", cond_foramen_unico: "Foramen Único",
        cond_normal: "Normal/es", cond_amplio: "Amplio/s", cond_estrecho: "Estrecho/s",
        cond_calcificado: "Calcificado/s", cond_obturado: "Obturado/s",
        cond_recto: "Recto/s", cond_curvo: "Curvo/s", cond_acodado: "Acodado/s",
        cond_bayoneta: "Bayoneta/s", cond_bifurcado: "Bifurcado/s",
        apice_formado: "Totalmente Formado", apice_incompleto: "Incompleto",
        apice_reabs_interna: "Reabsorción Interna", apice_reabs_externa: "Reabsorción Externa",
        periodonto_normal: "Periodonto Normal", periodonto_ensanchado: "Periodonto Ensanchado",
        zona_circular: "Circular", zona_difusa: "Difusa",
        diag_pulpitis_reversible: "Pulpitis Reversible",
        diag_pulpitis_irreversible: "Pulpitis Irreversible",
        diag_pi_sintomatica: "sintomática", diag_pi_asintomatica: "asintomática",
        diag_motivos_protesicos: "Motivos Protésicos",
        diag_necrosis: "Necrosis pulpar",
        diag_periodontitis_apical: "Periodontitis apical",
        diag_pa_sintomatica: "sintomática", diag_pa_asintomatica: "asintomática",
        trat_biopulp_parcial: "Biopulpectomía Parcial (Pulpotomía)",
        trat_biopulp_total: "Biopulpectomía Total",
        trat_necropulp_i: "Necropulpectomía I",
        trat_necropulp_ii: "Necropulpectomía II",
      }
      return LABELS[k] ?? k
    })

  const hasEndo = endo.diente || endo.q1_molestia || endo.caries_profundidad || endo.diag_pulpitis_reversible
    || endo.diag_pulpitis_irreversible || endo.diag_necrosis || endo.diag_periodontitis_apical

  const hasPerio = perio.motivo || perio.diag_clinico || perio.pron_general

  const hasOrto = orto.motivo_consulta || orto.diagnostico_esqueletal || orto.plan_tratamiento

  const hasArmo = armo.que_mejorar || armo.simetria_facial || armo.firma_paciente

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #export-print, #export-print * { visibility: visible; }
          #export-print { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; font-family: serif; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 4px 8px; font-size: 11px; }
          th { background: #f5f5f5; font-weight: bold; }
        }
      `}</style>

      {/* Nav */}
      <div className="flex items-center gap-4 p-6 no-print">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold flex-1">Historial Completo</h1>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </Button>
      </div>

      {/* Documento */}
      <div id="export-print" className="max-w-3xl mx-auto border rounded-lg p-8 bg-white text-gray-900 space-y-5 mx-6 mb-10">

        {/* Encabezado clínica */}
        <div className="flex items-start gap-4 border-b pb-4">
          {clinic?.logo_url && (
            <Image src={clinic.logo_url} alt="Logo" width={60} height={60} className="object-contain shrink-0" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
            {clinic?.doctor_name && <p className="text-sm font-medium text-gray-700">{clinic.doctor_name}</p>}
            {(clinic?.specialty || clinic?.professional_registration) && (
              <p className="text-sm text-gray-600">{[clinic?.specialty, clinic?.professional_registration].filter(Boolean).join(" · ")}</p>
            )}
            {clinic?.address && <p className="text-sm text-gray-500">{clinic.address}</p>}
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-sm">HISTORIAL COMPLETO</p>
            <p>Emitido: {fmtDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* ── 1. Datos Personales ── */}
        <Section title="Datos Personales">
          <Grid2>
            <RowAlways label="Nombre" value={`${patient.first_name} ${patient.last_name}`} />
            <Row label="C.I." value={patient.identity_number} />
            <Row label="Fecha de nacimiento" value={fmtDate(patient.birth_date)} />
            {patient.birth_date && <Row label="Edad" value={`${calcAge(patient.birth_date)} años`} />}
            <Row label="Sexo" value={patient.gender} />
            <Row label="Estado civil" value={patient.marital_status} />
            <Row label="Teléfono" value={patient.phone} />
            <Row label="Celular" value={patient.secondary_phone} />
            <Row label="Email" value={patient.email} />
            <Row label="Dirección" value={patient.address} />
            <Row label="Barrio" value={patient.barrio} />
            <Row label="Ciudad" value={patient.ciudad} />
            {patient.patient_type !== "nino" && (
              <>
                <Row label="Profesión" value={patient.profession} />
                <Row label="Tel. laboral" value={patient.work_phone} />
                <Row label="Dir. laboral" value={patient.work_address} />
              </>
            )}
          </Grid2>
          {patient.patient_type === "nino" && (patient.guardian_name || patient.guardian_phone) && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Encargado / Tutor</p>
              <Grid2>
                <Row label="Nombre" value={patient.guardian_name} />
                <Row label="C.I." value={patient.guardian_identity_number} />
                <Row label="Relación" value={patient.guardian_relationship} />
                <Row label="Teléfono" value={patient.guardian_phone} />
              </Grid2>
            </div>
          )}
          {record?.consultation_date && <Row label="Fecha de consulta" value={fmtDate(record.consultation_date)} />}
          {record?.reason_of_visit?.length > 0 && (
            <Row label="Motivo de consulta" value={[...(record.reason_of_visit ?? []), record.reason_other].filter(Boolean).join(", ")} />
          )}
          <Row label="Derivado por" value={record?.referred_by} />
        </Section>

        {/* ── 2. Historia Médica ── */}
        <Section title="Historia Médica">
          {med.under_medical_treatment && <Row label="Tratamiento médico actual" value={med.treatment_duration || "Sí"} />}
          {med.taking_medication && <Row label="Medicamentos actuales" value={med.medication_detail || "Sí"} />}
          {med.diseases && <RowAlways label="Enfermedades" value={trueLabelList(med.diseases, DISEASE_LABELS)} />}
          {med.diseases?.other && med.diseases?.other_detail && <Row label="Otras enfermedades" value={med.diseases.other_detail} />}
          {med.had_surgery && <Row label="Cirugías previas" value={med.surgery_detail || "Sí"} />}
          {med.bleeds_excessively && <RowAlways label="Sangrado excesivo" value="Sí" />}
          {med.smokes && <Row label="Tabaquismo" value={[med.smoking_duration, med.cigarettes_per_day && `${med.cigarettes_per_day} cig/día`].filter(Boolean).join(", ") || "Sí"} />}
          {med.drinks_alcohol && <Row label="Alcohol" value={med.alcohol_duration || "Sí"} />}
          {med.pregnant && <Row label="Embarazo" value={med.pregnancy_duration || "Sí"} />}
          <RowAlways label="Tolera anestesia" value={med.tolerates_anesthesia === false ? "No" : med.never_had_anesthesia ? "Nunca le aplicaron" : "Sí"} />
        </Section>

        {/* ── 3. Historia Dental ── */}
        {dent && Object.keys(dent).length > 0 && (
          <Section title="Historia Dental">
            <Row label="Última visita al odontólogo" value={dent.last_dentist_visit} />
            {dent.has_tooth_loss && <Row label="Pérdida dentaria" value={dent.tooth_loss_reason || "Sí"} />}
            <Row label="Frecuencia de cepillado" value={dent.brushing_frequency} />
            <RowAlways label="Elementos de higiene" value={[
              dent.hygiene_brush && "Cepillo",
              dent.hygiene_floss && "Hilo dental",
              dent.hygiene_mouthwash && "Enjuague",
              dent.hygiene_other && "Otros",
            ].filter(Boolean).join(", ") || "—"} />
          </Section>
        )}

        {/* ── 4. Examen Extra Oral ── */}
        {extraOral && Object.keys(extraOral).length > 0 && (
          <Section title="Examen Extra Oral">
            {extraOral.atm && <RowAlways label="ATM" value={trueLabelList(extraOral.atm, {
              pain_palpation: "Dolor a la palpación", pain_opening: "Dolor en apertura",
              pain_closing: "Dolor en cierre", joint_noise: "Ruido articular", no_issues: "Sin molestias",
            })} />}
            {extraOral.face && <RowAlways label="Cara" value={trueLabelList(extraOral.face, {
              asymmetric_front: "Asimétrica", convex_profile: "Perfil convexo",
              concave_profile: "Perfil cóncavo", straight_profile: "Perfil recto", no_particularities: "Sin particularidades",
            })} />}
            {extraOral.lips && <RowAlways label="Labios" value={trueLabelList(extraOral.lips, {
              short: "Cortos", normal: "Normales", dry_cracked: "Secos/agrietados",
              injured_commissures: "Comisuras lastimadas", labial_incompetence: "Incompetencia labial",
            })} />}
            {extraOral.lymph_nodes && <RowAlways label="Ganglios" value={trueLabelList(extraOral.lymph_nodes, {
              no_particularities: "Sin particularidades", enlarged: "Aumento de tamaño",
            })} />}
          </Section>
        )}

        {/* ── 5. Examen Intra Oral ── */}
        {intraOral && Object.keys(intraOral).length > 0 && (
          <Section title="Examen Intra Oral">
            {intraOral.gums && <RowAlways label="Encías" value={trueLabelList(intraOral.gums, {
              localized_gingivitis: "Gingivitis localizada", generalized_gingivitis: "Gingivitis generalizada",
              healthy: "Sana", periodontal_pockets: "Bolsas periodontales",
            })} />}
            {intraOral.tongue && <RowAlways label="Lengua" value={trueLabelList(intraOral.tongue, {
              no_anomalies: "Sin anomalías", short_frenulum: "Frenillo corto", geographic: "Geográfica", coated: "Saburral",
            })} />}
            {intraOral.hard_palate && <RowAlways label="Paladar duro" value={trueLabelList(intraOral.hard_palate, {
              normal_size: "Tamaño normal", normal_shape: "Forma normal", color_anomaly: "Anomalía de color",
              ulcers: "Úlceras", torus: "Torus palatino",
            })} />}
            {intraOral.pharynx && <RowAlways label="Faringe" value={trueLabelList(intraOral.pharynx, {
              normal: "Normal", grade1: "Grado 1", grade2: "Grado 2", grade3: "Grado 3",
              grade4: "Grado 4", surgically_removed: "Extirpado quirúrgicamente",
            })} />}
            {intraOral.occlusion_mixed_permanent && <RowAlways label="Oclusión" value={trueLabelList(intraOral.occlusion_mixed_permanent, {
              class1: "Clase I", class2: "Clase II", class3: "Clase III",
            })} />}
            {intraOral.bite_type && <RowAlways label="Mordida" value={trueLabelList(intraOral.bite_type, {
              normal: "Normal", anterior_crossbite: "Cruzada anterior", posterior_crossbite: "Cruzada posterior",
              anterior_open_bite: "Abierta anterior", scissor_bite: "En tijera",
            })} />}
          </Section>
        )}

        {/* ── 6. Hábitos ── */}
        {habits && Object.keys(habits).length > 0 && (
          <Section title="Hábitos">
            <RowAlways label="Hábitos" value={trueLabelList(habits, {
              finger_sucking: "Chuparse el dedo", nail_biting: "Onicofagia", pencil_biting: "Morder lápices",
              pen_biting: "Morder bolígrafos", lip_interposition: "Interposición labial", no_bad_habits: "Sin malos hábitos",
            })} />
            <Row label="Apertura bucal" value={habits.mouth_opening} />
            <Row label="Respiración" value={habits.breathing} />
            <Row label="Deglución" value={habits.swallowing} />
          </Section>
        )}

        {/* ── 7. Endodoncia ── */}
        {hasEndo && (
          <Section title="Endodoncia">
            {endo.diente && <RowAlways label="Diente N°" value={endo.diente} />}

            <SubSection title="Historia Odontológica">
              {([
                ["q1_molestia", "Molestia actual"],
                ["q2_senalar_diente", "Señala el diente"],
                ["q3_inicio_dolor", "Inicio del dolor"],
                ["q4_tipo_aparicion", "Aparición del dolor"],
                ["q5_continuidad", "Continuidad"],
                ["q6_duracion", "Duración"],
                ["q7_tipo_dolor", "Tipo de dolor"],
                ["q8_intensidad", "Intensidad"],
                ["q9_sensibilidad", "Sensibilidad térmica"],
                ["q10_morder", "Dolor al morder"],
                ["q11_alrededor", "Dolor en zona alrededor"],
                ["q12_tratamiento_conducto", "Trat. de conducto previo"],
                ["q13_restauracion", "Restauración reciente"],
                ["q14_impide_actividades", "Impide dormir/actividades"],
                ["q15_medicamento", "Tomó medicamento"],
              ] as [string, string][]).map(([key, label]) =>
                endo[key] ? <Row key={key} label={label} value={labelOf(endo[key])} /> : null
              )}
              {endo.q1_motivo && <Row label="Motivo de molestia" value={endo.q1_motivo} />}
              {endo.q15_cual && <Row label="Medicamento" value={endo.q15_cual} />}
              {endo.q15_efecto && <Row label="Efecto del medicamento" value={labelOf(endo.q15_efecto)} />}
            </SubSection>

            <SubSection title="Examen Clínico — Inspección">
              <Row label="Caries (profundidad)" value={labelOf(endo.caries_profundidad)} />
              <Row label="Material protector" value={labelOf(endo.material_protector)} />
              <Row label="Trauma oclusal" value={labelOf(endo.trauma_oclusal)} />
              <Row label="Traumatismo" value={labelOf(endo.traumatismo)} />
              <Row label="Enf. periodontal" value={labelOf(endo.enf_periodontal)} />
              <Row label="Bolsa periodontal" value={labelOf(endo.bolsa_periodontal)} />
              {endo.bolsa_localizacion && <Row label="Localización bolsa" value={endo.bolsa_localizacion} />}
              {endo.bolsa_profundidad && <Row label="Profundidad bolsa" value={endo.bolsa_profundidad} />}
              <Row label="Percusión vertical" value={labelOf(endo.percusion_vertical)} />
              <Row label="Percusión horizontal" value={labelOf(endo.percusion_horizontal)} />
            </SubSection>

            <SubSection title="Palpación">
              <Row label="Movilidad" value={labelOf(endo.movilidad)} />
              <Row label="Apical" value={labelOf(endo.apical)} />
              {endo.edema && <Row label="Edema" value={[labelOf(endo.edema), labelOf(endo.edema_estado), labelOf(endo.edema_ubicacion)].filter(Boolean).join(" · ")} />}
              <Row label="Fístula" value={labelOf(endo.fistula)} />
            </SubSection>

            <SubSection title="Test de Vitalidad">
              <Row label="Frío" value={labelOf(endo.test_frio)} />
              <Row label="Test de cavidad" value={labelOf(endo.test_cavidad)} />
              <Row label="Test de anestesia" value={labelOf(endo.test_anestesia)} />
            </SubSection>

            <SubSection title="Examen Radiográfico">
              <CheckRow label="Cámara pulpar" items={endoChecks(["camara_normal","camara_amplia","camara_nodulos","camara_cariada","camara_estrecha","camara_calcificada"])} />
              <CheckRow label="Conductos presentes" items={endoChecks(["cond_V","cond_P","cond_MV","cond_ML","cond_DV","cond_DL","cond_D","cond_unico","cond_foramen_unico"])} />
              <CheckRow label="Características" items={endoChecks(["cond_normal","cond_amplio","cond_estrecho","cond_calcificado","cond_obturado","cond_recto","cond_curvo","cond_acodado","cond_bayoneta","cond_bifurcado"])} />
              <CheckRow label="Ápice" items={endoChecks(["apice_formado","apice_incompleto","apice_reabs_interna","apice_reabs_externa"])} />
              <CheckRow label="Periodonto" items={endoChecks(["periodonto_normal","periodonto_ensanchado"])} />
              <CheckRow label="Zona radiolúcida" items={endoChecks(["zona_circular","zona_difusa"])} />
            </SubSection>

            <SubSection title="Diagnóstico Clínico Probable">
              <RowAlways label="Diagnóstico" value={endoChecks([
                "diag_pulpitis_reversible","diag_pulpitis_irreversible","diag_pi_sintomatica","diag_pi_asintomatica",
                "diag_motivos_protesicos","diag_necrosis","diag_periodontitis_apical","diag_pa_sintomatica","diag_pa_asintomatica",
              ]).join(", ") || "—"} />
            </SubSection>

            <SubSection title="Tratamiento Indicado">
              <RowAlways label="Tratamiento" value={endoChecks([
                "trat_biopulp_parcial","trat_biopulp_total","trat_necropulp_i","trat_necropulp_ii",
              ]).join(", ") || "—"} />
            </SubSection>

            {/* Odontometría */}
            {endo.odontometria?.some((r: any) => r.conducto) && (
              <SubSection title="Odontometría">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Conducto","Long. Radiográfica","Referencia","Penetración Inst.","Long. Trabajo"].map((h) => (
                        <th key={h} className="border border-gray-200 px-2 py-1 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {endo.odontometria.filter((r: any) => r.conducto).map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-2 py-0.5">{r.conducto}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.long_radiografica || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.referencia || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.penetracion_inst || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.long_trabajo || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SubSection>
            )}

            {/* Preparación Q-M */}
            {endo.preparacion?.some((r: any) => r.conducto) && (
              <SubSection title="Preparación Químico-Mecánica">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Conducto","Progresión Instrumentos","Inst. Inicial","Inst. Memoria","Inst. Final"].map((h) => (
                        <th key={h} className="border border-gray-200 px-2 py-1 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {endo.preparacion.filter((r: any) => r.conducto).map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-2 py-0.5">{r.conducto}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.progresion || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.inst_inicial || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.inst_memoria || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.inst_final || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SubSection>
            )}

            {/* Obturación */}
            {endo.obturacion?.some((r: any) => r.conducto) && (
              <SubSection title="Obturación">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Conducto","Técnica y Material","Cemento","Cono Principal","Conos Accesorios"].map((h) => (
                        <th key={h} className="border border-gray-200 px-2 py-1 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {endo.obturacion.filter((r: any) => r.conducto).map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-2 py-0.5">{r.conducto}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.tecnica_material || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.cemento || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.cono_principal || "—"}</td>
                        <td className="border border-gray-200 px-2 py-0.5">{r.conos_accesorios || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SubSection>
            )}

            {endo.observaciones && <Row label="Observaciones" value={endo.observaciones} />}
          </Section>
        )}

        {/* ── 8. Periodoncia ── */}
        {hasPerio && (
          <Section title="Periodoncia">
            <Row label="Fecha" value={fmtDate(perio.fecha)} />
            <Row label="Fase" value={perio.fase} />
            <Row label="N° Ficha" value={perio.num_ficha} />
            <Row label="Motivo de consulta" value={perio.motivo} />
            <Row label="Hábitos nocivos" value={perio.habitos} />
            {perio.fuma && <Row label="Fuma" value={[perio.fuma, perio.fuma_cant].filter(Boolean).join(", ")} />}
            <Row label="Enfermedades sistémicas" value={perio.enf_sistemicas} />
            <Row label="Medicación" value={perio.medicacion} />
            <Row label="Biotipo periodontal" value={perio.biotipo} />
            <Row label="Diagnóstico clínico" value={perio.diag_clinico} />
            <Row label="Etiología" value={perio.etiologia} />
            <Row label="Diagnóstico radiográfico" value={perio.diag_radio} />
            {perio.pron_general && <Row label="Pronóstico general" value={perio.pron_general} />}
            {perio.pron_individual && <Row label="Pronóstico individual" value={perio.pron_individual} />}
            {perio.plan_fase2 && <Row label="Fase II (Quirúrgica)" value={perio.plan_fase2} />}
            {perio.plan_fase3 && <Row label="Fase III (Rehabilitación)" value={perio.plan_fase3} />}
            {perio.plan_fase4 && <Row label="Fase IV (Mantenimiento)" value={perio.plan_fase4} />}
          </Section>
        )}

        {/* ── 9. Ortodoncia ── */}
        {hasOrto && (
          <Section title="Ortodoncia">
            <Row label="Motivo de consulta" value={orto.motivo_consulta} />
            <Row label="Diagnóstico esqueletal" value={orto.diagnostico_esqueletal} />
            <Row label="Diagnóstico dental" value={orto.diagnostico_dental} />
            <Row label="Plan de tratamiento" value={orto.plan_tratamiento} />
            <Row label="Aparato indicado" value={orto.aparato} />
            <Row label="Observaciones" value={orto.observaciones} />
          </Section>
        )}

        {/* ── 10. Armonización Orofacial ── */}
        {hasArmo && (
          <Section title="Armonización Orofacial">
            <Row label="¿Qué mejorar?" value={armo.que_mejorar} />
            <Row label="Resultado esperado" value={armo.resultado_esperado} />
            <Row label="Tratamientos previos" value={armo.tratamientos_previos} />
            {armo.enfermedad_cronica && <Row label="Enfermedad crónica" value={armo.enfermedad_cronica_detalle || "Sí"} />}
            {armo.alergias && <Row label="Alergias" value={armo.alergias_detalle || "Sí"} />}
            {armo.herpes && <RowAlways label="Herpes facial/perioral" value="Sí" />}
            {armo.anticoagulantes && <Row label="Anticoagulantes" value={armo.anticoagulantes_detalle || "Sí"} />}
            {armo.embarazo_lactancia && <RowAlways label="Embarazo/Lactancia" value="Sí" />}
            <Row label="Medicamentos actuales" value={armo.medicamentos_actuales} />
            <Row label="Simetría facial" value={armo.simetria_facial} />
            <Row label="Tonicidad piel" value={armo.tonicidad_piel} />
            <Row label="Volúmenes faciales" value={armo.volumenes_faciales} />
            <Row label="Arrugas" value={armo.arrugas} />
            <Row label="Estado labios/surcos" value={armo.estado_labios_surcos} />
            <Row label="Notas adicionales" value={armo.notas_adicionales} />
            {armo.firma_paciente && <Row label="Firmado por" value={`${armo.firma_paciente} — ${fmtDate(armo.fecha_consentimiento)}`} />}
          </Section>
        )}

        {/* ── 11. Tratamientos Realizados ── */}
        {treatmentsDone.length > 0 && (
          <Section title="Tratamientos Realizados">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-28">Fecha</th>
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-20">Diente</th>
                  <th className="text-left py-1 font-semibold text-gray-700">Tratamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {treatmentsDone.map((t, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-4">{fmtDate(t.date)}</td>
                    <td className="py-1 pr-4">{t.tooth || "—"}</td>
                    <td className="py-1">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ── 12. Plan de Tratamiento ── */}
        {planItems.length > 0 && (
          <Section title="Plan de Tratamiento">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-24">Fecha</th>
                  <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-16">Diente</th>
                  <th className="text-left py-1 pr-3 font-semibold text-gray-700">Tratamiento</th>
                  <th className="text-right py-1 pr-3 font-semibold text-gray-700 w-28">Costo</th>
                  <th className="text-right py-1 font-semibold text-gray-700 w-24">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {planItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 pr-3">{fmtDate(item.date)}</td>
                    <td className="py-1 pr-3">{item.tooth || "—"}</td>
                    <td className="py-1 pr-3">{item.description}</td>
                    <td className="py-1 pr-3 text-right">{fmtCurrency(item.cost)}</td>
                    <td className="py-1 text-right">{fmtCurrency(item.cost - item.payment)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-300 font-semibold">
                  <td colSpan={3} className="py-1 text-right text-gray-600">Total</td>
                  <td className="py-1 pr-3 text-right">{fmtCurrency(planItems.reduce((s, i) => s + i.cost, 0))}</td>
                  <td className="py-1 text-right">{fmtCurrency(planItems.reduce((s, i) => s + (i.cost - i.payment), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </Section>
        )}

        {/* ── 13. Recetas ── */}
        {prescriptions.length > 0 && (
          <Section title="Recetas Emitidas">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-28">Fecha</th>
                  <th className="text-left py-1 pr-3 font-semibold text-gray-700">Diagnóstico</th>
                  <th className="text-left py-1 font-semibold text-gray-700">Medicamentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id}>
                    <td className="py-1 pr-3 align-top">{fmtDate(rx.date)}</td>
                    <td className="py-1 pr-3 align-top">{rx.diagnosis || "—"}</td>
                    <td className="py-1 align-top whitespace-pre-wrap">{rx.prescription_text || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ── 14. Citas ── */}
        {appointments.length > 0 && (
          <Section title="Citas">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-28">Fecha</th>
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-16">Hora</th>
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700">Tratamiento</th>
                  <th className="text-left py-1 font-semibold text-gray-700 w-24">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-1 pr-4">{fmtDate(a.date)}</td>
                    <td className="py-1 pr-4">{a.time?.substring(0, 5) ?? "—"}</td>
                    <td className="py-1 pr-4">{a.treatments?.name || "Consulta general"}</td>
                    <td className="py-1 capitalize">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ── 15. Presupuestos ── */}
        {budgets.length > 0 && (
          <Section title="Presupuestos">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-24">N°</th>
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700 w-28">Fecha</th>
                  <th className="text-left py-1 pr-4 font-semibold text-gray-700">Total</th>
                  <th className="text-left py-1 font-semibold text-gray-700 w-24">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgets.map((b) => (
                  <tr key={b.id}>
                    <td className="py-1 pr-4">{b.number || "—"}</td>
                    <td className="py-1 pr-4">{fmtDate(b.date)}</td>
                    <td className="py-1 pr-4">{fmtCurrency(b.total)}</td>
                    <td className="py-1 capitalize">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Pie */}
        <div className="border-t pt-4 flex justify-between text-xs text-gray-400">
          <span>{clinic?.name}</span>
          <span>Historial generado el {fmtDate(new Date().toISOString())}</span>
        </div>
      </div>
    </>
  )
}
