"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Printer, ShoppingBag, Calendar, User, Package } from "lucide-react"
import { purchaseService, type PurchaseWithItems } from "@/services/purchases"

function fmt(n: number) { return `₲ ${Number(n).toLocaleString("es-PY")}` }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

export default function CompraDetailPage() {
  const params = useParams() as { id: string }
  const { toast } = useToast()
  const [purchase, setPurchase] = useState<PurchaseWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    purchaseService.getById(params.id)
      .then(setPurchase)
      .catch(() => toast({ title: "Error", description: "No se pudo cargar la compra.", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [params.id]) // eslint-disable-line

  if (loading) return (
    <div className="flex flex-col p-6 space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  )

  if (!purchase) return (
    <div className="flex flex-col p-6 items-center justify-center text-muted-foreground py-20">
      <ShoppingBag className="h-12 w-12 mb-2 opacity-30" />
      <p>Compra no encontrada</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/compras">Volver a Compras</Link>
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-3xl">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="flex items-center gap-4 no-print">
        <Button variant="outline" size="icon" asChild>
          <Link href="/compras"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Detalle de Compra</h1>
        <div className="ml-auto">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Header info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Información de la Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{fmtDate(purchase.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Proveedor</p>
                <p className="font-medium">
                  {purchase.supplier || <span className="italic text-muted-foreground">Sin proveedor</span>}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Registrado por</p>
                <p className="font-medium">{purchase.users?.name || "—"}</p>
              </div>
            </div>
          </div>
          {purchase.notes && (
            <div className="mt-4 pt-4 border-t text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notas</p>
              <p>{purchase.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>Materiales Comprados</CardTitle>
          <CardDescription>{purchase.purchase_items.length} ítem(s) — Stock actualizado automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase">
                  <th className="text-left py-2 px-2">Descripción</th>
                  <th className="text-left py-2 px-2">Material</th>
                  <th className="text-right py-2 px-2 w-20">Cant.</th>
                  <th className="text-right py-2 px-2 w-28">Costo unit.</th>
                  <th className="text-right py-2 px-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.purchase_items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-2">{item.description}</td>
                    <td className="py-2 px-2">
                      {item.materials
                        ? <Badge variant="outline" className="text-xs">{item.materials.name} ({item.materials.unit})</Badge>
                        : <span className="text-muted-foreground italic text-xs">Manual</span>}
                    </td>
                    <td className="py-2 px-2 text-right">{Number(item.quantity).toLocaleString("es-PY")}</td>
                    <td className="py-2 px-2 text-right">{fmt(Number(item.unit_cost))}</td>
                    <td className="py-2 px-2 text-right font-medium">{fmt(Number(item.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold bg-muted/30">
                  <td colSpan={4} className="py-3 px-2 text-right">TOTAL</td>
                  <td className="py-3 px-2 text-right text-primary text-base">{fmt(Number(purchase.total))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
