"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ExternalLink, MessageCircle, Pencil, Loader2, Calendar, Clock, Stethoscope, User, XCircle } from "lucide-react"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS_LONG = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]

const STATUS_LABELS: Record<string, string> = {
  confirmada: "Confirmada",
  pendiente:  "Pendiente",
  completada: "Completada",
  cancelada:  "Cancelada",
  programada: "Programada",
  scheduled:  "Programada",
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmada: "default",
  pendiente:  "secondary",
  completada: "outline",
  cancelada:  "destructive",
  programada: "secondary",
  scheduled:  "secondary",
}

function humanDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    return `${DAYS_LONG[dow]}, ${d} ${MONTHS[m - 1]} ${y}`
  } catch {
    return dateStr
  }
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  appointmentId: string | null
  onUpdated:   (appt: any) => void
  onCancelled: (id: string) => void
}

export function AppointmentDetailSheet({ open, onOpenChange, appointmentId, onUpdated, onCancelled }: Props) {
  const { toast } = useToast()
  const [appt, setAppt]                   = useState<any>(null)
  const [loading, setLoading]             = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [cancelling, setCancelling]       = useState(false)

  useEffect(() => {
    if (!open || !appointmentId) return
    setAppt(null)
    setLoading(true)
    appointmentService.getById(appointmentId)
      .then(setAppt)
      .catch(() => toast({ title: "Error al cargar cita", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [open, appointmentId, toast])

  const handleStatusChange = async (status: string) => {
    if (!appt) return
    setUpdatingStatus(true)
    try {
      await appointmentService.update(appt.id, { status } as any)
      const updated = { ...appt, status }
      setAppt(updated)
      onUpdated(updated)
      toast({ title: "Estado actualizado" })
    } catch {
      toast({ title: "Error al actualizar estado", variant: "destructive" })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleCancel = async () => {
    if (!appt) return
    setCancelling(true)
    try {
      await appointmentService.update(appt.id, { status: "cancelada" } as any)
      toast({ title: "Cita cancelada" })
      onCancelled(appt.id)
      onOpenChange(false)
    } catch {
      toast({ title: "Error al cancelar cita", variant: "destructive" })
    } finally {
      setCancelling(false)
    }
  }

  // Build WhatsApp link if patient has phone
  const waLink = (() => {
    const phone = appt?.patients?.phone
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, "")
    if (!cleaned) return null
    const name    = appt.patients.first_name
    const dateStr = humanDate(appt.date)
    const time    = appt.time?.substring(0, 5) ?? ""
    const text    = encodeURIComponent(
      `Hola ${name}, le recordamos su cita el ${dateStr} a las ${time}. Si tiene alguna consulta, contáctenos.`
    )
    return `https://wa.me/${cleaned}?text=${text}`
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col overflow-y-auto">

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !appt ? (
          <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground text-sm">
            No se encontró la cita.
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-xl leading-tight">
                  {appt.patients?.first_name} {appt.patients?.last_name}
                </SheetTitle>
                <Badge variant={STATUS_BADGE[appt.status] ?? "secondary"} className="shrink-0">
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </Badge>
              </div>
            </SheetHeader>

            {/* Info rows */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{humanDate(appt.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{appt.time?.substring(0, 5)} · {appt.duration ?? 30} min</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>{appt.treatments?.name ?? "Consulta general"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span>{appt.users?.name ?? "Sin dentista asignado"}</span>
              </div>
              {appt.notes && (
                <p className="rounded-lg bg-muted/60 p-3 text-foreground leading-relaxed">
                  {appt.notes}
                </p>
              )}
            </div>

            <Separator className="my-5" />

            {/* Status selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cambiar estado
              </p>
              <Select
                value={appt.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger>
                  {updatingStatus
                    ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Actualizando...</span>
                    : <SelectValue />
                  }
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-5" />

            {/* Action buttons */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href={`/citas/${appt.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  Ver detalle completo
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href={`/citas/${appt.id}/editar`}>
                  <Pencil className="h-4 w-4" />
                  Editar cita
                </Link>
              </Button>

              {waLink ? (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                  asChild
                >
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Enviar recordatorio por WhatsApp
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 opacity-50"
                  disabled
                  title="El paciente no tiene teléfono registrado"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp (sin teléfono registrado)
                </Button>
              )}

              {/* Cancel with confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={appt.status === "cancelada" || cancelling}
                  >
                    {cancelling
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <XCircle className="h-4 w-4" />
                    }
                    {appt.status === "cancelada" ? "Cita ya cancelada" : "Cancelar cita"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La cita de <strong>{appt.patients?.first_name} {appt.patients?.last_name}</strong> del{" "}
                      {humanDate(appt.date)} a las {appt.time?.substring(0, 5)} se marcará como cancelada.
                      No se elimina del historial.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, mantenerla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, cancelar cita
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
