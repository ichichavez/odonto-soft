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
import { SmileIcon as Tooth, Upload, Palette, Building2, Users, FileSignature, Stethoscope, Percent } from "lucide-react"
import Image from "next/image"
import { hexToHsl, getContrastColor } from "@/lib/color-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCIES } from "@/lib/currency"
import { SignaturePad } from "@/components/signature-pad"

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
  const { clinic, loading, updateClinic, uploadLogo, uploadSignature } = useClinic()
  const { toast } = useToast()

  const [clinicName, setClinicName] = useState("")
  const [colorInput, setColorInput] = useState("")
  const [consentTemplate, setConsentTemplate] = useState("")
  const [currency, setCurrency] = useState("PYG")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const [savingSignaturePad, setSavingSignaturePad] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingColor, setSavingColor] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [savingProfessional, setSavingProfessional] = useState(false)
  const [taxRate, setTaxRate] = useState("10")
  const [savingTax, setSavingTax] = useState(false)
  const [doctorName, setDoctorName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [professionalRegistration, setProfessionalRegistration] = useState("")
  const [clinicAddress, setClinicAddress] = useState("")
  const [clinicPhone, setClinicPhone] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  // Initialize state once clinic loads
  const initialized = useRef(false)
  if (clinic && !initialized.current) {
    setClinicName(clinic.name)
    setColorInput(clinic.primary_color)
    setConsentTemplate(clinic.consent_template ?? "")
    setCurrency(clinic.currency ?? "PYG")
    setTaxRate(String(clinic.tax_rate ?? 10))
    setDoctorName(clinic.doctor_name ?? "")
    setSpecialty(clinic.specialty ?? "")
    setProfessionalRegistration(clinic.professional_registration ?? "")
    setClinicAddress(clinic.address ?? "")
    setClinicPhone(clinic.phone ?? "")
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

  const handleSaveCurrency = async () => {
    setSavingCurrency(true)
    const { error } = await updateClinic({ currency })
    setSavingCurrency(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la moneda.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: "Moneda actualizada." })
    }
  }

  const handleSaveTax = async () => {
    const value = parseFloat(taxRate)
    if (isNaN(value) || value < 0 || value > 100) {
      toast({ title: "Valor inválido", description: "El impuesto debe ser un número entre 0 y 100.", variant: "destructive" })
      return
    }
    setSavingTax(true)
    const { error } = await updateClinic({ tax_rate: value })
    setSavingTax(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el impuesto.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: `Impuesto configurado al ${value}%.` })
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

  const handleSaveProfessional = async () => {
    setSavingProfessional(true)
    const { error } = await updateClinic({
      doctor_name: doctorName.trim() || null,
      specialty: specialty.trim() || null,
      professional_registration: professionalRegistration.trim() || null,
      address: clinicAddress.trim() || null,
      phone: clinicPhone.trim() || null,
    })
    setSavingProfessional(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la información profesional.", variant: "destructive" })
    } else {
      toast({ title: "Guardado", description: "Información profesional actualizada." })
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Solo se permiten imágenes.", variant: "destructive" })
      return
    }

    setUploadingSignature(true)
    const { url, error } = await uploadSignature(file)
    setUploadingSignature(false)

    if (error) {
      toast({ title: "Error al subir firma", description: String(error.message || error), variant: "destructive" })
    } else if (url) {
      toast({ title: "Firma actualizada", description: "La firma fue guardada correctamente." })
    }
  }

  const handleSignaturePadSave = async (blob: Blob) => {
    setSavingSignaturePad(true)
    const file = new File([blob], "signature.png", { type: "image/png" })
    const { error } = await uploadSignature(file)
    setSavingSignaturePad(false)
    if (error) {
      toast({ title: "Error al guardar firma", description: String(error.message || error), variant: "destructive" })
    } else {
      toast({ title: "Firma guardada", description: "La firma fue guardada correctamente." })
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
          <TabsTrigger value="profesional" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Profesional
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

          <Card>
            <CardHeader>
              <CardTitle>Moneda</CardTitle>
              <CardDescription>
                Moneda utilizada en facturas, presupuestos y reportes. Por defecto: Guaraní paraguayo (₲).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda de la clínica</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveCurrency} disabled={savingCurrency}>
                {savingCurrency ? "Guardando..." : "Guardar moneda"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Impuestos</CardTitle>
              </div>
              <CardDescription>
                Porcentaje de impuesto aplicado en facturas y presupuestos. Usa 0 para no aplicar impuesto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tasa de impuesto (%)</Label>
                <div className="flex items-center gap-3 max-w-xs">
                  <div className="relative flex-1">
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="pr-8"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      %
                    </span>
                  </div>
                  <Button onClick={handleSaveTax} disabled={savingTax}>
                    {savingTax ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor actual guardado:{" "}
                  <span className="font-medium text-foreground">
                    {clinic?.tax_rate ?? 10}%
                  </span>
                </p>
              </div>
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

        {/* Tab: Profesional */}
        <TabsContent value="profesional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del profesional</CardTitle>
              <CardDescription>
                Datos que aparecen en recetas, indicaciones y otros documentos impresos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor-name">Nombre del doctor/a</Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. María García"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Odontología General"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-reg">Registro profesional</Label>
                  <Input
                    id="prof-reg"
                    value={professionalRegistration}
                    onChange={(e) => setProfessionalRegistration(e.target.value)}
                    placeholder="Nro. 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Teléfono</Label>
                  <Input
                    id="clinic-phone"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+595 21 xxxxxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-address">Dirección</Label>
                <Input
                  id="clinic-address"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Av. Principal 123, Ciudad"
                />
              </div>
              <Button onClick={handleSaveProfessional} disabled={savingProfessional}>
                {savingProfessional ? "Guardando..." : "Guardar información"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firma digital</CardTitle>
              <CardDescription>
                Dibuja tu firma con el mouse o sube una imagen. Se mostrará en recetas e indicaciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Firma actual */}
              {clinic?.signature_url && (
                <div className="space-y-2">
                  <Label>Firma actual</Label>
                  <div className="inline-block border rounded-lg p-3 bg-white">
                    <Image
                      src={clinic.signature_url}
                      alt="Firma"
                      width={240}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Opción 1: Dibujar */}
              <div className="space-y-2">
                <Label>Dibujar firma</Label>
                <SignaturePad onSave={handleSignaturePadSave} saving={savingSignaturePad} />
              </div>

              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground px-1">o</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Opción 2: Subir imagen */}
              <div className="space-y-2">
                <Label>Subir imagen de firma</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingSignature ? "Subiendo..." : "Subir imagen"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG o JPG con fondo transparente o blanco</p>
                </div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureUpload}
                />
              </div>
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
