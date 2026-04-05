"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import { patientService } from "@/services/patients"
import { prescriptionService } from "@/services/prescriptions"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"

export default function NuevaRecetaPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    prescription_text: "",
    instructions_text: "",
    signed_by_name: "",
  })

  useEffect(() => {
    patientService.getById(params.id).then(setPatient).catch(console.error)
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.signed_by_name.trim()) {
      toast({ title: "Error", description: "Ingrese el nombre del firmante", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const rx = await prescriptionService.create({
        patient_id: params.id,
        clinic_id: clinic?.id ?? null,
        created_by: user?.id ?? null,
        date: form.date,
        prescription_text: form.prescription_text || null,
        instructions_text: form.instructions_text || null,
        signed_by_name: form.signed_by_name,
      })
      toast({ title: "Receta guardada", description: "La receta ha sido creada exitosamente." })
      router.push(`/pacientes/${params.id}/receta/${rx.id}`)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo guardar la receta", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}/receta`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Receta</h1>
          {patient && (
            <p className="text-muted-foreground text-sm">
              {patient.first_name} {patient.last_name}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Receta</CardTitle>
            <CardDescription>Complete la receta médica y las indicaciones post-operatorias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firmado">Firmado por</Label>
                <Input
                  id="firmado"
                  value={form.signed_by_name}
                  onChange={(e) => setForm({ ...form, signed_by_name: e.target.value })}
                  placeholder="Nombre de la odontóloga"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receta">Rp. (Receta médica)</Label>
              <Textarea
                id="receta"
                rows={6}
                value={form.prescription_text}
                onChange={(e) => setForm({ ...form, prescription_text: e.target.value })}
                placeholder="Escriba la receta médica (medicamentos, dosis, frecuencia...)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicaciones">Indicaciones post-operatorias</Label>
              <Textarea
                id="indicaciones"
                rows={5}
                value={form.instructions_text}
                onChange={(e) => setForm({ ...form, instructions_text: e.target.value })}
                placeholder="Escriba las indicaciones para el paciente..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" asChild>
            <Link href={`/pacientes/${params.id}/receta`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Receta"}
          </Button>
        </div>
      </form>
    </div>
  )
}
