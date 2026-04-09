"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Receipt } from "lucide-react"
import Link from "next/link"
import { RoleGuard } from "@/components/role-guard"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { budgetService } from "@/services/budgets"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/context/branch-context"

export default function PresupuestosPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  const { activeBranch } = useBranch()
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!hasPermission(["admin", "dentista"])) {
      router.push("/")
    }
  }, [hasPermission, router])

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true)
        const data = await budgetService.getAll(activeBranch?.id)
        setBudgets(data)
      } catch (error) {
        console.error("Error al cargar presupuestos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los presupuestos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
  }, [toast, activeBranch?.id])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Si la búsqueda está vacía, cargar todos los presupuestos
      const data = await budgetService.getAll()
      setBudgets(data)
      return
    }

    // Filtrar localmente por número de presupuesto o nombre de paciente
    const filtered = budgets.filter(
      (budget) =>
        budget.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${budget.patients.first_name} ${budget.patients.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setBudgets(filtered)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link href="/facturas">
                <Receipt className="h-4 w-4" />
                Ver Facturas
              </Link>
            </Button>
            <Link href="/presupuestos/nuevo">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar presupuestos..."
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
                <TableHead>Número</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : budgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron presupuestos
                  </TableCell>
                </TableRow>
              ) : (
                budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.number}</TableCell>
                    <TableCell className="font-medium">
                      {budget.patients.first_name} {budget.patients.last_name}
                    </TableCell>
                    <TableCell>{formatDate(budget.date)}</TableCell>
                    <TableCell>${budget.total.toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(budget.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/presupuestos/${budget.id}`}>Ver</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/presupuestos/${budget.id}/editar`}>Editar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && budgets.length > 0 && (
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
