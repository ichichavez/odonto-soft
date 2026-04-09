"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useBranch, type Branch } from "@/context/branch-context"
import { useClinic } from "@/context/clinic-context"
import { patientService } from "@/services/patients"
import { appointmentService } from "@/services/appointments"
import { invoiceService } from "@/services/invoices"
import { expenseService } from "@/services/expenses"
import { formatCurrency } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MapPin, Users, Calendar, ReceiptText, TrendingDown,
  BarChart3, ChevronRight, Building2,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type BranchMetrics = {
  patients: number
  appointments: number
  revenue: number
  expenses: number
  users: string[]   // names of users assigned
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${last}` }
}

function MetricTile({
  icon: Icon, label, value, color, loading,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="text-sm font-semibold">{value}</p>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SucursalesPage() {
  const { user } = useAuth()
  const { clinic } = useClinic()
  const { branches, setActiveBranch } = useBranch()
  const router = useRouter()

  // Raw data (all branches at once — 4 queries total)
  const [allPatients,     setAllPatients]     = useState<any[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [allInvoices,     setAllInvoices]     = useState<any[]>([])
  const [allExpenses,     setAllExpenses]      = useState<any[]>([])
  const [allUsers,        setAllUsers]         = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") router.push("/")
  }, [user, router])

  useEffect(() => {
    if (!user || user.role !== "admin") return
    const { from, to } = getMonthRange()

    const load = async () => {
      setLoading(true)
      const [patients, appointments, invoices, expenses, usersRes] = await Promise.allSettled([
        patientService.getAll(),
        appointmentService.getByDateRange(from, to),
        invoiceService.getAll(),
        expenseService.getByDateRange(from, to),
        fetch("/api/admin/users").then(async r => {
          // attach auth header
          const { createBrowserClient } = await import("@/lib/supabase")
          const supabase = createBrowserClient()
          const { data: { session } } = await supabase.auth.getSession()
          return fetch("/api/admin/users", {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          }).then(r => r.json())
        }),
      ])

      if (patients.status      === "fulfilled") setAllPatients(patients.value)
      if (appointments.status  === "fulfilled") setAllAppointments(appointments.value)
      if (invoices.status      === "fulfilled") setAllInvoices(invoices.value)
      if (expenses.status      === "fulfilled") setAllExpenses(expenses.value)
      if (usersRes.status      === "fulfilled" && Array.isArray(usersRes.value)) setAllUsers(usersRes.value)
      setLoading(false)
    }

    load()
  }, [user])

  // Group metrics by branch_id
  const metricsByBranch = useMemo(() => {
    const { from, to } = getMonthRange()
    const map = new Map<string, BranchMetrics>()

    for (const b of branches) {
      map.set(b.id, { patients: 0, appointments: 0, revenue: 0, expenses: 0, users: [] })
    }

    for (const p of allPatients) {
      if (p.branch_id && map.has(p.branch_id)) map.get(p.branch_id)!.patients++
    }
    for (const a of allAppointments) {
      const bid = a.branch_id
      if (bid && map.has(bid) && a.date >= from && a.date <= to) map.get(bid)!.appointments++
    }
    for (const inv of allInvoices) {
      const bid = inv.branch_id
      if (bid && map.has(bid) && inv.status === "pagada" && inv.date >= from && inv.date <= to) {
        map.get(bid)!.revenue += Number(inv.total)
      }
    }
    for (const e of allExpenses) {
      if (e.branch_id && map.has(e.branch_id)) map.get(e.branch_id)!.expenses += Number(e.amount)
    }
    for (const u of allUsers) {
      if (u.branch_id && map.has(u.branch_id)) map.get(u.branch_id)!.users.push(u.name)
    }

    return map
  }, [branches, allPatients, allAppointments, allInvoices, allExpenses, allUsers])

  // Totals
  const totals = useMemo(() => {
    let patients = 0, appointments = 0, revenue = 0, expenses = 0
    for (const m of metricsByBranch.values()) {
      patients += m.patients; appointments += m.appointments
      revenue  += m.revenue;  expenses    += m.expenses
    }
    return { patients, appointments, revenue, expenses }
  }, [metricsByBranch])

  const now = new Date()
  const monthLabel = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  const currency = clinic?.currency ?? "PYG"

  if (!user || user.role !== "admin") return null

  return (
    <div className="flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Panel de Sucursales</h1>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        </div>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,       label: "Pacientes totales",   value: loading ? "—" : totals.patients,                         color: "bg-blue-100 text-blue-700"   },
          { icon: Calendar,    label: "Citas del mes",       value: loading ? "—" : totals.appointments,                     color: "bg-violet-100 text-violet-700"},
          { icon: ReceiptText, label: "Ingresos del mes",    value: loading ? "—" : formatCurrency(totals.revenue, currency), color: "bg-green-100 text-green-700" },
          { icon: TrendingDown,label: "Gastos del mes",      value: loading ? "—" : formatCurrency(totals.expenses, currency),color: "bg-red-100 text-red-700"    },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
                  {loading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <p className="text-base font-bold">{value}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Todas las sucursales</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-branch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map((branch) => {
          const m = metricsByBranch.get(branch.id) ?? { patients: 0, appointments: 0, revenue: 0, expenses: 0, users: [] }
          return (
            <Card key={branch.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <CardTitle className="text-base leading-tight">{branch.name}</CardTitle>
                  </div>
                  <Badge variant={branch.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                    {branch.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {branch.address && (
                  <CardDescription className="text-xs pl-6">{branch.address}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile
                    icon={Users} label="Pacientes"
                    value={m.patients}
                    color="bg-blue-100 text-blue-700" loading={loading}
                  />
                  <MetricTile
                    icon={Calendar} label="Citas del mes"
                    value={m.appointments}
                    color="bg-violet-100 text-violet-700" loading={loading}
                  />
                  <MetricTile
                    icon={ReceiptText} label="Ingresos"
                    value={loading ? "—" : formatCurrency(m.revenue, currency)}
                    color="bg-green-100 text-green-700" loading={loading}
                  />
                  <MetricTile
                    icon={TrendingDown} label="Gastos"
                    value={loading ? "—" : formatCurrency(m.expenses, currency)}
                    color="bg-red-100 text-red-700" loading={loading}
                  />
                </div>

                {/* Users */}
                {m.users.length > 0 && (
                  <div className="pt-1 border-t">
                    <p className="text-xs text-muted-foreground mb-1.5">Equipo</p>
                    <div className="flex flex-wrap gap-1">
                      {m.users.map(name => (
                        <Badge key={name} variant="secondary" className="text-xs font-normal">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => {
                      setActiveBranch(branch)
                      router.push("/reportes")
                    }}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Ver reportes
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => setActiveBranch(branch)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Ir a esta sede
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {branches.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay sucursales registradas</p>
          <p className="text-sm mt-1">
            Ve a{" "}
            <Link href="/settings" className="text-primary underline underline-offset-4">
              Configuración → Sucursales
            </Link>{" "}
            para crear la primera.
          </p>
        </div>
      )}
    </div>
  )
}
