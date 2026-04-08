"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Printer } from "lucide-react"
import Image from "next/image"
import { patientService } from "@/services/patients"
import { prescriptionService, type Prescription } from "@/services/prescriptions"
import { useClinic } from "@/context/clinic-context"

export default function VerRecetaPage() {
  const params = useParams() as { id: string; recetaId: string }
  const { toast } = useToast()
  const { clinic } = useClinic()
  const [patient, setPatient] = useState<any>(null)
  const [rx, setRx] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [pat, receta] = await Promise.all([
          patientService.getById(params.id),
          prescriptionService.getById(params.recetaId),
        ])
        setPatient(pat)
        setRx(receta)
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "No se pudo cargar la receta", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, params.recetaId, toast])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #rx-print, #rx-print * { visibility: visible; }
          #rx-print { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; font-family: serif; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col p-6 space-y-6">
        {/* Nav bar */}
        <div className="flex items-center gap-4 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/pacientes/${params.id}/receta`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Receta</h1>
          <div className="ml-auto">
            <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : !rx ? (
          <p className="text-muted-foreground">Receta no encontrada.</p>
        ) : (
          <div
            id="rx-print"
            className="max-w-2xl mx-auto border rounded-lg p-8 space-y-6 bg-white text-gray-900"
          >
            {/* Membrete */}
            <div className="border-b pb-4 flex items-start gap-4">
              {clinic?.logo_url && (
                <Image
                  src={clinic.logo_url}
                  alt="Logo"
                  width={72}
                  height={72}
                  className="object-contain shrink-0"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
                {clinic?.doctor_name && (
                  <p className="text-sm font-medium text-gray-700">{clinic.doctor_name}</p>
                )}
                {(clinic?.specialty || clinic?.professional_registration) && (
                  <p className="text-sm text-gray-600">
                    {[clinic?.specialty, clinic?.professional_registration].filter(Boolean).join(" · ")}
                  </p>
                )}
                {clinic?.address && <p className="text-sm text-gray-600">{clinic.address}</p>}
                {clinic?.phone && <p className="text-sm text-gray-600">Tel: {clinic.phone}</p>}
              </div>
            </div>

            {/* Encabezado */}
            <div className="flex justify-between text-sm">
              <div>
                <p>
                  <span className="font-semibold">Paciente:</span>{" "}
                  {patient ? `${patient.first_name} ${patient.last_name}` : "—"}
                </p>
                {patient?.identity_number && (
                  <p>
                    <span className="font-semibold">C.I.:</span> {patient.identity_number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">Fecha:</span> {formatDate(rx.date)}
                </p>
              </div>
            </div>

            {/* Dx */}
            {rx.diagnosis && (
              <div>
                <p className="font-bold mb-1">Dx.</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.diagnosis}
                </div>
              </div>
            )}

            {/* Rp. */}
            {rx.prescription_text && (
              <div>
                <p className="font-bold text-lg mb-1">Rp.</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.prescription_text}
                </div>
              </div>
            )}

            {/* Indicaciones */}
            {rx.instructions_text && (
              <div>
                <p className="font-bold mb-1">Indicaciones</p>
                <div className="pl-4 whitespace-pre-wrap text-sm border-l-2 border-gray-300">
                  {rx.instructions_text}
                </div>
              </div>
            )}

            {/* Validez */}
            <p className="text-xs text-gray-500 italic">
              Válido por 1 mes a partir de la fecha de emisión.
            </p>

            {/* Firma */}
            <div className="pt-6 border-t text-center text-sm">
              {clinic?.signature_url && (
                <div className="flex justify-center mb-2">
                  <Image
                    src={clinic.signature_url}
                    alt="Firma"
                    width={160}
                    height={64}
                    className="object-contain"
                  />
                </div>
              )}
              <div className="border-t border-gray-400 w-56 mx-auto pt-2">
                <p className="font-semibold">{rx.signed_by_name}</p>
                {clinic?.specialty && <p className="text-gray-600">{clinic.specialty}</p>}
                {clinic?.professional_registration && (
                  <p className="text-gray-500 text-xs">{clinic.professional_registration}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
