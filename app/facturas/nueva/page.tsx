"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Calendar, Loader2, Minus, Plus, Search, Trash } from "lucide-react"
import Link from "next/link"
import { inventoryService } from "@/services/inventory"
import { invoiceService } from "@/services/invoices"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase"

export default function NuevaFacturaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const { clinic } = useClinic()

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Datos para la factura
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState([
    { id: "efectivo", name: "Efectivo" },
    { id: "tarjeta", name: "Tarjeta de crédito/débito" },
    { id: "transferencia", name: "Transferencia bancaria" },
    { id: "cheque", name: "Cheque" },
  ])

  // Filtros
  const [searchQuery, setSearchQuery] = useState("")

  // Datos de la factura
  const [selectedPatient, setSelectedPatient] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split("T")[0]
  })
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState(10)

  // Sync tax rate from clinic settings
  useEffect(() => {
    if (clinic?.tax_rate !== undefined) setTaxRate(clinic.tax_rate)
  }, [clinic?.tax_rate])

  // Items de la factura
  const [invoiceItems, setInvoiceItems] = useState<
    {
      type: "treatment" | "material"
      id: string
      name: string
      description: string
      quantity: number
      price: number
      total: number
      costPrice?: number
      profitPercentage?: number
    }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar pacientes
        const { data: patientsData, error: patientsError } = await createBrowserClient()
          .from("patients")
          .select("id, first_name, last_name")
          .order("last_name", { ascending: true })

        if (patientsError) throw patientsError
        setPatients(patientsData || [])

        // Cargar tratamientos
        const { data: treatmentsData, error: treatmentsError } = await createBrowserClient()
          .from("treatments")
          .select("id, name, description, price")
          .order("name", { ascending: true })

        if (treatmentsError) throw treatmentsError
        setTreatments(treatmentsData || [])

        // Cargar materiales
        const materialsData = await inventoryService.materials.getAll()
        setMaterials(materialsData)
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

  // Filtrar tratamientos y materiales según la búsqueda
  const filteredTreatments = treatments.filter((treatment) =>
    treatment.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Añadir tratamiento a la factura
  const addTreatment = (treatment: any) => {
    setInvoiceItems([
      ...invoiceItems,
      {
        type: "treatment",
        id: treatment.id,
        name: treatment.name,
        description: treatment.description || treatment.name,
        quantity: 1,
        price: treatment.price,
        total: treatment.price,
      },
    ])

    toast({
      title: "Tratamiento añadido",
      description: `${treatment.name} añadido a la factura`,
    })
  }

  // Añadir material a la factura
  const addMaterial = (material: any) => {
    setInvoiceItems([
      ...invoiceItems,
      {
        type: "material",
        id: material.id,
        name: material.name,
        description: material.description || material.name,
        quantity: 1,
        price: material.price,
        total: material.price,
        costPrice: material.cost_price || 0,
        profitPercentage: material.profit_percentage || 30,
      },
    ])

    toast({
      title: "Material añadido",
      description: `${material.name} añadido a la factura`,
    })
  }

  // Eliminar item de la factura
  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  // Actualizar cantidad de un item
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return

    setInvoiceItems(
      invoiceItems.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            quantity,
            total: item.price * quantity,
          }
        }
        return item
      }),
    )
  }

  // Actualizar precio de un item
  const updatePrice = (index: number, price: number) => {
    if (price < 0) return

    setInvoiceItems(
      invoiceItems.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            price,
            total: price * item.quantity,
          }
        }
        return item
      }),
    )
  }

  // Calcular subtotal
  const calculateSubtotal = () => {
    return invoiceItems.reduce((total, item) => total + item.total, 0)
  }

  // Calcular impuestos
  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100)
  }

  // Calcular total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  // Procesar la factura
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe iniciar sesión para realizar esta acción",
        variant: "destructive",
      })
      return
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Factura vacía",
        description: "Añada al menos un item a la factura",
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

      // Preparar datos para la factura
      const invoiceData = {
        patient_id: selectedPatient,
        created_by: user.id,
        date: invoiceDate,
        due_date: dueDate,
        subtotal: calculateSubtotal(),
        tax_rate: taxRate,
        tax_amount: calculateTax(),
        total: calculateTotal(),
        status: "pendiente",
        payment_method: paymentMethod,
        notes: notes,
        items: invoiceItems.map((item) => ({
          type: item.type,
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          costPrice: item.costPrice,
          profitPercentage: item.profitPercentage,
        })),
      }

      console.log("Datos de factura a enviar:", invoiceData)

      // Crear la factura
      const invoice = await invoiceService.createDirectInvoice(invoiceData)

      toast({
        title: "Factura creada",
        description: `La factura #${invoice.number} se ha creado correctamente`,
      })

      // Redirigir a la factura
      router.push(`/facturas/${invoice.id}`)
    } catch (error) {
      console.error("Error al crear la factura:", error)
      let errorMessage = "No se pudo crear la factura. Inténtelo de nuevo."

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error)
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            <Link href="/facturas">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nueva Factura</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Catálogo de servicios y productos */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Añadir Items a la Factura</CardTitle>
              <CardDescription>Seleccione tratamientos y materiales para incluir en la factura</CardDescription>

              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar tratamientos o materiales..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="treatments">
                <TabsList className="mb-4">
                  <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
                  <TabsTrigger value="materials">Materiales</TabsTrigger>
                </TabsList>

                <TabsContent value="treatments">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tratamiento</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTreatments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No se encontraron tratamientos
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTreatments.map((treatment) => (
                            <TableRow key={treatment.id}>
                              <TableCell className="font-medium">{treatment.name}</TableCell>
                              <TableCell>{treatment.description || "Sin descripción"}</TableCell>
                              <TableCell>${treatment.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => addTreatment(treatment)}>
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
                </TabsContent>

                <TabsContent value="materials">
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
                              <TableCell>${material.price.toFixed(2)}</TableCell>
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
                                  onClick={() => addMaterial(material)}
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Detalles de la factura */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Factura</CardTitle>
              <CardDescription>Información de la factura</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Fecha de emisión</Label>
                  <div className="relative">
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                  <div className="relative">
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
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
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Items de la factura</h3>

                {invoiceItems.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No hay items en la factura</div>
                ) : (
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.type === "treatment" ? "Tratamiento" : "Material"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="space-y-1">
                            <Label htmlFor={`quantity-${index}`}>Cantidad</Label>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 1)}
                                className="h-8 rounded-none text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`price-${index}`}>Precio unitario</Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updatePrice(index, Number.parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="mt-3 text-right font-medium">Subtotal: ${item.total.toFixed(2)}</div>
                      </div>
                    ))}

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
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || invoiceItems.length === 0 || !selectedPatient}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Crear Factura"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
