"use client"

import { useEffect, useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { fetchUsers, updateUser, type UserRow } from "@/services/superadmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  asistente: "Asistente",
  dentista: "Dentista",
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  superadmin: "destructive",
  admin: "default",
  asistente: "secondary",
  dentista: "secondary",
}

const PAGE_SIZE = 20

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState("all")
  const [filterClinic, setFilterClinic] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    setError(null)
    fetchUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdating(userId)
    try {
      await updateUser(userId, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      toast({ title: "Rol actualizado" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  // Unique clinics for filter
  const clinicOptions = Array.from(
    new Map(
      users
        .filter((u) => u.clinic_id && u.clinic_name)
        .map((u) => [u.clinic_id, u.clinic_name])
    ).entries()
  )

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false
    if (filterClinic !== "all" && u.clinic_id !== filterClinic) return false
    if (search) {
      const q = search.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="w-64 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
        />

        <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setPage(0) }}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-100">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-100">Todos los roles</SelectItem>
            <SelectItem value="superadmin" className="text-slate-100">Super Admin</SelectItem>
            <SelectItem value="admin" className="text-slate-100">Admin</SelectItem>
            <SelectItem value="dentista" className="text-slate-100">Dentista</SelectItem>
            <SelectItem value="asistente" className="text-slate-100">Asistente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterClinic} onValueChange={(v) => { setFilterClinic(v); setPage(0) }}>
          <SelectTrigger className="w-52 bg-slate-800 border-slate-600 text-slate-100">
            <SelectValue placeholder="Clínica" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-100">Todas las clínicas</SelectItem>
            {clinicOptions.map(([id, name]) => (
              <SelectItem key={id!} value={id!} className="text-slate-100">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="px-5 py-3.5 font-medium">Nombre</th>
                <th className="px-5 py-3.5 font-medium">Email</th>
                <th className="px-5 py-3.5 font-medium">Rol</th>
                <th className="px-5 py-3.5 font-medium">Clínica</th>
                <th className="px-5 py-3.5 font-medium">Registrado</th>
                <th className="px-5 py-3.5 font-medium">Cambiar rol</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay usuarios con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paged.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${updating === u.id ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-slate-100 font-medium">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-300">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={ROLE_VARIANT[u.role] ?? "outline"}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{u.clinic_name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {u.created_at
                        ? format(new Date(u.created_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role !== "superadmin" && (
                        <Select
                          value={u.role}
                          onValueChange={(role) => handleRoleChange(u.id, role)}
                          disabled={updating === u.id}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs bg-slate-700 border-slate-600 text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="admin" className="text-slate-100">Admin</SelectItem>
                            <SelectItem value="dentista" className="text-slate-100">Dentista</SelectItem>
                            <SelectItem value="asistente" className="text-slate-100">Asistente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700 text-sm text-slate-400">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
