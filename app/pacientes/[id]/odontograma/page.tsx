"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { createBrowserClient } from "@/lib/supabase"
import { OdontogramChart } from "@/components/odontogram/chart"
import { type OdontogramData } from "@/components/odontogram/types"

const EMPTY_DATA: OdontogramData = { permanent: {}, primary: {} }

function isValidUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export default function OdontogramaPage() {
  const params = useParams() as { id: string }
  const { user } = useAuth()
  const { clinic } = useClinic()
  const { toast } = useToast()

  const [patientName, setPatientName] = useState("")
  const [odontogramId, setOdontogramId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<OdontogramData>(EMPTY_DATA)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Referencia mutable para el dato más reciente (evita stale closure en handleSave)
  const latestData = useRef<OdontogramData>(EMPTY_DATA)

  const handleChange = useCallback((data: OdontogramData) => {
    latestData.current = data
  }, [])

  // ── Carga inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isValidUUID(params.id) || !clinic?.id) return

    const load = async () => {
      setLoading(true)
      const supabase = createBrowserClient()

      // Nombre del paciente
      const { data: patient } = await supabase
        .from("patients")
        .select("first_name, last_name")
        .eq("id", params.id)
        .single()
      if (patient) setPatientName(`${patient.first_name} ${patient.last_name}`)

      // Odontograma existente
      const { data: existing } = await supabase
        .from("odontograms")
        .select("id, data, notes")
        .eq("patient_id", params.id)
        .maybeSingle()

      if (existing) {
        setOdontogramId(existing.id)
        const loaded = (existing.data ?? EMPTY_DATA) as OdontogramData
        setChartData(loaded)
        latestData.current = loaded
        setNotes(existing.notes ?? "")
      }

      setLoading(false)
    }

    load()
  }, [params.id, clinic?.id])

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!clinic?.id) return
    setSaving(true)

    const supabase = createBrowserClient()
    const payload = {
      patient_id: params.id,
      clinic_id: clinic.id,
      data: latestData.current,
      notes,
      updated_at: new Date().toISOString(),
    }

    let error
    if (odontogramId) {
      ;({ error } = await supabase.from("odontograms").update(payload).eq("id", odontogramId))
    } else {
      const { data: inserted, error: e } = await supabase
        .from("odontograms")
        .insert(payload)
        .select("id")
        .single()
      error = e
      if (inserted) setOdontogramId(inserted.id)
    }

    setSaving(false)

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Odontograma guardado" })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Odontograma</h1>
          {patientName && (
            <p className="text-sm text-muted-foreground">{patientName}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Odontograma interactivo */}
          <div className="border rounded-xl p-4 bg-card">
            <OdontogramChart
              initialData={chartData}
              onChange={handleChange}
            />
          </div>

          {/* Notas clínicas */}
          <div className="space-y-1.5">
            <Label htmlFor="odonto-notes">Observaciones clínicas</Label>
            <Textarea
              id="odonto-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones, plan de tratamiento general..."
              className="resize-y"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar odontograma"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
