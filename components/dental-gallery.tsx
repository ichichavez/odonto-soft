"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, Trash2, Camera, FileImage, Eye, Download } from "lucide-react"

interface DentalImage {
  id: string
  patient_id: string
  image_url: string
  description: string | null
  image_type: string
  created_at: string
}

interface DentalGalleryProps {
  patientId: string
}

export function DentalGallery({ patientId }: DentalGalleryProps) {
  const [images, setImages] = useState<DentalImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<DentalImage | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const { toast } = useToast()

  // Estado para el formulario de subida
  const [uploadForm, setUploadForm] = useState({
    description: "",
    image_type: "foto",
  })

  useEffect(() => {
    fetchImages()
  }, [patientId])

  const fetchImages = async () => {
    try {
      setLoading(true)

      // Simulamos la carga de imágenes desde localStorage para el modo demo
      const storedImages = localStorage.getItem(`dental_images_${patientId}`)
      if (storedImages) {
        setImages(JSON.parse(storedImages))
      } else {
        // Crear algunas imágenes de ejemplo para demostración
        const sampleImages: DentalImage[] = [
          {
            id: "sample-1",
            patient_id: patientId,
            image_url: "/placeholder.svg?height=300&width=300&text=Radiografía+Panorámica",
            description: "Radiografía panorámica inicial - Evaluación completa de la dentadura",
            image_type: "panoramica",
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "sample-2",
            patient_id: patientId,
            image_url: "/placeholder.svg?height=300&width=300&text=Foto+Frontal",
            description: "Fotografía frontal de sonrisa - Estado inicial del tratamiento",
            image_type: "foto",
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "sample-3",
            patient_id: patientId,
            image_url: "/placeholder.svg?height=300&width=300&text=Radiografía+Periapical",
            description: "Radiografía periapical molar superior derecho - Evaluación de raíz",
            image_type: "periapical",
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "sample-4",
            patient_id: patientId,
            image_url: "/placeholder.svg?height=300&width=300&text=Foto+Lateral",
            description: "Fotografía lateral derecha - Análisis de perfil",
            image_type: "foto",
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
        setImages(sampleImages)
        localStorage.setItem(`dental_images_${patientId}`, JSON.stringify(sampleImages))
      }
    } catch (error) {
      console.error("Error al cargar imágenes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Simular subida de archivo convirtiendo a base64 para el modo demo
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string

        // Crear nueva imagen
        const newImage: DentalImage = {
          id: `img_${Date.now()}`,
          patient_id: patientId,
          image_url: imageUrl,
          description: uploadForm.description,
          image_type: uploadForm.image_type,
          created_at: new Date().toISOString(),
        }

        // Actualizar estado y localStorage
        const updatedImages = [newImage, ...images]
        setImages(updatedImages)
        localStorage.setItem(`dental_images_${patientId}`, JSON.stringify(updatedImages))

        toast({
          title: "Imagen subida",
          description: "La imagen se ha subido correctamente (modo demo)",
        })

        // Limpiar formulario
        setUploadForm({ description: "", image_type: "foto" })
        setShowUploadDialog(false)
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error al subir imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const updatedImages = images.filter((img) => img.id !== imageId)
      setImages(updatedImages)
      localStorage.setItem(`dental_images_${patientId}`, JSON.stringify(updatedImages))

      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    }
  }

  const handleDownloadImage = (image: DentalImage) => {
    // En modo demo, simular descarga
    toast({
      title: "Descarga simulada",
      description: `Descargando: ${image.description || "Imagen dental"}`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case "foto":
        return <Camera className="h-4 w-4" />
      case "radiografia":
      case "panoramica":
      case "periapical":
      case "bitewing":
        return <FileImage className="h-4 w-4" />
      default:
        return <FileImage className="h-4 w-4" />
    }
  }

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      foto: "Fotografía",
      radiografia: "Radiografía",
      panoramica: "Panorámica",
      periapical: "Periapical",
      bitewing: "Bitewing",
      oclusal: "Oclusal",
      lateral: "Lateral",
    }
    return labels[type] || type
  }

  const getImageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      foto: "bg-blue-100 text-blue-800",
      radiografia: "bg-green-100 text-green-800",
      panoramica: "bg-purple-100 text-purple-800",
      periapical: "bg-orange-100 text-orange-800",
      bitewing: "bg-red-100 text-red-800",
      oclusal: "bg-yellow-100 text-yellow-800",
      lateral: "bg-indigo-100 text-indigo-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Galería Dental</CardTitle>
          <CardDescription>Fotos y radiografías del paciente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando imágenes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galería Dental
          </CardTitle>
          <CardDescription>
            Fotos y radiografías del paciente • {images.length} imagen{images.length !== 1 ? "es" : ""} • Modo Demo
          </CardDescription>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir Imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Nueva Imagen</DialogTitle>
              <DialogDescription>
                Sube una foto o radiografía del paciente. Las imágenes se guardan localmente en modo demo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_type">Tipo de Imagen</Label>
                <Select
                  value={uploadForm.image_type}
                  onValueChange={(value) => setUploadForm((prev) => ({ ...prev, image_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foto">Fotografía</SelectItem>
                    <SelectItem value="radiografia">Radiografía</SelectItem>
                    <SelectItem value="panoramica">Radiografía Panorámica</SelectItem>
                    <SelectItem value="periapical">Radiografía Periapical</SelectItem>
                    <SelectItem value="bitewing">Radiografía Bitewing</SelectItem>
                    <SelectItem value="oclusal">Radiografía Oclusal</SelectItem>
                    <SelectItem value="lateral">Fotografía Lateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe la imagen (ej: Radiografía panorámica inicial, Foto frontal post-tratamiento...)"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Archivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Máximo 5MB • Formatos: JPG, PNG, GIF, WEBP</p>
              </div>

              {uploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Subiendo imagen...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay imágenes disponibles</h3>
            <p className="text-sm mb-4">Sube la primera imagen dental del paciente para comenzar.</p>
            <Button onClick={() => setShowUploadDialog(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Subir Primera Imagen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={image.image_url || "/placeholder.svg"}
                      alt={image.description || "Imagen dental"}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setSelectedImage(image)}
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getImageTypeColor(image.image_type)}`}
                        >
                          {getImageTypeIcon(image.image_type)}
                          {getImageTypeLabel(image.image_type)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedImage(image)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadImage(image)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteImage(image.id)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(image.created_at)}</p>
                      {image.description && (
                        <p className="text-xs text-foreground line-clamp-2" title={image.description}>
                          {image.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Modal para ver imagen completa */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getImageTypeIcon(selectedImage.image_type)}
                  {getImageTypeLabel(selectedImage.image_type)}
                </DialogTitle>
                <DialogDescription>{formatDate(selectedImage.created_at)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center bg-muted rounded-lg p-4">
                  <img
                    src={selectedImage.image_url || "/placeholder.svg"}
                    alt={selectedImage.description || "Imagen dental"}
                    className="max-w-full max-h-96 object-contain rounded-lg border bg-white"
                  />
                </div>
                {selectedImage.description && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Descripción:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selectedImage.description}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => handleDownloadImage(selectedImage)} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button onClick={() => handleDeleteImage(selectedImage.id)} variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
