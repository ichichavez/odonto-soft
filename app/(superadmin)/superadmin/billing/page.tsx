"use client"

import { useEffect, useState } from "react"
import { AlertCircle, RefreshCw, ExternalLink, DollarSign, AlertTriangle } from "lucide-react"
import { fetchSubscriptions, createCheckoutSession, type SubscriptionRow } from "@/services/superadmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: "basico",      label: "Básico ($64/mes)"       },
  { value: "pro",         label: "Pro ($99/mes)"           },
  { value: "empresarial", label: "Empresarial ($179/mes)"  },
]

const SUB_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  canceled: "outline",
  suspended: "destructive",
}

const SUB_STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Trial",
  past_due: "Vencida",
  canceled: "Cancelada",
  suspended: "Suspendida",
}

export default function BillingPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutClinic, setCheckoutClinic] = useState<SubscriptionRow | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")
  const [creatingLink, setCreatingLink] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    setError(null)
    fetchSubscriptions()
      .then(setSubs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const totalMrr = subs.reduce((sum, s) => sum + s.mrr, 0)
  const pastDue = subs.filter((s) => s.status === "past_due").length

  const handleCreateLink = async () => {
    if (!checkoutClinic) return
    setCreatingLink(true)
    try {
      const url = await createCheckoutSession(checkoutClinic.clinic_id, selectedPlan)
      window.open(url, "_blank", "noopener,noreferrer")
      setCheckoutClinic(null)
    } catch (e: any) {
      toast({ title: "Error al crear enlace", description: e.message, variant: "destructive" })
    } finally {
      setCreatingLink(false)
    }
  }

  const openCheckout = (sub: SubscriptionRow) => {
    setCheckoutClinic(sub)
    setSelectedPlan(sub.plan ?? "pro")
  }

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-slate-400 text-sm mt-1">Suscripciones dLocalGo por clínica</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">MRR Total</p>
            <p className="text-2xl font-bold">${totalMrr}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 flex items-center gap-4">
          <div className="rounded-lg bg-red-500/10 p-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Pagos vencidos</p>
            <p className="text-2xl font-bold">{pastDue}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="px-5 py-3.5 font-medium">Clínica</th>
                <th className="px-5 py-3.5 font-medium">Plan</th>
                <th className="px-5 py-3.5 font-medium">Estado</th>
                <th className="px-5 py-3.5 font-medium">Período</th>
                <th className="px-5 py-3.5 font-medium">MRR</th>
                <th className="px-5 py-3.5 font-medium">Actualizado</th>
                <th className="px-5 py-3.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No hay suscripciones registradas
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-slate-100 font-medium">{s.clinic_name}</td>
                    <td className="px-5 py-3.5 capitalize text-slate-300">{s.plan}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={SUB_STATUS_VARIANT[s.status] ?? "outline"}>
                        {SUB_STATUS_LABEL[s.status] ?? s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {s.current_period_start && s.current_period_end ? (
                        <>
                          {format(new Date(s.current_period_start), "dd/MM/yy")}
                          {" – "}
                          {format(new Date(s.current_period_end), "dd/MM/yy")}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-400 font-medium">
                      {s.mrr > 0 ? `$${s.mrr}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {s.updated_at
                        ? format(new Date(s.updated_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
                        onClick={() => openCheckout(s)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Enlace de pago
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={!!checkoutClinic} onOpenChange={(o) => !o && setCheckoutClinic(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>Crear enlace de pago</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-slate-400 mb-1">Clínica</p>
              <p className="font-medium">{checkoutClinic?.clinic_name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2">Plan</p>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-slate-100">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-slate-500">
              Se abrirá el checkout de dLocalGo para que la clínica complete el pago.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setCheckoutClinic(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLink}
              disabled={creatingLink}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {creatingLink ? "Creando..." : "Abrir enlace de pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
