"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Printer, Edit, FileText, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { budgetService } from "@/services/budgets"
import { invoiceService } from "@/services/invoices"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleGuard } from "@/components/role-guard"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function addOneMonth(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

function fmtGs(n: number) {
  return `₲ ${Number(n).toLocaleString("es-PY")}`
}

function getEstadoBadge(estado: string) {
  switch (estado) {
    case "aceptado":  return <Badge className="bg-green-500">Aceptado</Badge>
    case "pendiente": return <Badge className="bg-yellow-500">Pendiente</Badge>
    case "rechazado": return <Badge className="bg-red-500">Rechazado</Badge>
    default:          return <Badge className="bg-gray-500">Desconocido</Badge>
  }
}

export default function PresupuestoDetallePage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { clinic } = useClinic()
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    budgetService.getById(params.id)
      .then(setPresupuesto)
      .catch(() => toast({ title: "Error", description: "No se pudo cargar el presupuesto", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [params.id, toast])

  const handleGenerateInvoice = async () => {
    if (!user) return
    setGeneratingInvoice(true)
    try {
      const invoice = await invoiceService.createFromBudget(params.id, user.id)
      toast({ title: "Factura generada", description: `Factura ${invoice.number} creada.` })
      router.push(`/facturas/${invoice.id}`)
    } catch {
      toast({ title: "Error", description: "No se pudo generar la factura", variant: "destructive" })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const handleWhatsApp = () => {
    if (!presupuesto) return
    const p = presupuesto.patients
    const nombre = `${p.first_name} ${p.last_name}`
    const clinicaName = clinic?.name ?? "Clínica Odontológica"

    const lineas = presupuesto.budget_items.map((item: any) => {
      const diente = item.tooth ? `[${item.tooth}] ` : ""
      return `• ${diente}${item.description} — ${item.quantity} x ${fmtGs(item.price)} = *${fmtGs(item.total)}*`
    }).join("\n")

    const validoHasta = addOneMonth(presupuesto.date)
    const notas = presupuesto.notes ? `\n_Observaciones: ${presupuesto.notes}_` : ""

    const msg = [
      `*Presupuesto #${presupuesto.number}*`,
      `${clinicaName}`,
      `Paciente: ${nombre}`,
      `Fecha: ${fmtDate(presupuesto.date)}`,
      `Válido hasta: ${validoHasta}`,
      ``,
      `*Detalle:*`,
      lineas,
      ``,
      `Subtotal: ${fmtGs(presupuesto.subtotal)}`,
      `IVA (${presupuesto.tax_rate}%): ${fmtGs(presupuesto.tax_amount)}`,
      `*TOTAL: ${fmtGs(presupuesto.total)}*`,
      notas,
    ].filter(l => l !== undefined).join("\n")

    const phone = p.phone?.replace(/\D/g, "") || ""
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`

    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="flex flex-col p-6 text-center py-16">
        <p className="text-muted-foreground">Presupuesto no encontrado.</p>
        <Button variant="outline" className="mt-4 mx-auto" asChild>
          <Link href="/presupuestos">Volver a Presupuestos</Link>
        </Button>
      </div>
    )
  }

  const validoHasta = addOneMonth(presupuesto.date)

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #presupuesto-print, #presupuesto-print * { visibility: visible; }
          #presupuesto-print { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; font-family: sans-serif; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; font-size: 12px; }
          th { background: #f5f5f5; font-weight: 600; }
        }
      `}</style>

      <div className="flex flex-col p-6 space-y-6">

        {/* Barra de acciones — no se imprime */}
        <div className="flex items-center gap-3 flex-wrap no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/presupuestos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Presupuesto #{presupuesto.number}</h1>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={handleWhatsApp} className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <RoleGuard allowedRoles={["admin", "dentista"]}>
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href={`/presupuestos/${params.id}/editar`}><Edit className="h-4 w-4" /> Editar</Link>
              </Button>
            </RoleGuard>
            {presupuesto.status === "aceptado" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Generar Factura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Generar Factura</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Generar una factura a partir de este presupuesto?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerateInvoice} disabled={generatingInvoice}>
                      {generatingInvoice ? "Generando..." : "Generar Factura"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Documento imprimible */}
        <div id="presupuesto-print" className="max-w-3xl mx-auto w-full border rounded-xl p-8 space-y-6 bg-white">

          {/* Encabezado clínica */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-xl font-bold">{clinic?.name ?? "Clínica Odontológica"}</h2>
              {clinic?.address && <p className="text-sm text-muted-foreground">{clinic.address}</p>}
              {clinic?.phone && <p className="text-sm text-muted-foreground">Tel: {clinic.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">PRESUPUESTO</p>
              <p className="text-sm text-muted-foreground">#{presupuesto.number}</p>
              <div className="mt-1">{getEstadoBadge(presupuesto.status)}</div>
            </div>
          </div>

          {/* Paciente + fechas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Paciente</p>
              <p className="font-medium">{presupuesto.patients.first_name} {presupuesto.patients.last_name}</p>
              {presupuesto.patients.identity_number && (
                <p className="text-muted-foreground">C.I.: {presupuesto.patients.identity_number}</p>
              )}
              {presupuesto.patients.phone && (
                <p className="text-muted-foreground">Tel: {presupuesto.patients.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fechas</p>
              <p>Emisión: <span className="font-medium">{fmtDate(presupuesto.date)}</span></p>
              <p className="text-muted-foreground">Válido hasta: <span className="font-medium text-foreground">{validoHasta}</span></p>
            </div>
          </div>

          {/* Tabla de ítems */}
          <div>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-3 py-2 font-semibold w-20">Diente</th>
                  <th className="px-3 py-2 font-semibold">Descripción</th>
                  <th className="px-3 py-2 font-semibold text-right w-16">Cant.</th>
                  <th className="px-3 py-2 font-semibold text-right w-28">Precio unit.</th>
                  <th className="px-3 py-2 font-semibold text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.budget_items.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{item.tooth || "—"}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{fmtGs(item.price)}</td>
                    <td className="px-3 py-2 text-right font-medium">{fmtGs(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmtGs(presupuesto.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({presupuesto.tax_rate}%)</span>
                <span>{fmtGs(presupuesto.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>TOTAL</span>
                <span>{fmtGs(presupuesto.total)}</span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {presupuesto.notes && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{presupuesto.notes}</p>
            </div>
          )}

          {/* Pie de validez */}
          <div className="border-t pt-4 text-xs text-muted-foreground text-center">
            Este presupuesto es válido por 30 días a partir de la fecha de emisión
            ({fmtDate(presupuesto.date)}), hasta el <strong>{validoHasta}</strong>.
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
