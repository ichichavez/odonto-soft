"use client"

import { Briefcase, Calendar, ChevronRight, CreditCard, Users } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentAppointments } from "@/components/recent-appointments"
import { useAuth } from "@/context/auth-context"
import { RoleGuard } from "@/components/role-guard"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {user && (
          <div className="mb-2">
            <h2 className="text-xl font-semibold">Bienvenido/a, {user.name}</h2>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">+12 este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">2 pendientes</p>
            </CardContent>
          </Card>

          <RoleGuard allowedRoles={["admin", "dentista"]}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$15,240</div>
                <p className="text-xs text-muted-foreground">+18% del mes anterior</p>
              </CardContent>
            </Card>
          </RoleGuard>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tratamientos Activos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">5 completados esta semana</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <RoleGuard
            allowedRoles={["admin", "dentista"]}
            fallback={
              <Card className="col-span-4">
                <CardContent className="p-6">
                  Necesita permisos de administrador o dentista para ver las estadísticas financieras.
                </CardContent>
              </Card>
            }
          >
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>Ingresos y citas de los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
          </RoleGuard>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Citas Recientes</CardTitle>
              <CardDescription>Últimas 5 citas programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAppointments />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/pacientes/nuevo" className="flex items-center justify-between rounded-lg border p-3 text-sm">
                Registrar Nuevo Paciente
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/citas/nueva" className="flex items-center justify-between rounded-lg border p-3 text-sm">
                Agendar Nueva Cita
                <ChevronRight className="h-4 w-4" />
              </Link>

              <RoleGuard allowedRoles={["admin", "dentista"]}>
                <Link
                  href="/presupuestos/nuevo"
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  Crear Nuevo Presupuesto
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </RoleGuard>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tratamientos Populares</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Limpieza Dental</div>
                <div>32 este mes</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Empastes</div>
                <div>28 este mes</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Blanqueamiento</div>
                <div>15 este mes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recordatorios</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Llamar a María García</div>
                <div className="text-red-500">Hoy</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Pedir material</div>
                <div className="text-orange-500">Mañana</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="font-medium">Revisar facturas</div>
                <div className="text-blue-500">En 3 días</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
