"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { patientService, type Patient } from "@/services/patients"
import { invoiceService } from "@/services/invoices"
import { patientPaymentService } from "@/services/patient-payments"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/context/branch-context"
import { formatCurrency } from "@/lib/currency"
import { useClinic } from "@/context/clinic-context"

type Balance = { facturado: number; pagado: number; saldo: number }

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [balances, setBalances] = useState<Map<string, Balance>>(new Map())
  const [balancesLoading, setBalancesLoading] = useState(true)
  const { toast } = useToast()
  const { activeBranch } = useBranch()
  const { clinic } = useClinic()

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const data = await patientService.getAll(activeBranch?.id)
        setPatients(data)
      } catch (error) {
        console.error("Error al cargar pacientes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los pacientes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [toast, activeBranch?.id])

  // Cargar saldos (facturas vs pagos) en paralelo
  useEffect(() => {
    const loadBalances = async () => {
      setBalancesLoading(true)
      try {
        const [invoices, payments] = await Promise.all([
          invoiceService.getAll(activeBranch?.id),
          patientPaymentService.getAll(),
        ])
        const map = new Map<string, Balance>()
        for (const inv of invoices) {
          if (!inv.patient_id) continue
          const b = map.get(inv.patient_id) ?? { facturado: 0, pagado: 0, saldo: 0 }
          b.facturado += Number(inv.total) || 0
          map.set(inv.patient_id, b)
        }
        for (const pay of payments) {
          if (!pay.patient_id) continue
          const b = map.get(pay.patient_id) ?? { facturado: 0, pagado: 0, saldo: 0 }
          b.pagado += Number(pay.amount) || 0
          map.set(pay.patient_id, b)
        }
        for (const b of map.values()) b.saldo = b.facturado - b.pagado
        setBalances(map)
      } catch {
        // silencioso — no rompe el listado
      } finally {
        setBalancesLoading(false)
      }
    }
    loadBalances()
  }, [activeBranch?.id])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Si la búsqueda está vacía, cargar todos los pacientes
      const data = await patientService.getAll(activeBranch?.id)
      setPatients(data)
      return
    }

    try {
      setLoading(true)
      const data = await patientService.search(searchQuery, activeBranch?.id)
      setPatients(data)
    } catch (error) {
      console.error("Error al buscar pacientes:", error)
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Link href="/pacientes/nuevo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pacientes..."
            className="pl-8 w-full md:max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>C.I. / DNI</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha de Nacimiento</TableHead>
              <TableHead className="text-right">Saldo pendiente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Esqueletos de carga
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="text-muted-foreground">{patient.identity_number || "—"}</TableCell>
                  <TableCell className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </TableCell>
                  <TableCell>{patient.phone || "N/A"}</TableCell>
                  <TableCell>{patient.email || "N/A"}</TableCell>
                  <TableCell>{formatDate(patient.birth_date)}</TableCell>
                  <TableCell className="text-right">
                    {balancesLoading ? (
                      <Skeleton className="h-5 w-20 ml-auto" />
                    ) : (() => {
                      const b = balances.get(patient.id)
                      const saldo = b?.saldo ?? 0
                      if (saldo <= 0) return (
                        <span className="text-xs font-medium text-green-600">Al día</span>
                      )
                      return (
                        <span className="text-xs font-semibold text-red-600 tabular-nums">
                          {formatCurrency(saldo, clinic?.currency ?? "PYG")}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pacientes/${patient.id}`}>Ver</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pacientes/${patient.id}/editar`}>Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && patients.length > 0 && (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm">
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
