"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"
import { patientFilesService } from "@/services/patient-files"
import { patientService } from "@/services/patients"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PatientAvatarProps {
  patientId: string
  avatarUrl: string | null
  name: string
  size?: "sm" | "md" | "lg"
  editable?: boolean
  onUpdated?: (url: string) => void
}

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

export function PatientAvatar({
  patientId,
  avatarUrl,
  name,
  size = "md",
  editable = false,
  onUpdated,
}: PatientAvatarProps) {
  const [currentUrl, setCurrentUrl] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo imágenes", description: "Selecciona un archivo de imagen.", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const url = await patientFilesService.uploadAvatar(file, patientId)
      await patientService.update(patientId, { avatar_url: url })
      setCurrentUrl(url)
      onUpdated?.(url)
      toast({ title: "Foto actualizada" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      e.target.value = ""
    }
  }

  return (
    <div className={cn("relative shrink-0 group", SIZE_CLASSES[size])}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary font-semibold select-none",
          SIZE_CLASSES[size]
        )}
      >
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={name}
            fill
            className="object-cover rounded-full"
          />
        ) : (
          getInitials(name)
        )}
      </div>

      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
              uploading && "opacity-100"
            )}
            aria-label="Cambiar foto"
          >
            <Camera className="h-1/3 w-1/3 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
