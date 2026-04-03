"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, FileText, Printer, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { budgetService } from "@/services/budgets"
import { invoiceService } from "@/services/invoices"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

export default function PresupuestoDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true)
        const data = await budgetService.getById(params.id)
        setPresupuesto(data)
      } catch (error) {
        console.error("Error al cargar presupuesto:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el presupuesto",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBudget()
  }, [params.id, toast])

  const handleGenerateInvoice = async () => {
    if (!user) return

    setIsGeneratingInvoice(true)

    try {
      const invoice = await invoiceService.createFromBudget(params.id, user.id)

      toast({
        title: "Factura generada",
        description: `Se ha generado la factura ${invoice.number} a partir del presupuesto ${presupuesto.number}`,
      })

      router.push(`/facturas/${invoice.id}`)
    } catch (error) {
      console.error("Error al generar factura:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la factura",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingInvoice(false)
    }
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
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <div className="flex flex-col items-end space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
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

  if (!presupuesto) {
    return (
      <div className="flex flex-col p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Presupuesto no encontrado</h2>
          <p className="text-muted-foreground mt-2">El presupuesto que busca no existe o ha sido eliminado.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/presupuestos">Volver a Presupuestos</Link>
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
            <Link href="/presupuestos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Presupuesto #{presupuesto.number}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <RoleGuard allowedRoles={["admin", "dentista"]}>
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <Link href={`/presupuestos/${params.id}/editar`}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </RoleGuard>
            {presupuesto.status === "aceptado" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Generar Factura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Generar Factura</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas generar una factura a partir de este presupuesto? Esta acción no se
                      puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGenerateInvoice}
                      disabled={isGeneratingInvoice}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isGeneratingInvoice ? "Generando..." : "Generar Factura"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detalle del Presupuesto</CardTitle>
              <CardDescription>Tratamientos incluidos en el presupuesto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Tratamiento</th>
                        <th className="px-4 py-2 text-left">Diente</th>
                        <th className="px-4 py-2 text-right">Precio</th>
                        <th className="px-4 py-2 text-right">Cantidad</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presupuesto.budget_items.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-muted-foreground">{item.tooth ?? "—"}</td>
                          <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end space-y-1 pt-4">
                  <div className="flex w-full justify-between border-b pb-2 md:w-1/2">
                    <span>Subtotal:</span>
                    <span>${presupuesto.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full justify-between border-b pb-2 md:w-1/2">
                    <span>Impuestos ({presupuesto.tax_rate}%):</span>
                    <span>${presupuesto.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full justify-between font-bold md:w-1/2">
                    <span>Total:</span>
                    <span>${presupuesto.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                <p>Notas: {presupuesto.notes || "Sin notas adicionales"}</p>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
              <div className="pt-2">{getEstadoBadge(presupuesto.status)}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Número de Presupuesto</h3>
                <p>{presupuesto.number}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Fecha</h3>
                <p>{formatDate(presupuesto.date)}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Paciente</h3>
                <p>
                  {presupuesto.patients.first_name} {presupuesto.patients.last_name}
                </p>
                <p className="text-sm text-muted-foreground">ID: {presupuesto.patients.id.substring(0, 8)}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Contacto</h3>
                <p>{presupuesto.patients.email || "No disponible"}</p>
                <p>{presupuesto.patients.phone || "No disponible"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
