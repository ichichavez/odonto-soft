"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleGuard } from "@/components/role-guard"
import { useEffect, useState } from "react"
import { inventoryService, type Material } from "@/services/inventory"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Package, Plus, Search, Settings } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InventarioPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("todas")
  const [categories, setCategories] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await inventoryService.categories.getAll()
        setCategories(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.materials.getAll()
        setMaterials(data)

        const lowStock = await inventoryService.materials.getLowStock()
        setLowStockMaterials(lowStock)
      } catch (error) {
        console.error("Error al cargar materiales:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los materiales",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [toast])

  const handleSearch = () => {
    // Implementar búsqueda
  }

  const getFilteredMaterials = () => {
    let filtered = [...materials]

    // Filtrar por categoría
    if (categoryFilter !== "todas") {
      filtered = filtered.filter((material) => material.category_id === categoryFilter)
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(query) ||
          material.description?.toLowerCase().includes(query) ||
          material.sku?.toLowerCase().includes(query),
      )
    }

    return filtered
  }

  const getStockStatusBadge = (material: Material) => {
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

  const filteredMaterials = getFilteredMaterials()

  return (
    <RoleGuard allowedRoles={["admin", "dentista", "asistente"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
          <div className="flex gap-2">
            <RoleGuard allowedRoles={["admin"]}>
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <Link href="/inventario/categorias">
                  <Settings className="h-4 w-4" />
                  Categorías
                </Link>
              </Button>
            </RoleGuard>
            <RoleGuard allowedRoles={["admin", "asistente"]}>
              <Button className="flex items-center gap-2" asChild>
                <Link href="/inventario/nuevo">
                  <Plus className="h-4 w-4" />
                  Nuevo Material
                </Link>
              </Button>
            </RoleGuard>
          </div>
        </div>

        <Tabs defaultValue="materiales">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materiales">Todos los Materiales</TabsTrigger>
            <TabsTrigger value="stock-bajo">Stock Bajo ({lowStockMaterials.length})</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="materiales" className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1 w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar materiales..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSearch}>
                  Buscar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                // Esqueletos de carga
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredMaterials.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No se encontraron materiales</div>
              ) : (
                filteredMaterials.map((material) => (
                  <Card key={material.id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{material.name}</CardTitle>
                      <CardDescription>
                        {material.material_categories?.name || "Sin categoría"} • {material.sku || "Sin SKU"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{material.description || "Sin descripción"}</p>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Stock: {material.stock_quantity} {material.unit}
                          </div>
                          <div>{getStockStatusBadge(material)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/inventario/${material.id}/movimientos`}>Movimientos</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/inventario/${material.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="stock-bajo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materiales con Stock Bajo</CardTitle>
                <CardDescription>Materiales que necesitan reposición</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
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
                ) : lowStockMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay materiales con stock bajo</div>
                ) : (
                  <div className="space-y-4">
                    {lowStockMaterials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {material.stock_quantity} {material.unit} (Mínimo:{" "}
                            {material.min_stock_quantity})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleGuard allowedRoles={["admin", "asistente"]}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                              <Link href={`/inventario/${material.id}/entrada`}>
                                <ArrowDown className="h-3.5 w-3.5" />
                                Entrada
                              </Link>
                            </Button>
                          </RoleGuard>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/inventario/${material.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movimientos">
            <MovimientosInventario />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}

function MovimientosInventario() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.movements.getAll()
        setMovements(data)
      } catch (error) {
        console.error("Error al cargar movimientos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los movimientos de inventario",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMovements()
  }, [toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos de Inventario</CardTitle>
        <CardDescription>Historial de entradas, salidas y ajustes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
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
                    {getMovementTypeText(movement.movement_type)}: {movement.materials.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {movement.quantity} {movement.materials.unit} • {movement.users?.name || "Sistema"} •{" "}
                    {movement.notes || "Sin notas"}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">{formatDate(movement.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
