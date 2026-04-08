"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { patientFilesService, FILE_TYPE_LABELS, type FileType } from "@/services/patient-files"
import { useClinic } from "@/context/clinic-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { PatientFile } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Upload, Trash2, ZoomIn, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"

const FILE_TYPES: FileType[] = ["radiografia", "foto_intraoral", "foto_extraoral", "interconsulta", "documento", "otro"]

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)
}

interface FileCardProps {
  file: PatientFile
  onDelete: (id: string) => void
  onPreview: (file: PatientFile) => void
}

function FileCard({ file, onDelete, onPreview }: FileCardProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este archivo?")) return
    setDeleting(true)
    try {
      await patientFilesService.delete(file.id)
      onDelete(file.id)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div
        className="relative h-36 bg-muted cursor-pointer"
        onClick={() => onPreview(file)}
      >
        {isImage(file.file_url) ? (
          <Image src={file.file_url} alt={file.file_name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium truncate" title={file.file_name}>{file.file_name}</p>
        {file.taken_at && (
          <p className="text-xs text-muted-foreground">
            {new Date(file.taken_at).toLocaleDateString("es-PY")}
          </p>
        )}
        {file.notes && (
          <p className="text-xs text-muted-foreground truncate" title={file.notes}>{file.notes}</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-1.5 right-1.5 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  patientId: string
  initialType?: FileType
  onUploaded: (file: PatientFile) => void
}

function UploadDialog({ open, onClose, patientId, initialType = "otro", onUploaded }: UploadDialogProps) {
  const [fileType, setFileType] = useState<FileType>(initialType)
  const [notes, setNotes] = useState("")
  const [takenAt, setTakenAt] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { clinic } = useClinic()
  const { user } = useAuth()

  const reset = () => { setFile(null); setNotes(""); setTakenAt(""); setFileType(initialType) }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await patientFilesService.upload(file, patientId, fileType, {
        notes: notes || undefined,
        takenAt: takenAt || undefined,
        clinicId: clinic?.id,
        uploadedBy: user?.id,
      })
      onUploaded(uploaded)
      reset()
      onClose()
      toast({ title: "Archivo subido", description: file.name })
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir archivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de archivo</Label>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFileType(t)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs border transition-colors",
                    fileType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {FILE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-accent",
              file ? "border-primary bg-accent" : "border-border"
            )}
          >
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clic para seleccionar archivo</p>
                <p className="text-xs text-muted-foreground">Imágenes o PDF</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha de la imagen</Label>
              <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descripción" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose() }}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PreviewDialogProps {
  file: PatientFile | null
  onClose: () => void
}

function PreviewDialog({ file, onClose }: PreviewDialogProps) {
  if (!file) return null
  return (
    <Dialog open={!!file} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm truncate">{file.file_name}</DialogTitle>
        </DialogHeader>
        {isImage(file.file_url) ? (
          <div className="relative h-[60vh]">
            <Image src={file.file_url} alt={file.file_name} fill className="object-contain rounded-md" />
          </div>
        ) : (
          <iframe src={file.file_url} className="h-[60vh] w-full rounded-md border" title={file.file_name} />
        )}
        {file.notes && <p className="text-sm text-muted-foreground">{file.notes}</p>}
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ──────────────────────────────────────────────────

interface PatientGalleryProps {
  patientId: string
}

export function PatientGallery({ patientId }: PatientGalleryProps) {
  const [files, setFiles] = useState<PatientFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<FileType | "all">("all")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<PatientFile | null>(null)

  useEffect(() => {
    patientFilesService
      .getByPatient(patientId)
      .then(setFiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  const filtered = activeType === "all" ? files : files.filter((f) => f.file_type === activeType)

  const countByType = (t: FileType) => files.filter((f) => f.file_type === t).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Galería</h2>
        <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-3.5 w-3.5" />
          Subir archivo
        </Button>
      </div>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">
            Todos {files.length > 0 && `(${files.length})`}
          </TabsTrigger>
          {FILE_TYPES.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">
              {FILE_TYPE_LABELS[t]} {countByType(t) > 0 && `(${countByType(t)})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeType} className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Upload className="h-8 w-8 opacity-40" />
              <p className="text-sm">Sin archivos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  onDelete={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))}
                  onPreview={setPreview}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        patientId={patientId}
        initialType={activeType === "all" ? "otro" : activeType}
        onUploaded={(f) => setFiles((prev) => [f, ...prev])}
      />

      <PreviewDialog file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
