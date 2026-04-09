"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search } from "lucide-react"
import { patientService } from "@/services/patients"
import { treatmentService } from "@/services/treatments"
import { userService } from "@/services/users"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"

const DAYS_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTHS    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  onCreated: (appt: any) => void
}

export function NewAppointmentSheet({ open, onOpenChange, date, time, onCreated }: Props) {
  const { toast } = useToast()

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [dentists, setDentists] = useState<any[]>([])
  const [search, setSearch]     = useState("")

  const [form, setForm] = useState({
    patient_id:   "",
    dentist_id:   "",
    treatment_id: "",
    duration:     30,
    notes:        "",
  })

  // Load data when sheet opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSearch("")
    setForm({ patient_id: "", dentist_id: "", treatment_id: "", duration: 30, notes: "" })

    Promise.all([
      patientService.getAll(),
      treatmentService.getAll(),
      userService.getDentists(),
    ]).then(([p, t, d]) => {
      setPatients(p as any[])
      setTreatments(t as any[])
      setDentists(d as any[])
      if ((d as any[]).length > 0) {
        setForm(prev => ({ ...prev, dentist_id: (d as any[])[0].id }))
      }
    }).catch(() => {
      toast({ title: "Error al cargar datos", variant: "destructive" })
    }).finally(() => setLoading(false))
  }, [open, toast])

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients
    const q = search.toLowerCase()
    return patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
    )
  }, [patients, search])

  const handleTreatmentChange = (id: string) => {
    setForm(prev => ({ ...prev, treatment_id: id }))
    const t = treatments.find(t => t.id === id)
    if (t?.duration_minutes) {
      setForm(prev => ({ ...prev, duration: t.duration_minutes }))
    }
  }

  const handleSave = async () => {
    if (!form.patient_id) {
      toast({ title: "Selecciona un paciente", variant: "destructive" }); return
    }
    if (!form.dentist_id) {
      toast({ title: "Selecciona un dentista", variant: "destructive" }); return
    }

    setSaving(true)
    try {
      const created = await appointmentService.create({
        patient_id:   form.patient_id,
        dentist_id:   form.dentist_id,
        treatment_id: form.treatment_id || null,
        date,
        time:     time + ":00",
        duration: form.duration,
        notes:    form.notes || null,
      })
      toast({ title: "Cita creada" })
      onCreated(created)
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Error al crear cita", description: e?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Human-readable date label
  const dateLabel = (() => {
    try {
      const [y, m, d] = date.split("-").map(Number)
      const dow = new Date(y, m - 1, d).getDay()
      return `${DAYS_LONG[dow]}, ${d} ${MONTHS[m - 1]} ${y} · ${time}`
    } catch {
      return `${date} · ${time}`
    }
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva Cita</SheetTitle>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {/* Patient */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar paciente..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={form.patient_id}
                onValueChange={v => setForm(prev => ({ ...prev, patient_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.length === 0 ? (
                    <div className="py-3 px-3 text-sm text-muted-foreground">Sin resultados</div>
                  ) : (
                    filteredPatients.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Dentist */}
            <div className="space-y-2">
              <Label>Dentista *</Label>
              <Select
                value={form.dentist_id}
                onValueChange={v => setForm(prev => ({ ...prev, dentist_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar dentista" /></SelectTrigger>
                <SelectContent>
                  {dentists.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label>Tratamiento <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={form.treatment_id} onValueChange={handleTreatmentChange}>
                <SelectTrigger><SelectValue placeholder="Sin tratamiento" /></SelectTrigger>
                <SelectContent>
                  {treatments.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input
                type="number"
                min={15}
                max={240}
                step={15}
                value={form.duration}
                onChange={e => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notas <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                placeholder="Observaciones sobre la cita..."
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar cita
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
