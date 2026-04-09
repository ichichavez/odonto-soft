"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  TrendingDown, Plus, Trash2, ChevronLeft, ChevronRight,
  ReceiptText,
} from "lucide-react"
import {
  expenseService,
  type Expense,
  type ExpenseCategory,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/services/expenses"
import { useBranch } from "@/context/branch-context"

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  material_dental: "bg-blue-100 text-blue-800",
  equipo:          "bg-purple-100 text-purple-800",
  alquiler:        "bg-orange-100 text-orange-800",
  salario:         "bg-green-100 text-green-800",
  servicios:       "bg-yellow-100 text-yellow-800",
  limpieza:        "bg-teal-100 text-teal-800",
  marketing:       "bg-pink-100 text-pink-800",
  otro:            "bg-gray-100 text-gray-700",
}

function fmt(n: number) {
  return `₲ ${n.toLocaleString("es-PY")}`
}

function getMonthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`
  return { from, to }
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function GastosPage() {
  const { toast } = useToast()
  const { activeBranch } = useBranch()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [categoryFilter, setCategoryFilter] = useState<string>("todos")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { from, to } = getMonthRange(year, month)
      const data = await expenseService.getByDateRange(from, to, activeBranch?.id)
      setExpenses(data)
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los gastos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [year, month, activeBranch?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return
    setDeleting(id)
    try {
      await expenseService.delete(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      toast({ title: "Eliminado", description: "El gasto fue eliminado." })
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el gasto.", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const filtered = useMemo(() =>
    categoryFilter === "todos"
      ? expenses
      : expenses.filter(e => e.category === categoryFilter),
    [expenses, categoryFilter]
  )

  const totalMonth = useMemo(() =>
    expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  )

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + Number(e.amount)
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [expenses])

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })

  return (
    <div className="flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Gastos</h1>
        </div>
        <div className="ml-auto">
          <Button asChild className="flex items-center gap-2">
            <Link href="/gastos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo Gasto
            </Link>
          </Button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold w-44 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-destructive">{fmt(totalMonth)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Top categories */}
        {byCategory.length > 0 && (
          <Card className="sm:col-span-1 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-1">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {byCategory.map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat as ExpenseCategory]}`}>
                        {CATEGORY_LABELS[cat as ExpenseCategory]}
                      </span>
                      <span className="font-medium">{fmt(total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter + table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-3">
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Detalle de gastos
          </CardTitle>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No hay gastos registrados en este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Categoría</th>
                    <th className="text-left py-2 px-2">Descripción</th>
                    <th className="text-left py-2 px-2">Método</th>
                    <th className="text-right py-2 px-2">Monto</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 whitespace-nowrap font-medium">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[e.category]}`}>
                          {CATEGORY_LABELS[e.category]}
                        </span>
                      </td>
                      <td className="py-2 px-2 max-w-[220px]">
                        <p className="truncate">{e.description}</p>
                        {e.notes && (
                          <p className="text-xs text-muted-foreground truncate">{e.notes}</p>
                        )}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[e.payment_method]}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-destructive">
                        {fmt(Number(e.amount))}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={deleting === e.id}
                          onClick={() => handleDelete(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/40 font-semibold">
                    <td colSpan={4} className="py-2 px-2 text-right text-sm">
                      Total filtrado
                    </td>
                    <td className="py-2 px-2 text-right text-destructive">
                      {fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))}
                    </td>
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
