"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Baby, Calendar, ClipboardList, FileText, Pencil, Pill, Stethoscope, User } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { patientService } from "@/services/patients"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { appointmentService } from "@/services/appointments"
import { budgetService } from "@/services/budgets"
import { DentalGallery } from "@/components/dental-gallery"
import { useRouter } from "next/navigation"
import { isValidUUID } from "@/lib/utils"

export default function PacienteDetallePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si el ID es válido antes de hacer la consulta
    if (!isValidUUID(params.id)) {
      console.error("Invalid UUID format:", params.id)
      setError("ID de paciente inválido")
      setLoading(false)
      return
    }

    const fetchPatient = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await patientService.getById(params.id)
        setPatient(data)
      } catch (error) {
        console.error("Error al cargar paciente:", error)
        setError("No se pudo cargar la información del paciente")
        toast({
          title: "Error",
          description: "No se pudo cargar la información del paciente",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [params.id, toast])

  // Cargar citas del paciente
  useEffect(() => {
    if (!patient || !isValidUUID(params.id)) return

    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true)
        const data = await appointmentService.getAll()
        const filteredAppointments = data.filter((app: any) => app.patient_id === params.id)
        setAppointments(filteredAppointments.slice(0, 5))
      } catch (error) {
        console.error("Error al cargar citas:", error)
      } finally {
        setAppointmentsLoading(false)
      }
    }

    fetchAppointments()
  }, [patient, params.id])

  // Cargar presupuestos del paciente
  useEffect(() => {
    if (!patient || !isValidUUID(params.id)) return

    const fetchBudgets = async () => {
      try {
        setBudgetsLoading(true)
        const data = await budgetService.getAll()
        const filteredBudgets = data.filter((budget: any) => budget.patient_id === params.id)
        setBudgets(filteredBudgets.slice(0, 5))
      } catch (error) {
        console.error("Error al cargar presupuestos:", error)
      } finally {
        setBudgetsLoading(false)
      }
    }

    fetchBudgets()
  }, [patient, params.id])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const formatCurrency = (amount: number) => {
    return `₲ ${amount.toLocaleString("es-PY")}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return <Badge className="bg-green-500">Confirmada</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "cancelada":
        return <Badge className="bg-red-500">Cancelada</Badge>
      case "completada":
        return <Badge className="bg-blue-500">Completada</Badge>
      default:
        return <Badge className="bg-gray-500">Desconocido</Badge>
    }
  }

  const getBudgetStatusBadge = (status: string) => {
    switch (status) {
      case "aceptado":
        return <Badge className="bg-green-500">Aceptado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "rechazado":
        return <Badge className="bg-red-500">Rechazado</Badge>
      default:
        return <Badge className="bg-gray-500">Desconocido</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>

        <Tabs defaultValue="informacion">
          <TabsList className="grid w-full grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </TabsList>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">{error || "Paciente no encontrado"}</h2>
          <p className="text-muted-foreground mt-2">
            {error || "El paciente que busca no existe o ha sido eliminado."}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pacientes">Ir a Pacientes</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="outline" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          {patient.patient_type === "nino" ? (
            <Badge variant="secondary" className="gap-1">
              <Baby className="h-3 w-3" /> Niño/a
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" /> Adulto
            </Badge>
          )}
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href={`/pacientes/${params.id}/plan-tratamiento`} className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Plan de Trat.
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/pacientes/${params.id}/receta`} className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Receta
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/pacientes/${params.id}/ficha`} className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Ficha Odontológica
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/pacientes/${params.id}/editar`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="informacion">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion">Información Personal</TabsTrigger>
          <TabsTrigger value="historial">Historial Médico</TabsTrigger>
          <TabsTrigger value="citas">Citas y Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos personales del paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nombre Completo</h3>
                  <p className="text-base">{patient.first_name} {patient.last_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">C.I.</h3>
                  <p className="text-base">{patient.identity_number || "No registrada"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</h3>
                  <p className="text-base">{formatDate(patient.birth_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Género</h3>
                  <p className="text-base capitalize">{patient.gender || "No especificado"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
                  <p className="text-base">{patient.phone || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Celular</h3>
                  <p className="text-base">{patient.secondary_phone || "No disponible"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Correo Electrónico</h3>
                  <p className="text-base">{patient.email || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Dirección de Domicilio</h3>
                  <p className="text-base">{patient.address || "No disponible"}</p>
                </div>
              </div>

              {/* Campos de adulto */}
              {patient.patient_type !== "nino" && (patient.profession || patient.marital_status || patient.work_address || patient.work_phone) && (
                <div className="pt-3 border-t space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del paciente adulto</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estado Civil</h3>
                      <p className="text-base capitalize">{patient.marital_status || "No especificado"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Profesión</h3>
                      <p className="text-base">{patient.profession || "No registrada"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Teléfono Laboral</h3>
                      <p className="text-base">{patient.work_phone || "No disponible"}</p>
                    </div>
                  </div>
                  {patient.work_address && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Dirección Laboral</h3>
                      <p className="text-base">{patient.work_address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Campos de niño / encargado */}
              {patient.patient_type === "nino" && (patient.guardian_name || patient.guardian_phone) && (
                <div className="pt-3 border-t space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del encargado / tutor</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Encargado</h3>
                      <p className="text-base">{patient.guardian_name || "No registrado"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">C.I. del Encargado</h3>
                      <p className="text-base">{patient.guardian_identity_number || "No registrada"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Relación</h3>
                      <p className="text-base capitalize">{patient.guardian_relationship || "No especificada"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Teléfono del Encargado</h3>
                      <p className="text-base">{patient.guardian_phone || "No disponible"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Celular del Encargado</h3>
                      <p className="text-base">{patient.guardian_secondary_phone || "No disponible"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial Médico</CardTitle>
              <CardDescription>Información médica relevante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Alergias</h3>
                <p className="text-base">{patient.medical_records?.[0]?.allergies || "Ninguna registrada"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Medicamentos</h3>
                <p className="text-base">{patient.medical_records?.[0]?.medications || "Ninguno registrado"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Enfermedades Crónicas</h3>
                <p className="text-base">{patient.medical_records?.[0]?.chronic_diseases || "Ninguna registrada"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial Dental</CardTitle>
              <CardDescription>Información sobre la salud dental</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Última Visita</h3>
                <p className="text-base">
                  {patient.dental_records?.[0]?.last_visit
                    ? formatDate(patient.dental_records[0].last_visit)
                    : "No registrada"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tratamientos Previos</h3>
                <p className="text-base">{patient.dental_records?.[0]?.previous_treatments || "Ninguno registrado"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Hábitos de Higiene</h3>
                <p className="text-base">{patient.dental_records?.[0]?.hygiene_habits || "No registrados"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Observaciones</h3>
                <p className="text-base">{patient.dental_records?.[0]?.observations || "Ninguna"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Galería Dental */}
          {isValidUUID(params.id) && <DentalGallery patientId={params.id} />}
        </TabsContent>

        <TabsContent value="citas" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Citas Recientes</CardTitle>
                <CardDescription>Últimas citas del paciente</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/citas/nueva" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Nueva Cita
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No hay citas registradas</div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">
                          {formatDate(appointment.date)} - {appointment.time.substring(0, 5)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.treatments?.name || "Consulta general"}
                        </p>
                      </div>
                      <div>{getStatusBadge(appointment.status)}</div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Button variant="link" asChild>
                      <Link href={`/citas?paciente=${params.id}`}>Ver todas las citas</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Presupuestos</CardTitle>
                <CardDescription>Presupuestos del paciente</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/presupuestos/nuevo" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nuevo Presupuesto
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {budgetsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : budgets.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No hay presupuestos registrados</div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">
                          {budget.number} - {formatDate(budget.date)}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(budget.total)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>{getBudgetStatusBadge(budget.status)}</div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/presupuestos/${budget.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Button variant="link" asChild>
                      <Link href={`/presupuestos?paciente=${params.id}`}>Ver todos los presupuestos</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
