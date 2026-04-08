"use client"

import { useEffect, useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { fetchClinics, updateClinic, type ClinicRow } from "@/services/superadmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  suspended: "Suspendida",
  trial: "Trial",
}

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  pro: "#10b981",
  enterprise: "#6366f1",
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPlan, setFilterPlan] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    setError(null)
    fetchClinics()
      .then(setClinics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusToggle = async (clinic: ClinicRow) => {
    const newStatus = clinic.status === "active" ? "suspended" : "active"
    setUpdating(clinic.id)
    try {
      await updateClinic(clinic.id, { status: newStatus })
      setClinics((prev) =>
        prev.map((c) => (c.id === clinic.id ? { ...c, status: newStatus } : c))
      )
      toast({ title: `Clínica ${newStatus === "active" ? "activada" : "suspendida"}` })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const handlePlanChange = async (clinicId: string, plan: string) => {
    setUpdating(clinicId)
    try {
      await updateClinic(clinicId, { plan })
      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, plan } : c))
      )
      toast({ title: "Plan actualizado" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const filtered = clinics.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false
    if (filterPlan !== "all" && c.plan !== filterPlan) return false
    return true
  })

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clínicas</h1>
          <p className="text-slate-400 text-sm mt-1">{clinics.length} clínicas registradas</p>
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-100">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-100">Todos los estados</SelectItem>
            <SelectItem value="active" className="text-slate-100">Activa</SelectItem>
            <SelectItem value="suspended" className="text-slate-100">Suspendida</SelectItem>
            <SelectItem value="trial" className="text-slate-100">Trial</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-100">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-100">Todos los planes</SelectItem>
            <SelectItem value="free" className="text-slate-100">Free</SelectItem>
            <SelectItem value="pro" className="text-slate-100">Pro</SelectItem>
            <SelectItem value="enterprise" className="text-slate-100">Enterprise</SelectItem>
          </SelectContent>
        </Select>
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
                <th className="px-5 py-3.5 font-medium">Usuarios</th>
                <th className="px-5 py-3.5 font-medium">Registrada</th>
                <th className="px-5 py-3.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay clínicas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${updating === c.id ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-slate-100 font-medium">{c.name}</td>
                    <td className="px-5 py-3.5">
                      <Select
                        value={c.plan}
                        onValueChange={(plan) => handlePlanChange(c.id, plan)}
                        disabled={updating === c.id}
                      >
                        <SelectTrigger
                          className="h-7 w-32 text-xs border-0 bg-transparent p-0 focus:ring-0"
                          style={{ color: PLAN_COLORS[c.plan] ?? "#94a3b8" }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="free" className="text-slate-300">Free</SelectItem>
                          <SelectItem value="pro" className="text-slate-300">Pro</SelectItem>
                          <SelectItem value="enterprise" className="text-slate-300">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{c.user_count}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {c.created_at
                        ? format(new Date(c.created_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button
                        size="sm"
                        variant={c.status === "active" ? "destructive" : "default"}
                        className="h-7 text-xs"
                        onClick={() => handleStatusToggle(c)}
                        disabled={updating === c.id}
                      >
                        {c.status === "active" ? "Suspender" : "Activar"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
