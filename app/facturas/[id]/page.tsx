"use client"

import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Download, Printer, Share2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useState, useEffect } from "react"
import { invoiceService } from "@/services/invoices"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function FacturaDetallePage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const [factura, setFactura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const data = await invoiceService.getById(params.id)
        setFactura(data)
      } catch (error) {
        console.error("Error al cargar factura:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la factura",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [params.id, toast])

  const handleMarkAsPaid = async () => {
    setProcessingAction(true)
    try {
      await invoiceService.markAsPaid(params.id)
      setFactura((prev: any) => ({ ...prev, status: "pagada" }))
      toast({
        title: "Factura actualizada",
        description: "La factura ha sido marcada como pagada",
      })
    } catch (error) {
      console.error("Error al marcar como pagada:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la factura",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleCancelInvoice = async () => {
    setProcessingAction(true)
    try {
      await invoiceService.cancel(params.id)
      setFactura((prev: any) => ({ ...prev, status: "anulada" }))
      toast({
        title: "Factura anulada",
        description: "La factura ha sido anulada correctamente",
      })
    } catch (error) {
      console.error("Error al anular factura:", error)
      toast({
        title: "Error",
        description: "No se pudo anular la factura",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
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

  if (loading) {
    return (
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>

        <Card className="border-2 border-muted">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <Skeleton className="h-16 w-40" />
                <Skeleton className="h-16 w-32" />
              </div>

              <Skeleton className="h-2 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-full mt-1" />
                </div>
                <div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </div>
              </div>

              <Skeleton className="h-40 w-full" />

              <div className="flex flex-col items-end space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Factura no encontrada</h2>
          <p className="text-muted-foreground mt-2">La factura que busca no existe o ha sido eliminada.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/facturas">Volver a Facturas</Link>
          </Button>
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
          <h1 className="text-2xl font-bold">Factura #{factura.number}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <Card className="border-2 border-muted">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6">
              {/* Cabecera de la factura */}
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <Image
                      src="/placeholder.svg?height=40&width=40"
                      alt="Logo"
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl">DentalSys</h2>
                    <p className="text-sm text-muted-foreground">Sistema de Administración Dental</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-xl">FACTURA</h3>
                  <p className="text-sm text-muted-foreground">#{factura.number}</p>
                </div>
              </div>

              <Separator />

              {/* Información de factura y cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Facturar a:</h3>
                  <p className="font-medium">
                    {factura.patients.first_name} {factura.patients.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {factura.patients.address || "Dirección no disponible"}
                  </p>
                  <p className="text-sm text-muted-foreground">{factura.patients.email || "Email no disponible"}</p>
                  <p className="text-sm text-muted-foreground">{factura.patients.phone || "Teléfono no disponible"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número de factura:</span>
                    <span>{factura.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de emisión:</span>
                    <span>{formatDate(factura.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vencimiento:</span>
                    <span>{formatDate(factura.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span>{getEstadoBadge(factura.status)}</span>
                  </div>
                </div>
              </div>

              {/* Detalle de la factura */}
              <div className="mt-6">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left">Tratamiento</th>
                        <th className="px-4 py-3 text-right">Precio</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factura.invoice_items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end space-y-2 pt-6">
                  <div className="flex w-full justify-between md:w-1/3">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>${factura.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full justify-between md:w-1/3">
                    <span className="text-muted-foreground">Impuestos ({factura.tax_rate}%):</span>
                    <span>${factura.tax_amount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 w-full md:w-1/3" />
                  <div className="flex w-full justify-between font-bold text-lg md:w-1/3">
                    <span>Total:</span>
                    <span>${factura.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Información de pago:</h3>
                  <p className="text-sm">
                    <span className="font-medium">Método de pago:</span> {factura.payment_method || "No especificado"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Banco:</span> Banco Nacional
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Cuenta:</span> ES12 3456 7890 1234 5678 9012
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Referencia:</span> {factura.number}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Notas:</h3>
                  <p className="text-sm">{factura.notes || "Sin notas adicionales"}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Presupuesto relacionado:</span>{" "}
                    {factura.budget_id ? (
                      <Link href={`/presupuestos/${factura.budget_id}`} className="text-emerald-600 hover:underline">
                        {factura.budgets?.number || "Ver presupuesto"}
                      </Link>
                    ) : (
                      "No disponible"
                    )}
                  </p>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-6">
                <p>Gracias por confiar en nuestros servicios</p>
                <p>DentalSys - Calle Principal 456, Ciudad - Tel: 555-123-4567 - info@dentalsys.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/facturas">Volver a Facturas</Link>
          </Button>
          <div className="flex gap-2">
            {factura.status === "pendiente" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                    disabled={processingAction}
                  >
                    Marcar como Pagada
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Marcar como pagada</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas marcar esta factura como pagada?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <RoleGuard allowedRoles={["admin"]}>
              {factura.status !== "anulada" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      disabled={processingAction}
                    >
                      Anular Factura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Anular factura</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas anular esta factura? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelInvoice} className="bg-red-600 hover:bg-red-700">
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </RoleGuard>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
