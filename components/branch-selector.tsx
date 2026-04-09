"use client"

import { useAuth } from "@/context/auth-context"
import { useBranch } from "@/context/branch-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

export function BranchSelector() {
  const { user } = useAuth()
  const { branches, activeBranch, setActiveBranch } = useBranch()

  if (!user) return null

  // No-admin: badge con nombre de su sucursal (sin selector)
  if (user.role !== "admin") {
    if (!activeBranch) return null
    return (
      <div className="px-3 py-2">
        <Badge variant="secondary" className="flex items-center gap-1 w-full justify-center text-xs">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{activeBranch.name}</span>
        </Badge>
      </div>
    )
  }

  // Admin: selector completo
  if (branches.length === 0) return null

  return (
    <div className="px-3 py-2">
      <Select
        value={activeBranch?.id ?? "todas"}
        onValueChange={(val) => {
          if (val === "todas") {
            setActiveBranch(null)
          } else {
            const branch = branches.find((b) => b.id === val) ?? null
            setActiveBranch(branch)
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs w-full">
          <MapPin className="h-3 w-3 shrink-0 mr-1" />
          <SelectValue placeholder="Todas las sucursales" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las sucursales</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
