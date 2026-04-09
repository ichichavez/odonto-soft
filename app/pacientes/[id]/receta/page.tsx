"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, FilePlus, FileText, MessageCircle } from "lucide-react"
import { patientService } from "@/services/patients"
import { prescriptionService, type Prescription } from "@/services/prescriptions"
import { useClinic } from "@/context/clinic-context"

export default function RecetasPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const { clinic } = useClinic()
  const [patient, setPatient] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [pat, rxs] = await Promise.all([
          patientService.getById(params.id),
          prescriptionService.getByPatient(params.id),
        ])
        setPatient(pat)
        setPrescriptions(rxs)
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "No se pudieron cargar las recetas", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, toast])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-ES")

  const buildWhatsAppUrl = (rx: Prescription) => {
    if (!patient?.phone) return null
    const phone = patient.phone.replace(/\D/g, "")
    const patientName = `${patient.first_name} ${patient.last_name}`
    const clinicName = clinic?.name ?? "Clínica Odontológica"
    const doctorName = clinic?.doctor_name ?? rx.signed_by_name
    const lines: string[] = []
    lines.push(`🦷 *Receta Odontológica*`)
    lines.push(`*${clinicName}*`)
    if (doctorName) lines.push(`Dr/a. ${doctorName}`)
    lines.push(``)
    lines.push(`*Paciente:* ${patientName}`)
    lines.push(`*Fecha:* ${new Date(rx.date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}`)
    if (rx.diagnosis) { lines.push(``); lines.push(`*Dx.*`); lines.push(rx.diagnosis) }
    if (rx.prescription_text) { lines.push(``); lines.push(`*Rp.*`); lines.push(rx.prescription_text) }
    if (rx.instructions_text) { lines.push(``); lines.push(`*Indicaciones*`); lines.push(rx.instructions_text) }
    lines.push(``); lines.push(`_Válido por 1 mes a partir de la fecha de emisión._`)
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Recetas e Indicaciones</h1>
          {patient && (
            <p className="text-muted-foreground text-sm">
              {patient.first_name} {patient.last_name}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Button asChild className="flex items-center gap-2">
            <Link href={`/pacientes/${params.id}/receta/nueva`}>
              <FilePlus className="h-4 w-4" />
              Nueva Receta
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Recetas</CardTitle>
          <CardDescription>Todas las recetas emitidas para este paciente</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No hay recetas registradas</p>
            </div>
          ) : (
            <div className="divide-y">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{formatDate(rx.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      Firmado por: {rx.signed_by_name}
                    </p>
                    {rx.prescription_text && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                        Rp. {rx.prescription_text.slice(0, 60)}
                        {rx.prescription_text.length > 60 ? "…" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const waUrl = buildWhatsAppUrl(rx)
                      return waUrl ? (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" asChild>
                          <a href={waUrl} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            WA
                          </a>
                        </Button>
                      ) : null
                    })()}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/pacientes/${params.id}/receta/${rx.id}`}>Ver / Imprimir</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
