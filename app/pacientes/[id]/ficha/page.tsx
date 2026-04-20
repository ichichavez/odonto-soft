"use client"

import { useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { dentalRecordService } from "@/services/dental-records"
import { consentService } from "@/services/consent"
import { patientService } from "@/services/patients"
import { consentTemplateService, type ConsentTemplate, SPECIALTY_LABELS } from "@/services/consent-templates"
import { FormSection } from "@/components/dental-record/form-section"
import {
  DentalRecordFormTabs,
  type DentalRecordFormHandle,
  type DentalFormData,
} from "@/components/dental-record/dental-record-form-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Clock, FileSignature, History, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function FichaOdontologicaPage() {
  const params   = useParams()
  const patientId = params.id as string
  const { toast } = useToast()
  const { user }  = useAuth()
  const { clinic } = useClinic()

  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [patientName, setPatientName] = useState("")
  const [history,     setHistory]     = useState<{ saved_at: string | null; saved_by_name: string | null }[]>([])

  // Consent state
  const [signedByName,     setSignedByName]     = useState("")
  const [signedByCi,       setSignedByCi]       = useState("")
  const [signingConsent,   setSigningConsent]   = useState(false)
  const [consentSigned,    setConsentSigned]    = useState(false)
  const [consentTemplates, setConsentTemplates] = useState<ConsentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("general")
  const [exportingPdf,     setExportingPdf]     = useState(false)

  // Dental form ref + initial data (key forces remount when data arrives)
  const dentalFormRef = useRef<DentalRecordFormHandle>(null)
  const [formInitialData, setFormInitialData] = useState<Partial<DentalFormData> | undefined>()
  const [dataKey, setDataKey] = useState(0)

  // ── Load ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [patient, record, hist, templates] = await Promise.all([
        patientService.getById(patientId).catch(() => null),
        dentalRecordService.getByPatient(patientId).catch(() => null),
        dentalRecordService.getHistory(patientId).catch(() => []),
        clinic?.id ? consentTemplateService.getByClinic(clinic.id).catch(() => []) : Promise.resolve([]),
      ])
      setConsentTemplates(templates)

      if (patient) setPatientName(`${patient.first_name} ${patient.last_name}`)
      setHistory(hist)

      if (record) {
        const def = {
          patientType:     (record.patient_type as "adulto" | "nino") ?? "adulto",
          consultationDate: record.consultation_date ?? new Date().toISOString().slice(0, 10),
          reasonOfVisit:   (record.reason_of_visit as string[]) ?? [],
          reasonOther:     record.reason_other ?? "",
          referredBy:      record.referred_by ?? "",
          profession:      record.profession ?? "",
          civilStatus:     record.civil_status ?? "",
          workAddress:     record.work_address ?? "",
          weight:          record.weight?.toString() ?? "",
          height:          record.height?.toString() ?? "",
          guardianName:    record.guardian_name ?? "",
          guardianPhone:   record.guardian_phone ?? "",
          feedingHistory:  (record.feeding_history as any) ?? undefined,
          dietRecord:      (record.diet_record as any) ?? undefined,
          extraOral:       (record.extra_oral_exam as any) ?? undefined,
          intraOral:       (record.intra_oral_exam as any) ?? undefined,
          habits:          (record.habits as any) ?? undefined,
          medicalHistory:  (record.medical_history as any) ?? undefined,
          dentalHistory:   (record.dental_history as any) ?? undefined,
          treatmentsDone:  (record as any).treatments_done ?? [],
          specialtyNotes:  (record as any).specialty_notes ?? undefined,
        } satisfies Partial<DentalFormData>

        setFormInitialData(def)
        setDataKey((k) => k + 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load() }, [load])

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const fd = dentalFormRef.current?.getData()
    if (!fd) return
    setSaving(true)
    try {
      await dentalRecordService.upsert(
        {
          patient_id:       patientId,
          clinic_id:        clinic?.id ?? null,
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
          specialty_notes:  fd.specialtyNotes,
        } as any,
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

  // ── Helpers de consentimiento ─────────────────────────────────────
  const getActiveConsentText = (): string | null => {
    if (selectedTemplate === "general") return clinic?.consent_template ?? null
    return consentTemplates.find((t) => t.id === selectedTemplate)?.content ?? null
  }

  const handleExportConsentPdf = async () => {
    const text = getActiveConsentText()
    if (!text) {
      toast({ title: "Sin texto", description: "Seleccioná una plantilla con contenido.", variant: "destructive" })
      return
    }
    setExportingPdf(true)
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxW = pageW - margin * 2
      let y = 20

      // Header
      if (clinic?.name) {
        doc.setFontSize(14).setFont("helvetica", "bold")
        doc.text(clinic.name, pageW / 2, y, { align: "center" })
        y += 8
      }
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text("CONSENTIMIENTO INFORMADO", pageW / 2, y, { align: "center" })
      y += 10

      // Patient
      doc.setFontSize(10).setFont("helvetica", "normal")
      doc.text(`Paciente: ${patientName}`, margin, y)
      y += 6
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-PY")}`, margin, y)
      y += 10

      // Body
      const lines = doc.splitTextToSize(text, maxW)
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, margin, y)
        y += 5.5
      }

      // Signature block
      y += 8
      if (y > 250) { doc.addPage(); y = 20 }
      doc.line(margin, y, margin + 70, y)
      doc.line(pageW - margin - 50, y, pageW - margin, y)
      y += 5
      doc.setFontSize(9)
      doc.text("Firma del paciente", margin, y)
      doc.text("Fecha", pageW - margin - 50, y)

      doc.save(`Consentimiento_${patientName.replace(/\s+/g, "_")}.pdf`)
    } catch (err: any) {
      toast({ title: "Error al generar PDF", description: err.message, variant: "destructive" })
    } finally {
      setExportingPdf(false)
    }
  }

  // ── Sign consent ──────────────────────────────────────────────────
  const handleSignConsent = async () => {
    if (!signedByName.trim()) {
      toast({ title: "Nombre requerido", description: "Ingrese el nombre del firmante.", variant: "destructive" })
      return
    }
    const text = getActiveConsentText()
    if (!text) {
      toast({ title: "Sin plantilla", description: "Configure el texto del consentimiento en Ajustes → Documentos.", variant: "destructive" })
      return
    }
    setSigningConsent(true)
    try {
      await consentService.sign({
        patient_id:            patientId,
        clinic_id:             clinic!.id,
        consent_text_snapshot: text,
        signed_by_name:        signedByName,
        signed_by_ci:          signedByCi || null,
        created_by:            user?.id ?? null,
      })
      setConsentSigned(true)
      toast({ title: "Consentimiento registrado", description: `Firmado por ${signedByName}.` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSigningConsent(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // ── Consent tab content (passed as extraTab) ──────────────────────
  const activeConsentText = getActiveConsentText()

  const consentContent = (
    <>
      {/* Template selector */}
      <FormSection title="Seleccionar plantilla de consentimiento">
        <div className="space-y-3">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plantilla..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Consentimiento general</SelectItem>
              {consentTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {SPECIALTY_LABELS[t.specialty] ? ` — ${SPECIALTY_LABELS[t.specialty]}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {consentTemplates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Podés crear plantillas adicionales en{" "}
              <Link href="/settings?tab=documentos" className="text-primary underline underline-offset-2">
                Ajustes → Documentos
              </Link>.
            </p>
          )}
        </div>
      </FormSection>

      {/* Template preview */}
      <FormSection title="Texto del consentimiento">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-xs text-muted-foreground">
            {activeConsentText ? `${activeConsentText.length} caracteres` : "Sin texto configurado"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportConsentPdf}
            disabled={exportingPdf || !activeConsentText}
          >
            {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Exportar PDF
          </Button>
        </div>
        {activeConsentText ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-72 overflow-y-auto font-mono">
            {activeConsentText}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay texto configurado para esta plantilla.{" "}
            <Link href="/settings?tab=documentos" className="text-primary underline underline-offset-2">
              Configurar en Ajustes
            </Link>
          </p>
        )}
      </FormSection>

      {/* Sign */}
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
          <Button onClick={handleSignConsent} disabled={signingConsent || !activeConsentText} className="gap-2">
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
    </>
  )

  // ── Render ────────────────────────────────────────────────────────
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
              Última modificación: {history[0].saved_at ? new Date(history[0].saved_at).toLocaleDateString("es-PY") : "—"}
              {history[0].saved_by_name && ` — ${history[0].saved_by_name}`}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar ficha"}
          </Button>
        </div>
      </div>

      {/* Historial de cambios */}
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

      {/* Formulario completo (componente compartido) */}
      <DentalRecordFormTabs
        key={dataKey}
        ref={dentalFormRef}
        initialData={formInitialData}
        patientId={patientId}
        extraTabs={[{
          value:   "consentimiento",
          trigger: <><FileSignature className="h-3.5 w-3.5" />Consentimiento</>,
          content: consentContent,
        }]}
      />

      {/* Guardar sticky bottom */}
      <div className="sticky bottom-4 flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar ficha"}
        </Button>
      </div>
    </div>
  )
}
