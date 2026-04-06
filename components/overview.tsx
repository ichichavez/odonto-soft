"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { appointmentService } from "@/services/appointments"

export function Overview() {
  const [data, setData] = useState<{ name: string; citas: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Inicializar array con todos los días del mes
    const days: { name: string; citas: number }[] = Array.from({ length: daysInMonth }, (_, i) => ({
      name: String(i + 1),
      citas: 0,
    }))

    appointmentService.getAll()
      .then((appointments: any[]) => {
        const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
        appointments.forEach((a: any) => {
          if (a.date?.startsWith(monthStr)) {
            const day = parseInt(a.date.split("-")[2], 10) - 1
            if (day >= 0 && day < days.length) {
              days[day].citas++
            }
          }
        })
        setData(days)
      })
      .catch(() => setData(days))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  const maxCitas = Math.max(...data.map(d => d.citas), 1)

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={data.length > 20 ? 4 : 1}
        />
        <YAxis
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, maxCitas + 1]}
          width={24}
        />
        <Tooltip
          formatter={(value: number) => [value, "Citas"]}
          labelFormatter={(label) => `Día ${label}`}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="citas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
