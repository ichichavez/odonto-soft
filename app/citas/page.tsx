"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userService } from "@/services/users"
import { WeekCalendar } from "@/components/calendar/week-calendar"
import { useBranch } from "@/context/branch-context"

export default function CitasPage() {
  const [dentists, setDentists] = useState<any[]>([])
  const [selectedDentist, setSelectedDentist] = useState("todos")
  const { activeBranch } = useBranch()

  useEffect(() => {
    userService.getDentists().then(setDentists).catch(console.error)
  }, [])

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <h1 className="text-2xl font-bold flex-1">Agenda de Citas</h1>

        <Select value={selectedDentist} onValueChange={setSelectedDentist}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dentista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los dentistas</SelectItem>
            {dentists.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button asChild>
          <Link href="/citas/nueva" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </div>

      {/* Calendar */}
      <WeekCalendar dentistFilter={selectedDentist} branchId={activeBranch?.id} />
    </div>
  )
}
