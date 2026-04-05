"use client"

import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { ArrowDown, ArrowLeft, ArrowUp, Package, Pencil, Settings } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { inventoryService } from "@/services/inventory"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function MaterialDetallePage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const [material, setMaterial] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [movementsLoading, setMovementsLoading] = useState(true)

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.materials.getById(params.id)
        setMaterial(data)
      } catch (error) {
        console.error("Error al cargar material:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del material",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMaterial()
  }, [params.id, toast])

  useEffect(() => {
    const fetchMovements = async () => {
      if (!material) return

      try {
        setMovementsLoading(true)
        const data = await inventoryService.movements.getByMaterialId(params.id)
        setMovements(data)
      } catch (error) {
        console.error("Error al cargar movimientos:", error)
      } finally {
        setMovementsLoading(false)
      }
    }

    if (material) {
      fetchMovements()
    }
  }, [material, params.id])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStockStatusBadge = (material: any) => {
    if (material.stock_quantity <= 0) {
      return <Badge variant="destructive">Sin stock</Badge>
    } else if (material.stock_quantity <= material.min_stock_quantity) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Stock bajo
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          En stock
        </Badge>
      )
    }
  }

  const getStockPercentage = (material: any) => {
    // Consideramos que el 100% es el doble del stock mínimo
    const target = material.min_stock_quantity * 2
    const percentage = (material.stock_quantity / target) * 100
    return Math.min(percentage, 100) // Máximo 100%
  }

  const getProgressColor = (material: any) => {
    if (material.stock_quantity <= 0) {
      return "bg-red-500"
    } else if (material.stock_quantity <= material.min_stock_quantity) {
      return "bg-yellow-500"
    } else {
      return "bg-green-500"
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entrada":
        return <ArrowDown className="h-4 w-4 text-green-500" />
      case "salida":
        return <ArrowUp className="h-4 w-4 text-red-500" />
      case "ajuste":
        return <Settings className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case "entrada":
        return "Entrada"
      case "salida":
        return "Salida"
      case "ajuste":
        return "Ajuste"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
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

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Material no encontrado</h2>
          <p className="text-muted-foreground mt-2">El material que busca no existe o ha sido eliminado.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/inventario">Volver a Inventario</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista", "asistente"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventario">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{material.name}</h1>
          <div className="ml-auto flex items-center gap-2">
            <RoleGuard allowedRoles={["admin", "asistente"]}>
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <Link href={`/inventario/${params.id}/entrada`}>
                  <ArrowDown className="h-4 w-4" />
                  Registrar Entrada
                </Link>
              </Button>
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <Link href={`/inventario/${params.id}/salida`}>
                  <ArrowUp className="h-4 w-4" />
                  Registrar Salida
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/inventario/${params.id}/editar`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar Material
                </Link>
              </Button>
            </RoleGuard>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información del Material</CardTitle>
              <CardDescription>Detalles y especificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                  <p className="text-base">{material.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Categoría</h3>
                  <p className="text-base">{material.material_categories?.name || "Sin categoría"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                  <p className="text-base">{material.sku || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Unidad de Medida</h3>
                  <p className="text-base">{material.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Precio de Venta</h3>
                  <p className="text-base">${material.price.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Precio de Costo</h3>
                  <p className="text-base">${material.cost_price ? material.cost_price.toFixed(2) : "No definido"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">% de Ganancia</h3>
                  <p className="text-base">
                    {material.profit_percentage ? `${material.profit_percentage}%` : "No definido"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descripción</h3>
                <p className="text-base">{material.description || "Sin descripción"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Stock</CardTitle>
              <div className="pt-2 flex items-center gap-2">
                {getStockStatusBadge(material)}
                <span className="font-bold text-lg">
                  {material.stock_quantity} {material.unit}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Stock actual</span>
                  <span>
                    {material.stock_quantity} / {material.min_stock_quantity * 2} {material.unit}
                  </span>
                </div>
                <Progress value={getStockPercentage(material)} className={getProgressColor(material)} />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Stock Mínimo</h3>
                <p className="text-base">
                  {material.min_stock_quantity} {material.unit}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Última Actualización</h3>
                <p className="text-base">{formatDate(material.updated_at)}</p>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <RoleGuard
                    allowedRoles={["admin", "asistente"]}
                    fallback={
                      <Button variant="outline" className="w-full" disabled>
                        Registrar Entrada
                      </Button>
                    }
                  >
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/inventario/${params.id}/entrada`}>Registrar Entrada</Link>
                    </Button>
                  </RoleGuard>
                  <RoleGuard
                    allowedRoles={["admin", "asistente"]}
                    fallback={
                      <Button variant="outline" className="w-full" disabled>
                        Registrar Salida
                      </Button>
                    }
                  >
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/inventario/${params.id}/salida`}>Registrar Salida</Link>
                    </Button>
                  </RoleGuard>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>Últimos movimientos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border-b pb-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay movimientos registrados</div>
            ) : (
              <div className="space-y-4">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getMovementIcon(movement.movement_type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {getMovementTypeText(movement.movement_type)}: {movement.quantity} {material.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {movement.previous_stock} → {movement.new_stock} {material.unit} •{" "}
                        {movement.users?.name || "Sistema"} • {movement.notes || "Sin notas"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(movement.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
