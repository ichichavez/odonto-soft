"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/role-guard"
import { ArrowLeft, Edit, Folder, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { inventoryService, type MaterialCategory } from "@/services/inventory"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function CategoriasInventarioPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [editCategory, setEditCategory] = useState<MaterialCategory | null>(null)
  const [openNewDialog, setOpenNewDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.categories.getAll()
      setCategories(data)
    } catch (error) {
      console.error("Error al cargar categorías:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return

    setIsSubmitting(true)

    try {
      await inventoryService.categories.create(newCategory)
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente",
      })
      setNewCategory({ name: "", description: "" })
      setOpenNewDialog(false)
      fetchCategories()
    } catch (error) {
      console.error("Error al crear categoría:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editCategory || !editCategory.name.trim()) return

    setIsSubmitting(true)

    try {
      await inventoryService.categories.update(editCategory.id, {
        name: editCategory.name,
        description: editCategory.description,
      })
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente",
      })
      setEditCategory(null)
      setOpenEditDialog(false)
      fetchCategories()
    } catch (error) {
      console.error("Error al actualizar categoría:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await inventoryService.categories.delete(id)
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente",
      })
      fetchCategories()
    } catch (error) {
      console.error("Error al eliminar categoría:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Asegúrese de que no tenga materiales asociados.",
        variant: "destructive",
      })
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventario">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Categorías de Materiales</h1>
          <div className="ml-auto">
            <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Categoría</DialogTitle>
                  <DialogDescription>Añada una nueva categoría para clasificar los materiales</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Nombre de la categoría"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descripción de la categoría"
                      value={newCategory.description || ""}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNewDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={isSubmitting || !newCategory.name.trim()}>
                    {isSubmitting ? "Creando..." : "Crear Categoría"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categorías Disponibles</CardTitle>
            <CardDescription>Gestione las categorías para clasificar los materiales de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border-b pb-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay categorías registradas</div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.description || "Sin descripción"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={openEditDialog && editCategory?.id === category.id}
                        onOpenChange={(open) => {
                          setOpenEditDialog(open)
                          if (!open) setEditCategory(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditCategory(category)
                              setOpenEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Categoría</DialogTitle>
                            <DialogDescription>Modifique los datos de la categoría</DialogDescription>
                          </DialogHeader>
                          {editCategory && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                  id="edit-name"
                                  placeholder="Nombre de la categoría"
                                  value={editCategory.name}
                                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Descripción (opcional)</Label>
                                <Textarea
                                  id="edit-description"
                                  placeholder="Descripción de la categoría"
                                  value={editCategory.description || ""}
                                  onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenEditDialog(false)}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleUpdateCategory}
                              disabled={isSubmitting || !editCategory?.name.trim()}
                            >
                              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría "
                              {category.name}". Asegúrese de que no haya materiales asociados a esta categoría.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
