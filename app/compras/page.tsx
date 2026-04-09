"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ShoppingBag, Plus, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react"
import { purchaseService, type PurchaseWithItems } from "@/services/purchases"
import { useBranch } from "@/context/branch-context"

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function fmt(n: number) { return `₲ ${Number(n).toLocaleString("es-PY")}` }
function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) }

function getRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2,"0")}-01`
  const last = new Date(year, month, 0).getDate()
  const to   = `${year}-${String(month).padStart(2,"0")}-${last}`
  return { from, to }
}

export default function ComprasPage() {
  const { toast } = useToast()
  const { activeBranch } = useBranch()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [purchases, setPurchases] = useState<PurchaseWithItems[]>([])
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { from, to } = getRange(year, month)
      setPurchases(await purchaseService.getByDateRange(from, to, activeBranch?.id))
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las compras", variant: "destructive" })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year, month, activeBranch?.id]) // eslint-disable-line

  const prevMonth = () => { if (month === 1) { setYear(y=>y-1); setMonth(12) } else setMonth(m=>m-1) }
  const nextMonth = () => { if (month === 12) { setYear(y=>y+1); setMonth(1) } else setMonth(m=>m+1) }

  const totalMonth = useMemo(() => purchases.reduce((s,p) => s + Number(p.total), 0), [purchases])
  const totalItems = useMemo(() => purchases.reduce((s,p) => s + p.purchase_items.length, 0), [purchases])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta compra? El stock ya aplicado no se revertirá.")) return
    setDeleting(id)
    try {
      await purchaseService.delete(id)
      setPurchases(prev => prev.filter(p => p.id !== id))
      toast({ title: "Eliminado", description: "Compra eliminada." })
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la compra.", variant: "destructive" })
    } finally { setDeleting(null) }
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Compras</h1>
        </div>
        <div className="ml-auto">
          <Button asChild className="flex items-center gap-2">
            <Link href="/compras/nueva"><Plus className="h-4 w-4" /> Nueva Compra</Link>
          </Button>
        </div>
      </div>

      {/* Navegador mes */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-lg font-semibold w-44 text-center">{MONTH_NAMES[month-1]} {year}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total del mes</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-32"/> : <p className="text-2xl font-bold text-primary">{fmt(totalMonth)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Órdenes de compra</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-16"/> : <p className="text-2xl font-bold">{purchases.length}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ítems comprados</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-16"/> : <p className="text-2xl font-bold">{totalItems}</p>}</CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5"/>Órdenes del mes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30"/>
              <p>No hay compras en este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Proveedor</th>
                    <th className="text-center py-2 px-2">Ítems</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium">{fmtDate(p.date)}</td>
                      <td className="py-2 px-2">{p.supplier || <span className="text-muted-foreground italic">Sin proveedor</span>}</td>
                      <td className="py-2 px-2 text-center">{p.purchase_items.length}</td>
                      <td className="py-2 px-2 text-right font-semibold text-primary">{fmt(Number(p.total))}</td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/compras/${p.id}`}><Eye className="h-3.5 w-3.5"/></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            disabled={deleting===p.id} onClick={()=>handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5"/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/40 font-semibold">
                    <td colSpan={3} className="py-2 px-2 text-right text-sm">Total del mes</td>
                    <td className="py-2 px-2 text-right text-primary">{fmt(totalMonth)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
