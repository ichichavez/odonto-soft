"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Baby, Calendar, Camera, ClipboardList, Download, FileText, Grid3X3, Pencil, Pill, Plus, Stethoscope, Trash2, User, Wallet } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { patientService } from "@/services/patients"
import { dentalRecordService } from "@/services/dental-records"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { appointmentService } from "@/services/appointments"
import { budgetService } from "@/services/budgets"
import { PatientGallery } from "@/components/patient-gallery"
import { useRouter, useParams } from "next/navigation"
import { isValidUUID } from "@/lib/utils"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { patientPaymentService, PAYMENT_METHODS, type PatientPayment } from "@/services/patient-payments"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function PacienteDetallePage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const router = useRouter()
  const { clinic } = useClinic()
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [dentalRecord, setDentalRecord] = useState<any>(null)
  // Payments
  const [payments, setPayments] = useState<PatientPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [showPayForm, setShowPayForm] = useState(false)
  const [savingPay, setSavingPay] = useState(false)
  const [payForm, setPayForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "efectivo",
    concept: "",
  })

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

  // Cargar ficha odontológica (para antecedentes médicos)
  useEffect(() => {
    if (!patient || !isValidUUID(params.id)) return
    dentalRecordService.getByPatient(params.id).then(setDentalRecord).catch(() => null)
  }, [patient, params.id])

  // Cargar historial de pagos
  const loadPayments = useCallback(async () => {
    if (!isValidUUID(params.id)) return
    setPaymentsLoading(true)
    try {
      const data = await patientPaymentService.getByPatient(params.id)
      setPayments(data)
    } catch {
      // silencioso — tabla puede no existir todavía
    } finally {
      setPaymentsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (!patient) return
    loadPayments()
  }, [patient, loadPayments])

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clinic?.id) return
    setUploadingPhoto(true)
    try {
      const url = await patientService.uploadPhoto(params.id, clinic.id, file)
      setPatient((prev: any) => ({ ...prev, avatar_url: url }))
      toast({ title: "Foto actualizada", description: "La foto de perfil fue guardada." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo subir la foto", variant: "destructive" })
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  const handleSavePayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      toast({ title: "Ingresa un monto válido", variant: "destructive" }); return
    }
    setSavingPay(true)
    try {
      await patientPaymentService.create({
        patient_id: params.id,
        clinic_id: clinic?.id ?? null,
        date: payForm.date,
        amount: Number(payForm.amount),
        method: payForm.method,
        concept: payForm.concept || null,
        created_by: user?.id ?? null,
      })
      toast({ title: "Pago registrado" })
      setPayForm({ date: new Date().toISOString().split("T")[0], amount: "", method: "efectivo", concept: "" })
      setShowPayForm(false)
      loadPayments()
    } catch {
      toast({ title: "Error al registrar pago", variant: "destructive" })
    } finally {
      setSavingPay(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      await patientPaymentService.delete(id)
      setPayments(prev => prev.filter(p => p.id !== id))
      toast({ title: "Pago eliminado" })
    } catch {
      toast({ title: "Error al eliminar pago", variant: "destructive" })
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
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div
              className="h-[72px] w-[72px] rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer border-2 border-border"
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
            >
              {patient.avatar_url ? (
                <Image
                  src={patient.avatar_url}
                  alt="Foto de perfil"
                  width={72}
                  height={72}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground select-none">
                  {patient.first_name?.[0]}{patient.last_name?.[0]}
                </span>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {uploadingPhoto ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

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
            <Link href={`/pacientes/${params.id}/exportar/historial`} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Historial
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/pacientes/${params.id}/exportar/completo`} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Datos completos
            </Link>
          </Button>
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
            <Link href={`/pacientes/${params.id}/odontograma`} className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Odontograma
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="historial">Historial Médico</TabsTrigger>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />Pagos
          </TabsTrigger>
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
          <MedicalHistoryCard dentalRecord={dentalRecord} patientId={params.id} />
          {/* Galería Dental */}
          {isValidUUID(params.id) && <PatientGallery patientId={params.id} />}
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

        {/* ── Tab Pagos ── */}
        <TabsContent value="pagos" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription>
                  {payments.length > 0
                    ? `Total cobrado: ${formatCurrency(payments.reduce((s, p) => s + Number(p.amount), 0))}`
                    : "Sin pagos registrados"}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowPayForm(v => !v)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Registrar pago
              </Button>
            </CardHeader>

            {/* Formulario inline */}
            {showPayForm && (
              <div className="px-6 pb-5">
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <p className="text-sm font-semibold">Nuevo pago</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="pay-date" className="text-xs">Fecha</Label>
                      <Input
                        id="pay-date"
                        type="date"
                        value={payForm.date}
                        onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pay-amount" className="text-xs">Monto</Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={payForm.amount}
                        onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Método</Label>
                      <Select
                        value={payForm.method}
                        onValueChange={v => setPayForm(p => ({ ...p, method: v }))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pay-concept" className="text-xs">Concepto</Label>
                      <Input
                        id="pay-concept"
                        placeholder="Ej: Consulta, cuota 1..."
                        value={payForm.concept}
                        onChange={e => setPayForm(p => ({ ...p, concept: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSavePayment} disabled={savingPay}>
                      {savingPay ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowPayForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="pt-0">
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pagos registrados. Usa "Registrar pago" para agregar el primero.
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
                    <span>Concepto</span>
                    <span className="text-right w-24">Fecha</span>
                    <span className="text-right w-24">Método</span>
                    <span className="text-right w-28">Monto</span>
                    <span className="w-8" />
                  </div>
                  {payments.map(pay => (
                    <div
                      key={pay.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-2 py-2.5 border-b last:border-0 hover:bg-muted/30 text-sm"
                    >
                      <span className="truncate">{pay.concept || "—"}</span>
                      <span className="text-right w-24 text-muted-foreground tabular-nums">
                        {new Date(pay.date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                      <span className="text-right w-24 text-muted-foreground">
                        {PAYMENT_METHODS[pay.method] ?? pay.method}
                      </span>
                      <span className="text-right w-28 font-semibold tabular-nums">
                        {formatCurrency(Number(pay.amount))}
                      </span>
                      <button
                        onClick={() => handleDeletePayment(pay.id)}
                        className="w-8 flex justify-center text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar pago"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  {payments.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-end gap-4 px-2 py-1.5 font-semibold text-sm">
                        <span className="text-muted-foreground">Total pagado</span>
                        <span className="w-28 text-right tabular-nums">
                          {formatCurrency(payments.reduce((s, p) => s + Number(p.amount), 0))}
                        </span>
                        <span className="w-8" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Componente de antecedentes médicos (formato ficha) ──────────────

const DISEASE_LABELS: Record<string, string> = {
  tuberculosis: "Tuberculosis", leprosy: "Lepra", cardiac: "Enf. Cardíacas",
  sexual_diseases: "Enf. Sexuales", asthma: "Asma", hepatitis: "Hepatitis",
  hypertension: "Hipertensión Arterial", malaria: "Malaria", allergy: "Alergia",
  aids: "SIDA", chagas: "Enf. de Chagas", psychiatric: "Disturbios Psíquicos",
  rheumatic_fever: "Fiebre Reumática", seizures: "Convulsiones", epilepsy: "Epilepsia",
  fainting: "Desmayos", sinusitis: "Sinusitis", coagulation_problems: "Probl. de coagulación",
  anemia: "Anemia", diabetes: "Diabetes", hemophilia: "Hemofilia", ulcers: "Úlceras",
}

function CheckBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-xs px-2 py-0.5 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
      {label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 w-44">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function MedicalHistoryCard({ dentalRecord, patientId }: { dentalRecord: any; patientId: string }) {
  const med: any = dentalRecord?.medical_history ?? {}
  const dent: any = dentalRecord?.dental_history ?? {}
  const hasData = dentalRecord !== null

  const activeDiseaseTags = Object.entries(med.diseases ?? {})
    .filter(([k, v]) => v === true && DISEASE_LABELS[k])
    .map(([k]) => DISEASE_LABELS[k])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Antecedentes Médicos</CardTitle>
            <CardDescription>
              {hasData ? "Datos cargados desde la ficha odontológica" : "Sin datos registrados en la ficha"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/pacientes/${patientId}/ficha`} className="flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5" />
              {hasData ? "Editar en ficha" : "Completar ficha"}
            </Link>
          </Button>
        </CardHeader>

        {!hasData ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Los antecedentes médicos se registran en la{" "}
              <Link href={`/pacientes/${patientId}/ficha`} className="text-primary underline underline-offset-2">
                ficha odontológica
              </Link>
              . Aún no hay datos cargados.
            </p>
          </CardContent>
        ) : (
          <CardContent className="space-y-5">

            {/* Tratamiento médico / medicamentos */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tratamiento y medicación</h3>
              <div className="space-y-1">
                <InfoRow
                  label="Bajo tratamiento médico"
                  value={med.under_medical_treatment ? (med.treatment_duration || "Sí") : "No"}
                />
                <InfoRow
                  label="Toma medicamentos"
                  value={med.taking_medication ? (med.medication_detail || "Sí") : "No"}
                />
                <InfoRow
                  label="Tolera anestesia"
                  value={
                    med.never_had_anesthesia
                      ? "Nunca le aplicaron"
                      : med.tolerates_anesthesia === false
                      ? "No tolera"
                      : "Sí"
                  }
                />
              </div>
            </div>

            {/* Enfermedades */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enfermedades</h3>
              {activeDiseaseTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeDiseaseTags.map((label) => (
                    <CheckBadge key={label} label={label} />
                  ))}
                  {med.diseases?.other && med.diseases?.other_detail && (
                    <CheckBadge label={`Otro: ${med.diseases.other_detail}`} />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ninguna registrada</p>
              )}
            </div>

            {/* Otros antecedentes */}
            {(med.had_surgery || med.bleeds_excessively || med.smokes || med.drinks_alcohol || med.pregnant) && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Otros antecedentes</h3>
                <div className="space-y-1">
                  {med.had_surgery && (
                    <InfoRow label="Cirugías previas" value={med.surgery_detail || "Sí"} />
                  )}
                  {med.bleeds_excessively && (
                    <InfoRow label="Sangrado excesivo" value="Sí" />
                  )}
                  {med.smokes && (
                    <InfoRow
                      label="Tabaquismo"
                      value={[med.smoking_duration, med.cigarettes_per_day && `${med.cigarettes_per_day} cig/día`].filter(Boolean).join(", ") || "Sí"}
                    />
                  )}
                  {med.drinks_alcohol && (
                    <InfoRow label="Alcohol" value={med.alcohol_duration || "Sí"} />
                  )}
                  {med.pregnant && (
                    <InfoRow label="Embarazo" value={med.pregnancy_duration || "Sí"} />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Historia odontológica */}
      {dent && Object.keys(dent).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Historia Odontológica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Última visita al odontólogo" value={dent.last_dentist_visit} />
            {dent.has_tooth_loss && (
              <InfoRow label="Pérdida dentaria" value={dent.tooth_loss_reason || "Sí"} />
            )}
            <InfoRow label="Frecuencia de cepillado" value={dent.brushing_frequency} />
            <InfoRow
              label="Higiene dental"
              value={[
                dent.hygiene_brush && "Cepillo",
                dent.hygiene_floss && "Hilo dental",
                dent.hygiene_mouthwash && "Enjuague",
                dent.hygiene_other && "Otros",
              ].filter(Boolean).join(", ") || null}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
