"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/role-guard"
import { Download, FileText, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoiceService } from "@/services/invoices"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/context/branch-context"

export default function FacturasPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { activeBranch } = useBranch()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [dateFilter, setDateFilter] = useState("todos")

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!hasPermission(["admin", "dentista"])) {
      router.push("/")
    }
  }, [hasPermission, router])

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const data = await invoiceService.getAll(activeBranch?.id)
        setInvoices(data)
      } catch (error) {
        console.error("Error al cargar facturas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las facturas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [toast, activeBranch?.id])

  const handleSearch = () => {
    // Implementar búsqueda
  }

  const getFilteredInvoices = () => {
    let filtered = [...invoices]

    // Filtrar por estado
    if (statusFilter !== "todos") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter === "mes-actual") {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter((invoice) => new Date(invoice.date) >= firstDay)
    } else if (dateFilter === "mes-anterior") {
      const now = new Date()
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(
        (invoice) => new Date(invoice.date) >= firstDayLastMonth && new Date(invoice.date) < firstDayThisMonth,
      )
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.number.toLowerCase().includes(query) ||
          `${invoice.patients.first_name} ${invoice.patients.last_name}`.toLowerCase().includes(query),
      )
    }

    return filtered
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagada":
        return <Badge className="bg-green-500">Pagada</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "anulada":
        return <Badge className="bg-red-500">Anulada</Badge>
      default:
        return <Badge className="bg-gray-500">Desconocido</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const filteredInvoices = getFilteredInvoices()

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Facturas</h1>
          <div className="flex gap-2">
            <Button className="flex items-center gap-2" asChild>
              <Link href="/facturas/nueva">
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Link>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link href="/presupuestos">
                <FileText className="h-4 w-4" />
                Ver Presupuestos
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar facturas..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pagada">Pagadas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="anulada">Anuladas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las fechas</SelectItem>
                <SelectItem value="mes-actual">Mes actual</SelectItem>
                <SelectItem value="mes-anterior">Mes anterior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Esqueletos de carga
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron facturas
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell>
                      {invoice.patients.first_name} {invoice.patients.last_name}
                    </TableCell>
                    <TableCell>${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.budget_id ? (
                        <Link href={`/presupuestos/${invoice.budget_id}`} className="text-emerald-600 hover:underline">
                          {invoice.budgets?.number || "Ver"}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/facturas/${invoice.id}`}>Ver</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredInvoices.length > 0 && (
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
    </RoleGuard>
  )
}
