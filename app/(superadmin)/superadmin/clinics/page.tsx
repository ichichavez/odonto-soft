"use client"

import { useEffect, useState } from "react"
import { AlertCircle, RefreshCw, Plus, CalendarDays } from "lucide-react"
import { fetchClinics, createClinic, updateClinic, type ClinicRow } from "@/services/superadmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const EMPTY_FORM = {
  clinicName: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  plan: "pro",
  expiresAt: "",
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPlan, setFilterPlan] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  // New clinic dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  // Extend dialog
  const [extendDialog, setExtendDialog] = useState<{ clinicId: string; current: string | null } | null>(null)
  const [newExpiresAt, setNewExpiresAt] = useState("")
  const [extending, setExtending] = useState(false)

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

  const handleCreate = async () => {
    if (!newForm.clinicName || !newForm.adminName || !newForm.adminEmail || !newForm.adminPassword) {
      toast({ title: "Completá todos los campos requeridos", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const result = await createClinic({
        clinicName: newForm.clinicName,
        adminName: newForm.adminName,
        adminEmail: newForm.adminEmail,
        adminPassword: newForm.adminPassword,
        plan: newForm.plan,
        expiresAt: newForm.expiresAt || undefined,
      })
      toast({ title: "Clínica creada exitosamente" })
      setNewDialogOpen(false)
      setNewForm(EMPTY_FORM)
      // Add optimistic row then refresh
      load()
    } catch (e: any) {
      toast({ title: "Error al crear clínica", description: e.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const openExtendDialog = (clinic: ClinicRow) => {
    setExtendDialog({ clinicId: clinic.id, current: clinic.expires_at })
    setNewExpiresAt(clinic.expires_at ? clinic.expires_at.slice(0, 10) : "")
  }

  const handleExtend = async () => {
    if (!extendDialog || !newExpiresAt) return
    setExtending(true)
    try {
      await updateClinic(extendDialog.clinicId, { expiresAt: new Date(newExpiresAt).toISOString() })
      setClinics((prev) =>
        prev.map((c) =>
          c.id === extendDialog.clinicId
            ? { ...c, expires_at: new Date(newExpiresAt).toISOString() }
            : c
        )
      )
      toast({ title: "Fecha extendida" })
      setExtendDialog(null)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setExtending(false)
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
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setNewDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
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
                <th className="px-5 py-3.5 font-medium">Facturación</th>
                <th className="px-5 py-3.5 font-medium">Vence</th>
                <th className="px-5 py-3.5 font-medium">Usuarios</th>
                <th className="px-5 py-3.5 font-medium">Registrada</th>
                <th className="px-5 py-3.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
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
                    <td className="px-5 py-3.5">
                      <Badge variant={c.billing_type === "manual" ? "outline" : "secondary"}>
                        {c.billing_type === "manual" ? "Manual" : "Automático"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {c.expires_at
                        ? format(new Date(c.expires_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{c.user_count}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {c.created_at
                        ? format(new Date(c.created_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={c.status === "active" ? "destructive" : "default"}
                          className="h-7 text-xs"
                          onClick={() => handleStatusToggle(c)}
                          disabled={updating === c.id}
                        >
                          {c.status === "active" ? "Suspender" : "Activar"}
                        </Button>
                        {c.billing_type === "manual" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => openExtendDialog(c)}
                            disabled={updating === c.id}
                          >
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Extender
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New clinic dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo cliente (manual)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nombre de la clínica *</Label>
              <Input
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                placeholder="Clínica Dental X"
                value={newForm.clinicName}
                onChange={(e) => setNewForm({ ...newForm, clinicName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nombre del admin *</Label>
              <Input
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                placeholder="Dr. Juan García"
                value={newForm.adminName}
                onChange={(e) => setNewForm({ ...newForm, adminName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Email del admin *</Label>
              <Input
                type="email"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                placeholder="admin@clinica.com"
                value={newForm.adminEmail}
                onChange={(e) => setNewForm({ ...newForm, adminEmail: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Contraseña *</Label>
              <Input
                type="password"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                placeholder="Mínimo 8 caracteres"
                value={newForm.adminPassword}
                onChange={(e) => setNewForm({ ...newForm, adminPassword: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Plan</Label>
                <Select value={newForm.plan} onValueChange={(v) => setNewForm({ ...newForm, plan: v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="free" className="text-slate-300">Free</SelectItem>
                    <SelectItem value="pro" className="text-slate-300">Pro</SelectItem>
                    <SelectItem value="enterprise" className="text-slate-300">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Fecha vencimiento</Label>
                <Input
                  type="date"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  value={newForm.expiresAt}
                  onChange={(e) => setNewForm({ ...newForm, expiresAt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => { setNewDialogOpen(false); setNewForm(EMPTY_FORM) }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creando…" : "Crear clínica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend expiry dialog */}
      <Dialog open={!!extendDialog} onOpenChange={(open) => { if (!open) setExtendDialog(null) }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Extender vencimiento</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <Label className="text-slate-300">Nueva fecha de vencimiento</Label>
            <Input
              type="date"
              className="bg-slate-700 border-slate-600 text-slate-100"
              value={newExpiresAt}
              onChange={(e) => setNewExpiresAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setExtendDialog(null)}
              disabled={extending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleExtend}
              disabled={extending || !newExpiresAt}
            >
              {extending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
