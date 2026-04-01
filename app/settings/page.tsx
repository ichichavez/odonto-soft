"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { useClinic } from "@/context/clinic-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SmileIcon as Tooth, Upload, Palette, Building2, Users, FileSignature } from "lucide-react"
import Image from "next/image"
import { hexToHsl, getContrastColor } from "@/lib/color-utils"

function ColorPreview({ color }: { color: string }) {
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(color)
  if (!isValidHex) return null

  return (
    <div className="mt-4 rounded-lg border overflow-hidden">
      <div
        className="flex h-12 items-center gap-3 px-4"
        style={{ backgroundColor: color }}
      >
        <Tooth className="h-5 w-5" style={{ color: `hsl(${getContrastColor(color)})` }} />
        <span
          className="text-sm font-semibold"
          style={{ color: `hsl(${getContrastColor(color)})` }}
        >
          OdontoSoft — Vista previa
        </span>
      </div>
      <div className="p-3 bg-muted/30 text-xs text-muted-foreground">
        HSL: {hexToHsl(color)}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { clinic, loading, updateClinic, uploadLogo } = useClinic()
  const { toast } = useToast()

  const [clinicName, setClinicName] = useState("")
  const [colorInput, setColorInput] = useState("")
  const [consentTemplate, setConsentTemplate] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingColor, setSavingColor] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize state once clinic loads
  const initialized = useRef(false)
  if (clinic && !initialized.current) {
    setClinicName(clinic.name)
    setColorInput(clinic.primary_color)
    setConsentTemplate(clinic.consent_template ?? "")
    initialized.current = true
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const handleSaveConsent = async () => {
    setSavingConsent(true)
    const { error } = await updateClinic({ consent_template: consentTemplate })
    setSavingConsent(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el consentimiento.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: "Texto de consentimiento actualizado." })
    }
  }

  const handleSaveName = async () => {
    if (!clinicName.trim()) return
    setSavingName(true)
    const { error } = await updateClinic({ name: clinicName.trim() })
    setSavingName(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el nombre.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: "Nombre de clínica actualizado." })
    }
  }

  const handleSaveColor = async () => {
    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(colorInput)
    if (!isValidHex) {
      toast({ title: "Color inválido", description: "Use formato HEX como #10b981", variant: "destructive" })
      return
    }
    setSavingColor(true)
    const { error } = await updateClinic({ primary_color: colorInput })
    setSavingColor(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el color.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: "Color de tema actualizado." })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Solo se permiten imágenes.", variant: "destructive" })
      return
    }

    setUploadingLogo(true)
    const { url, error } = await uploadLogo(file)
    setUploadingLogo(false)

    if (error) {
      toast({ title: "Error al subir logo", description: String(error.message || error), variant: "destructive" })
    } else if (url) {
      toast({ title: "Logo actualizado", description: "El logo de la clínica fue guardado." })
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra la información y apariencia de tu clínica</p>
      </div>

      <Tabs defaultValue="clinica">
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="clinica" className="gap-2">
            <Building2 className="h-4 w-4" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="apariencia" className="gap-2">
            <Palette className="h-4 w-4" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileSignature className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Clínica */}
        <TabsContent value="clinica">
          <Card>
            <CardHeader>
              <CardTitle>Información de la clínica</CardTitle>
              <CardDescription>Actualiza el nombre de tu clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Nombre de la clínica</Label>
                <Input
                  id="clinic-name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Ej: Clínica Dental Sonrisas"
                />
              </div>
              <Button onClick={handleSaveName} disabled={savingName}>
                {savingName ? "Guardando..." : "Guardar nombre"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Apariencia */}
        <TabsContent value="apariencia" className="space-y-4">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Sube el logo de tu clínica (PNG, SVG o JPG recomendado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted overflow-hidden shrink-0">
                  {clinic?.logo_url ? (
                    <Image
                      src={clinic.logo_url}
                      alt="Logo"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <Tooth className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingLogo ? "Subiendo..." : "Subir logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG o SVG. Tamaño recomendado: 128×128px
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </CardContent>
          </Card>

          {/* Color */}
          <Card>
            <CardHeader>
              <CardTitle>Color principal</CardTitle>
              <CardDescription>Define el color de la marca de tu clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-md border shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(colorInput) ? colorInput : "#10b981",
                  }}
                  onClick={() => {
                    const picker = document.getElementById("color-picker") as HTMLInputElement
                    picker?.click()
                  }}
                />
                <input
                  id="color-picker"
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(colorInput) ? colorInput : "#10b981"}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="sr-only"
                />
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="#10b981"
                  className="font-mono max-w-[140px]"
                  maxLength={7}
                />
                <Button onClick={handleSaveColor} disabled={savingColor}>
                  {savingColor ? "Guardando..." : "Aplicar color"}
                </Button>
              </div>
              <ColorPreview color={colorInput} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Consentimiento informado</CardTitle>
              <CardDescription>
                Este texto se muestra al paciente al firmar la ficha odontológica. Se guarda una copia
                inmutable junto a cada firma, por lo que cambios futuros no afectan firmas anteriores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={consentTemplate}
                onChange={(e) => setConsentTemplate(e.target.value)}
                rows={14}
                placeholder="Escriba el texto del consentimiento informado..."
                className="font-mono text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {consentTemplate.length} caracteres
              </p>
              <Button onClick={handleSaveConsent} disabled={savingConsent}>
                {savingConsent ? "Guardando..." : "Guardar texto"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuarios */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de usuarios</CardTitle>
              <CardDescription>Administra los usuarios de tu clínica</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                La gestión avanzada de usuarios estará disponible en la próxima versión.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
