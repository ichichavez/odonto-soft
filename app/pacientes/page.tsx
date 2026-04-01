"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { patientService, type Patient } from "@/services/patients"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const data = await patientService.getAll()
        setPatients(data)
      } catch (error) {
        console.error("Error al cargar pacientes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los pacientes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [toast])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Si la búsqueda está vacía, cargar todos los pacientes
      const data = await patientService.getAll()
      setPatients(data)
      return
    }

    try {
      setLoading(true)
      const data = await patientService.search(searchQuery)
      setPatients(data)
    } catch (error) {
      console.error("Error al buscar pacientes:", error)
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Link href="/pacientes/nuevo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pacientes..."
            className="pl-8 w-full md:max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha de Nacimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Esqueletos de carga
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono text-xs">{patient.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </TableCell>
                  <TableCell>{patient.phone || "N/A"}</TableCell>
                  <TableCell>{patient.email || "N/A"}</TableCell>
                  <TableCell>{formatDate(patient.birth_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pacientes/${patient.id}`}>Ver</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pacientes/${patient.id}/editar`}>Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && patients.length > 0 && (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm">
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
