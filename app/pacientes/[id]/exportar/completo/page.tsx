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
import { useClinic } from "@/context/clinic-context"

// ── helpers ─────────────────────────────────────────────────────────

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

const DISEASE_LABELS: Record<string, string> = {
  tuberculosis: "Tuberculosis", leprosy: "Lepra", cardiac: "Enf. Cardíacas",
  sexual_diseases: "Enf. Sexuales", asthma: "Asma", hepatitis: "Hepatitis",
  hypertension: "Hiper. Arterial", malaria: "Malaria", allergy: "Alergia",
  aids: "SIDA", chagas: "Enf. de Chagas", psychiatric: "Disturbios Psíquicos",
  rheumatic_fever: "Fiebre Reumática", seizures: "Convulsiones", epilepsy: "Epilepsia",
  fainting: "Desmayos", sinusitis: "Sinusitis", coagulation_problems: "Probl. de coagulación",
  anemia: "Anemia", diabetes: "Diabetes", hemophilia: "Hemofilia", ulcers: "Úlceras",
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

function Row({ label, value }: { label: string; value?: string | null }) {
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

// ── Page ─────────────────────────────────────────────────────────────

export default function ExportarCompletoPage() {
  const params = useParams() as { id: string }
  const { clinic } = useClinic()
  const [patient, setPatient] = useState<any>(null)
  const [record, setRecord] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      patientService.getById(params.id),
      dentalRecordService.getByPatient(params.id).catch(() => null),
      prescriptionService.getByPatient(params.id).catch(() => []),
      appointmentService.getAll().catch(() => []),
      budgetService.getAll().catch(() => []),
    ]).then(([pat, rec, rxs, apps, buds]) => {
      setPatient(pat)
      setRecord(rec)
      setPrescriptions(rxs)
      setAppointments((apps as any[]).filter((a: any) => a.patient_id === params.id))
      setBudgets((buds as any[]).filter((b: any) => b.patient_id === params.id))
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

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #export-print, #export-print * { visibility: visible; }
          #export-print { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; font-family: serif; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <div className="flex items-center gap-4 p-6 no-print">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold flex-1">Exportar Datos Completos</h1>
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
            <p className="font-semibold text-sm">DATOS COMPLETOS DEL PACIENTE</p>
            <p>Emitido: {fmtDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* ── 1. Datos Personales ── */}
        <Section title="Datos Personales">
          <Grid2>
            <Row label="Nombre" value={`${patient.first_name} ${patient.last_name}`} />
            <Row label="C.I." value={patient.identity_number} />
            <Row label="Fecha de nacimiento" value={fmtDate(patient.birth_date)} />
            {patient.birth_date && <Row label="Edad" value={`${calcAge(patient.birth_date)} años`} />}
            <Row label="Sexo" value={patient.gender} />
            <Row label="Estado civil" value={patient.marital_status} />
            <Row label="Teléfono" value={patient.phone} />
            <Row label="Celular" value={patient.secondary_phone} />
            <Row label="Email" value={patient.email} />
            <Row label="Dirección" value={patient.address} />
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
        </Section>

        {/* ── 2. Historia Médica ── */}
        <Section title="Historia Médica">
          {med.under_medical_treatment && (
            <Row label="Tratamiento médico actual" value={med.treatment_duration || "Sí"} />
          )}
          {med.taking_medication && (
            <Row label="Medicamentos actuales" value={med.medication_detail || "Sí"} />
          )}
          {med.diseases && (
            <Row label="Enfermedades" value={trueLabelList(med.diseases, DISEASE_LABELS)} />
          )}
          {med.diseases?.other && med.diseases?.other_detail && (
            <Row label="Otras enfermedades" value={med.diseases.other_detail} />
          )}
          {med.had_surgery && <Row label="Cirugías previas" value={med.surgery_detail || "Sí"} />}
          {med.bleeds_excessively && <Row label="Sangrado excesivo post-extracción" value="Sí" />}
          {med.smokes && <Row label="Tabaquismo" value={[med.smoking_duration, med.cigarettes_per_day && `${med.cigarettes_per_day} cig/día`].filter(Boolean).join(", ") || "Sí"} />}
          {med.drinks_alcohol && <Row label="Alcohol" value={med.alcohol_duration || "Sí"} />}
          {med.pregnant && <Row label="Embarazo" value={med.pregnancy_duration || "Sí"} />}
          <Row label="Tolera anestesia" value={med.tolerates_anesthesia === false ? "No" : med.never_had_anesthesia ? "Nunca le aplicaron" : "Sí"} />
        </Section>

        {/* ── 3. Historia Odontológica ── */}
        {dent && Object.keys(dent).length > 0 && (
          <Section title="Historia Odontológica">
            {dent.last_dentist_visit && <Row label="Última visita al odontólogo" value={dent.last_dentist_visit} />}
            {dent.has_tooth_loss && <Row label="Pérdida dentaria" value={dent.tooth_loss_reason || "Sí"} />}
            {dent.brushing_frequency && <Row label="Frecuencia de cepillado" value={dent.brushing_frequency} />}
            <Row label="Elementos de higiene" value={[
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
            {extraOral.atm && <Row label="ATM" value={trueLabelList(extraOral.atm, {
              pain_palpation: "Dolor a la palpación", pain_opening: "Dolor en apertura",
              pain_closing: "Dolor en cierre", joint_noise: "Ruido articular", no_issues: "Sin molestias",
            })} />}
            {extraOral.face && <Row label="Cara" value={trueLabelList(extraOral.face, {
              asymmetric_front: "Asimétrica", convex_profile: "Perfil convexo", concave_profile: "Perfil cóncavo",
              straight_profile: "Perfil recto", no_particularities: "Sin particularidades",
            })} />}
            {extraOral.lips && <Row label="Labios" value={trueLabelList(extraOral.lips, {
              short: "Cortos", normal: "Normales", dry_cracked: "Secos/agrietados",
              injured_commissures: "Comisuras lastimadas", labial_incompetence: "Incompetencia labial",
            })} />}
            {extraOral.lymph_nodes && <Row label="Ganglios" value={trueLabelList(extraOral.lymph_nodes, {
              no_particularities: "Sin particularidades", enlarged: "Aumento de tamaño",
            })} />}
          </Section>
        )}

        {/* ── 5. Examen Intra Oral ── */}
        {intraOral && Object.keys(intraOral).length > 0 && (
          <Section title="Examen Intra Oral">
            {intraOral.gums && <Row label="Encías" value={trueLabelList(intraOral.gums, {
              localized_gingivitis: "Gingivitis localizada", generalized_gingivitis: "Gingivitis generalizada",
              healthy: "Sana", periodontal_pockets: "Bolsas periodontales",
            })} />}
            {intraOral.tongue && <Row label="Lengua" value={trueLabelList(intraOral.tongue, {
              no_anomalies: "Sin anomalías", short_frenulum: "Frenillo corto", geographic: "Geográfica", coated: "Saburral",
            })} />}
            {intraOral.hard_palate && <Row label="Paladar duro" value={trueLabelList(intraOral.hard_palate, {
              normal_size: "Tamaño normal", normal_shape: "Forma normal", color_anomaly: "Anomalía de color",
              ulcers: "Úlceras", torus: "Torus palatino",
            })} />}
            {intraOral.pharynx && <Row label="Faringe" value={trueLabelList(intraOral.pharynx, {
              normal: "Normal", grade1: "Grado 1", grade2: "Grado 2", grade3: "Grado 3",
              grade4: "Grado 4", surgically_removed: "Extirpado quirúrgicamente",
            })} />}
            {intraOral.occlusion_mixed_permanent && <Row label="Oclusión" value={trueLabelList(intraOral.occlusion_mixed_permanent, {
              class1: "Clase I", class2: "Clase II", class3: "Clase III",
            })} />}
            {intraOral.bite_type && <Row label="Mordida" value={trueLabelList(intraOral.bite_type, {
              normal: "Normal", anterior_crossbite: "Cruzada anterior", posterior_crossbite: "Cruzada posterior",
              anterior_open_bite: "Abierta anterior", scissor_bite: "En tijera",
            })} />}
          </Section>
        )}

        {/* ── 6. Hábitos ── */}
        {habits && Object.keys(habits).length > 0 && (
          <Section title="Hábitos">
            <Row label="Hábitos" value={trueLabelList(habits, {
              finger_sucking: "Chuparse el dedo", nail_biting: "Onicofagia", pencil_biting: "Morder lápices",
              pen_biting: "Morder bolígrafos", lip_interposition: "Interposición labial", no_bad_habits: "Sin malos hábitos",
            })} />
            {habits.mouth_opening && <Row label="Apertura bucal" value={habits.mouth_opening} />}
            {habits.breathing && <Row label="Respiración" value={habits.breathing} />}
            {habits.swallowing && <Row label="Deglución" value={habits.swallowing} />}
          </Section>
        )}

        {/* ── 7. Tratamientos Realizados ── */}
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

        {/* ── 8. Recetas ── */}
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

        {/* ── 9. Citas ── */}
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

        {/* ── 10. Presupuestos ── */}
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
          <span>Documento generado el {fmtDate(new Date().toISOString())}</span>
        </div>
      </div>
    </>
  )
}
