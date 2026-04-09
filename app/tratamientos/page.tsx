"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { RoleGuard } from "@/components/role-guard"
import { useEffect, useState } from "react"
import { treatmentService, type Treatment } from "@/services/treatments"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/context/branch-context"

export default function TratamientosPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { activeBranch } = useBranch()

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        setLoading(true)
        const data = await treatmentService.getAll(activeBranch?.id)
        setTreatments(data)
      } catch (error) {
        console.error("Error al cargar tratamientos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los tratamientos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTreatments()
  }, [toast, activeBranch?.id])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      return
    }

    const filtered = treatments.filter(
      (treatment) =>
        treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setTreatments(filtered)
  }

  const resetSearch = async () => {
    setSearchQuery("")
    const data = await treatmentService.getAll()
    setTreatments(data)
  }

  return (
    <RoleGuard allowedRoles={["admin", "dentista"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Catálogo de Tratamientos</h1>
          <RoleGuard allowedRoles={["admin"]}>
            <Link href="/tratamientos/nuevo">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Tratamiento
              </Button>
            </Link>
          </RoleGuard>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar tratamientos..."
              className="pl-8 w-full md:max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Buscar
          </Button>
          {searchQuery && (
            <Button variant="ghost" onClick={resetSearch}>
              Limpiar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Esqueletos de carga
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : treatments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">No se encontraron tratamientos</div>
          ) : (
            treatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{treatment.name}</CardTitle>
                  <CardDescription>Duración: {treatment.duration || "No especificada"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{treatment.description || "Sin descripción"}</p>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">${treatment.price.toFixed(2)}</div>
                    <div className="flex gap-2">
                      <RoleGuard allowedRoles={["admin"]}>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tratamientos/${treatment.id}/editar`}>Editar</Link>
                        </Button>
                      </RoleGuard>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tratamientos/${treatment.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
