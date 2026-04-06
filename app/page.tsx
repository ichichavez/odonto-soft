"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Briefcase, Calendar, ChevronRight, CreditCard, Users } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Overview } from "@/components/overview"
import { RecentAppointments } from "@/components/recent-appointments"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { RoleGuard } from "@/components/role-guard"
import { patientService } from "@/services/patients"
import { appointmentService } from "@/services/appointments"
import { invoiceService } from "@/services/invoices"
import { inventoryService } from "@/services/inventory"
import { expenseService } from "@/services/expenses"
import { formatCurrency } from "@/lib/currency"

function StatCard({
  title, icon: Icon, value, sub, loading,
}: {
  title: string
  icon: React.ElementType
  value: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { clinic } = useClinic()
  const currency = clinic?.currency ?? "PYG"

  const [loading, setLoading] = useState(true)
  const [totalPatients, setTotalPatients] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [pendingToday, setPendingToday] = useState(0)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpenses, setMonthExpenses] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<{ name: string; stock: number; min: number }[]>([])

  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`

    Promise.allSettled([
      patientService.getAll(),
      appointmentService.getByDate(todayStr),
      invoiceService.getAll(),
      inventoryService.materials.getAll(),
      expenseService.getByDateRange(firstOfMonth, todayStr),
    ]).then(([patientsRes, apptRes, invoicesRes, materialsRes, expensesRes]) => {
      if (patientsRes.status === "fulfilled") {
        setTotalPatients(patientsRes.value.length)
      }
      if (apptRes.status === "fulfilled") {
        setTodayAppointments(apptRes.value.length)
        setPendingToday(apptRes.value.filter((a: any) => a.status === "pendiente").length)
      }
      if (invoicesRes.status === "fulfilled") {
        const invoices = invoicesRes.value as any[]
        const monthTotal = invoices
          .filter((inv: any) => inv.date >= firstOfMonth)
          .reduce((sum: number, inv: any) => sum + Number(inv.total ?? 0), 0)
        setMonthIncome(monthTotal)
      }
      if (materialsRes.status === "fulfilled") {
        const mats = materialsRes.value as any[]
        const low = mats.filter((m: any) => Number(m.stock_quantity) <= Number(m.min_stock))
        setLowStockCount(low.length)
        setLowStockItems(low.slice(0, 5).map((m: any) => ({
          name: m.name,
          stock: Number(m.stock_quantity),
          min: Number(m.min_stock),
        })))
      }
      if (expensesRes.status === "fulfilled") {
        const total = expensesRes.value.reduce((s, e) => s + Number(e.amount), 0)
        setMonthExpenses(total)
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line

  const now = new Date()
  const monthName = now.toLocaleDateString("es-ES", { month: "long" })

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {user && (
          <div className="mb-2">
            <h2 className="text-xl font-semibold">Bienvenido/a, {user.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{monthName} {now.getFullYear()}</p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pacientes Totales"
            icon={Users}
            value={totalPatients}
            sub="registrados en la clínica"
            loading={loading}
          />
          <StatCard
            title="Citas Hoy"
            icon={Calendar}
            value={todayAppointments}
            sub={pendingToday > 0 ? `${pendingToday} pendiente${pendingToday > 1 ? "s" : ""}` : "todas confirmadas"}
            loading={loading}
          />
          <RoleGuard allowedRoles={["admin", "dentista"]}>
            <StatCard
              title={`Ingresos de ${monthName}`}
              icon={CreditCard}
              value={loading ? "…" : formatCurrency(monthIncome, currency)}
              sub={loading ? "" : `Gastos: ${formatCurrency(monthExpenses, currency)}`}
              loading={loading}
            />
          </RoleGuard>
          <StatCard
            title="Stock Bajo"
            icon={lowStockCount > 0 ? AlertTriangle : Briefcase}
            value={lowStockCount > 0 ? `${lowStockCount} material${lowStockCount > 1 ? "es" : ""}` : "Sin alertas"}
            sub={lowStockCount > 0 ? "requieren reposición" : "inventario al día"}
            loading={loading}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <RoleGuard
            allowedRoles={["admin", "dentista"]}
            fallback={
              <Card className="col-span-4">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Necesita permisos de administrador o dentista para ver las estadísticas.
                </CardContent>
              </Card>
            }
          >
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Citas del mes</CardTitle>
                <CardDescription>Número de citas por día en {monthName}</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
          </RoleGuard>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Citas de hoy</CardTitle>
              <CardDescription>Próximas citas programadas para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAppointments />
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Acciones rápidas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/pacientes/nuevo" className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                Registrar Nuevo Paciente
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/citas/nueva" className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                Agendar Nueva Cita
                <ChevronRight className="h-4 w-4" />
              </Link>
              <RoleGuard allowedRoles={["admin", "dentista"]}>
                <Link href="/presupuestos/nuevo" className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                  Crear Nuevo Presupuesto
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </RoleGuard>
              <Link href="/compras/nueva" className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                Registrar Compra
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Stock bajo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                {lowStockCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                Materiales con Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {loading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)
              ) : lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Todos los materiales tienen stock suficiente.</p>
              ) : (
                lowStockItems.map(m => (
                  <div key={m.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-destructive shrink-0 ml-2">{m.stock} / {m.min}</div>
                  </div>
                ))
              )}
              {lowStockItems.length > 0 && (
                <Link href="/inventario" className="flex items-center justify-between rounded-lg border p-3 text-sm text-primary hover:bg-muted/50 transition-colors">
                  Ver inventario completo
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Resumen financiero del mes */}
          <RoleGuard
            allowedRoles={["admin", "dentista"]}
            fallback={
              <Card>
                <CardHeader className="pb-2"><CardTitle>Resumen del mes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Sin permisos para ver información financiera.</p>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Resumen de {monthName}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {loading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)
                ) : (
                  <>
                    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div className="font-medium">Ingresos (facturas)</div>
                      <div className="font-bold text-primary">{formatCurrency(monthIncome, currency)}</div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div className="font-medium">Gastos</div>
                      <div className="font-bold text-destructive">{formatCurrency(monthExpenses, currency)}</div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 text-sm bg-muted/30">
                      <div className="font-semibold">Balance estimado</div>
                      <div className={`font-bold ${monthIncome - monthExpenses >= 0 ? "text-primary" : "text-destructive"}`}>
                        {formatCurrency(monthIncome - monthExpenses, currency)}
                      </div>
                    </div>
                    <Link href="/reportes" className="flex items-center justify-between rounded-lg border p-3 text-sm text-primary hover:bg-muted/50 transition-colors">
                      Ver reportes completos
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </RoleGuard>
        </div>
      </main>
    </div>
  )
}
