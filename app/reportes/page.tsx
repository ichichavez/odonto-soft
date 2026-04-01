"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleGuard } from "@/components/role-guard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export default function ReportesPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!hasPermission(["admin"])) {
      router.push("/")
    }
  }, [hasPermission, router])

  // Datos de ejemplo para los gráficos
  const ingresosMensuales = [
    { name: "Ene", total: 12500 },
    { name: "Feb", total: 14200 },
    { name: "Mar", total: 15800 },
    { name: "Abr", total: 15240 },
    { name: "May", total: 16800 },
    { name: "Jun", total: 17500 },
  ]

  const citasPorDia = [
    { name: "Lun", citas: 12 },
    { name: "Mar", citas: 15 },
    { name: "Mié", citas: 10 },
    { name: "Jue", citas: 14 },
    { name: "Vie", citas: 18 },
  ]

  const tratamientosPopulares = [
    { name: "Limpieza", value: 35 },
    { name: "Empastes", value: 28 },
    { name: "Blanqueamiento", value: 15 },
    { name: "Extracciones", value: 12 },
    { name: "Ortodoncia", value: 10 },
  ]

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes y Estadísticas</h1>
        </div>

        <Tabs defaultValue="financieros">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financieros">Financieros</TabsTrigger>
            <TabsTrigger value="citas">Citas</TabsTrigger>
            <TabsTrigger value="tratamientos">Tratamientos</TabsTrigger>
          </TabsList>

          <TabsContent value="financieros" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
                <CardDescription>Ingresos totales por mes durante el último semestre</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ingresosMensuales}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Tratamiento</CardTitle>
                  <CardDescription>Distribución de ingresos por tipo de tratamiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tratamientosPopulares}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#adfa1d"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen Financiero</CardTitle>
                  <CardDescription>Datos financieros clave</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Ingresos Totales (Año)</span>
                      <span className="font-bold">$92,040.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Promedio Mensual</span>
                      <span className="font-bold">$15,340.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Crecimiento Anual</span>
                      <span className="font-bold text-emerald-600">+18.5%</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Valor Promedio por Paciente</span>
                      <span className="font-bold">$375.67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Presupuestos Pendientes</span>
                      <span className="font-bold">$8,750.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="citas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Citas por Día</CardTitle>
                <CardDescription>Número de citas por día de la semana</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={citasPorDia}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Line type="monotone" dataKey="citas" stroke="#adfa1d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Citas</CardTitle>
                  <CardDescription>Distribución de citas por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                      <span className="ml-2 min-w-[80px] text-sm">Completadas: 70%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                      <span className="ml-2 min-w-[80px] text-sm">Pendientes: 15%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: "10%" }}></div>
                      </div>
                      <span className="ml-2 min-w-[80px] text-sm">Canceladas: 10%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "5%" }}></div>
                      </div>
                      <span className="ml-2 min-w-[80px] text-sm">Reprogramadas: 5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Citas</CardTitle>
                  <CardDescription>Datos clave sobre las citas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Total de Citas (Mes)</span>
                      <span className="font-bold">245</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Promedio Diario</span>
                      <span className="font-bold">12.3</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Duración Promedio</span>
                      <span className="font-bold">45 min</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Tasa de Asistencia</span>
                      <span className="font-bold text-emerald-600">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Nuevos Pacientes</span>
                      <span className="font-bold">32 este mes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tratamientos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tratamientos Realizados</CardTitle>
                <CardDescription>Distribución de tratamientos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={tratamientosPopulares}
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      fill="#adfa1d"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tratamientos Más Rentables</CardTitle>
                  <CardDescription>Tratamientos con mayor ingreso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Ortodoncia</span>
                      <span className="font-bold">$15,000.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Blanqueamiento</span>
                      <span className="font-bold">$6,750.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Empastes</span>
                      <span className="font-bold">$3,360.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Extracciones</span>
                      <span className="font-bold">$1,800.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Limpieza Dental</span>
                      <span className="font-bold">$2,560.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Tratamientos</CardTitle>
                  <CardDescription>Datos clave sobre tratamientos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Total Tratamientos (Mes)</span>
                      <span className="font-bold">185</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Tratamiento Más Común</span>
                      <span className="font-bold">Limpieza Dental</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Tratamiento Más Rentable</span>
                      <span className="font-bold">Ortodoncia</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Tiempo Promedio</span>
                      <span className="font-bold">42 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Satisfacción del Cliente</span>
                      <span className="font-bold text-emerald-600">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
