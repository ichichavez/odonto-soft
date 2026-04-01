"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Loader2, Minus, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { inventoryService } from "@/services/inventory"
import { invoiceService } from "@/services/invoices"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function VentaMaterialesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const [materials, setMaterials] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState("todas")
  const [searchQuery, setSearchQuery] = useState("")

  // Carrito
  const [cartItems, setCartItems] = useState<
    {
      materialId: string
      name: string
      quantity: number
      costPrice: number
      profitPercentage: number
      originalPrice: number
      customPrice: number | null
      unit: string
    }[]
  >([])

  // Datos de la venta
  const [selectedPatient, setSelectedPatient] = useState("")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState(21) // IVA por defecto

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar categorías
        const categoriesData = await inventoryService.categories.getAll()
        setCategories(categoriesData)

        // Cargar materiales
        const materialsData = await inventoryService.materials.getAll()
        setMaterials(materialsData)

        // Cargar pacientes
        const { data: patientsData, error: patientsError } = await createBrowserClient()
          .from("patients")
          .select("id, first_name, last_name")
          .order("last_name", { ascending: true })

        if (patientsError) throw patientsError
        setPatients(patientsData || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filtrar materiales según categoría y búsqueda
  const filteredMaterials = materials.filter((material) => {
    const matchesCategory = categoryFilter === "todas" || material.category_id === categoryFilter
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Añadir material al carrito
  const addToCart = (material: any) => {
    // Verificar si ya está en el carrito
    const existingItem = cartItems.find((item) => item.materialId === material.id)

    if (existingItem) {
      // Incrementar cantidad
      setCartItems(
        cartItems.map((item) => (item.materialId === material.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      // Añadir nuevo item
      setCartItems([
        ...cartItems,
        {
          materialId: material.id,
          name: material.name,
          quantity: 1,
          costPrice: material.cost_price || 0,
          profitPercentage: material.profit_percentage || 30,
          originalPrice: material.price,
          customPrice: null,
          unit: material.unit,
        },
      ])
    }

    toast({
      title: "Material añadido",
      description: `${material.name} añadido al carrito`,
    })
  }

  // Eliminar material del carrito
  const removeFromCart = (materialId: string) => {
    setCartItems(cartItems.filter((item) => item.materialId !== materialId))
  }

  // Actualizar cantidad de un material en el carrito
  const updateQuantity = (materialId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setCartItems(cartItems.map((item) => (item.materialId === materialId ? { ...item, quantity: newQuantity } : item)))
  }

  // Actualizar precio personalizado
  const updateCustomPrice = (materialId: string, newPrice: number | null) => {
    setCartItems(cartItems.map((item) => (item.materialId === materialId ? { ...item, customPrice: newPrice } : item)))
  }

  // Actualizar porcentaje de ganancia
  const updateProfitPercentage = (materialId: string, newPercentage: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.materialId === materialId
          ? {
              ...item,
              profitPercentage: newPercentage,
              customPrice: item.costPrice * (1 + newPercentage / 100),
            }
          : item,
      ),
    )
  }

  // Calcular subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.customPrice !== null ? item.customPrice : item.originalPrice
      return total + price * item.quantity
    }, 0)
  }

  // Calcular impuestos
  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100)
  }

  // Calcular total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  // Procesar la venta
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe iniciar sesión para realizar esta acción",
        variant: "destructive",
      })
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Añada materiales al carrito antes de continuar",
        variant: "destructive",
      })
      return
    }

    if (!selectedPatient) {
      toast({
        title: "Paciente requerido",
        description: "Seleccione un paciente para continuar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Preparar datos para la venta
      const saleData = {
        patientId: selectedPatient,
        userId: user.id,
        date: new Date().toISOString().split("T")[0],
        materials: cartItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salePrice: item.customPrice !== null ? item.customPrice : item.originalPrice,
          total: (item.customPrice !== null ? item.customPrice : item.originalPrice) * item.quantity,
        })),
        taxRate: taxRate,
        notes: notes,
        paymentMethod: "Efectivo",
      }

      // Crear factura para la venta de materiales
      const invoice = await invoiceService.createForMaterialSale(saleData)

      toast({
        title: "Venta completada",
        description: `La venta se ha registrado correctamente con la factura #${invoice.number}`,
      })

      // Redirigir a la factura
      router.push(`/facturas/${invoice.id}`)
    } catch (error) {
      console.error("Error al procesar la venta:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la venta. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para obtener el material del inventario
  const getMaterial = (materialId: string) => {
    return materials.find((m) => m.id === materialId)
  }

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventario">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Venta Directa de Materiales</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Catálogo de materiales */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Catálogo de Materiales</CardTitle>
              <CardDescription>Seleccione los materiales para vender</CardDescription>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4">
                <div className="relative flex-1 w-full">
                  <Input
                    type="search"
                    placeholder="Buscar materiales..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-auto">
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
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No se encontraron materiales
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{material.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {material.material_categories?.name || "Sin categoría"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>${material.price.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">
                                Costo: ${material.cost_price ? material.cost_price.toFixed(2) : "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {material.stock_quantity} {material.unit}
                              </span>
                              {material.stock_quantity <= 0 ? (
                                <Badge variant="destructive">Sin stock</Badge>
                              ) : material.stock_quantity <= material.min_stock_quantity ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  Stock bajo
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(material)}
                              disabled={material.stock_quantity <= 0}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Añadir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Carrito de venta */}
          <Card>
            <CardHeader>
              <CardTitle>Carrito de Venta</CardTitle>
              <CardDescription>Materiales seleccionados</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay materiales en el carrito</div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const material = getMaterial(item.materialId)
                    const itemPrice = item.customPrice !== null ? item.customPrice : item.originalPrice

                    return (
                      <div key={item.materialId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit} × ${itemPrice.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.materialId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="space-y-1">
                            <Label htmlFor={`quantity-${item.materialId}`}>Cantidad</Label>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => updateQuantity(item.materialId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                id={`quantity-${item.materialId}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.materialId, Number.parseInt(e.target.value) || 1)}
                                className="h-8 rounded-none text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => updateQuantity(item.materialId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`profit-${item.materialId}`}>% Ganancia</Label>
                            <Input
                              id={`profit-${item.materialId}`}
                              type="number"
                              min="0"
                              value={item.profitPercentage}
                              onChange={(e) =>
                                updateProfitPercentage(item.materialId, Number.parseInt(e.target.value) || 0)
                              }
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          <Label htmlFor={`price-${item.materialId}`}>Precio de venta</Label>
                          <Input
                            id={`price-${item.materialId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.customPrice !== null ? item.customPrice : item.originalPrice}
                            onChange={(e) => updateCustomPrice(item.materialId, Number.parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                          <div className="text-xs text-muted-foreground">
                            Precio calculado: ${(item.costPrice * (1 + item.profitPercentage / 100)).toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-3 text-right font-medium">
                          Subtotal: ${(itemPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    )
                  })}

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA ({taxRate}%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Paciente</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tasa de impuesto (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number.parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input
                      id="notes"
                      placeholder="Notas adicionales"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || cartItems.length === 0 || !selectedPatient}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Completar Venta"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}

import { createBrowserClient } from "@/lib/supabase"
