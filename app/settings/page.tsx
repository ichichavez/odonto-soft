"use client"

import { useState, useRef, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { SmileIcon as Tooth, Upload, Palette, Building2, Users, FileSignature, Stethoscope, Percent, UserPlus, Trash2, RefreshCw, MapPin, Pencil, PowerOff, Power, Plus, FileUp, FileDown, X, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { hexToHsl, getContrastColor } from "@/lib/color-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCIES } from "@/lib/currency"
import { SignaturePad } from "@/components/signature-pad"
import { createBrowserClient } from "@/lib/supabase"
import { consentTemplateService, type ConsentTemplate, BUILTIN_TEMPLATES, SPECIALTY_LABELS } from "@/services/consent-templates"

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

  // ── Gestión de sucursales ─────────────────────────────────────────────
  const [branches, setBranches] = useState<any[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchDialog, setBranchDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<any | null>(null)
  const [branchForm, setBranchForm] = useState({ name: "", address: "", phone: "" })
  const [savingBranch, setSavingBranch] = useState(false)

  // ── Gestión de plantillas de consentimiento ───────────────────────────
  const [consentTemplates, setConsentTemplates] = useState<ConsentTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateDialog, setTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ConsentTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: "", specialty: "general", content: "" })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const templateFileRef = useRef<HTMLInputElement>(null)

  // ── Gestión de usuarios ───────────────────────────────────────────────
  const [clinicUsers, setClinicUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [newUserDialog, setNewUserDialog] = useState(false)
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "asistente" })
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

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

  // ── Helpers de sucursales ─────────────────────────────────────────────
  const loadBranches = async () => {
    setLoadingBranches(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/admin/branches", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setBranches(await res.json())
    } catch (e: any) {
      toast({ title: "Error al cargar sucursales", description: e.message, variant: "destructive" })
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => { loadBranches() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveBranch = async () => {
    if (!branchForm.name.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" }); return
    }
    setSavingBranch(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const method = editingBranch ? "PATCH" : "POST"
      const body = editingBranch
        ? { id: editingBranch.id, ...branchForm }
        : branchForm

      const res = await fetch("/api/admin/branches", {
        method,
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: editingBranch ? "Sucursal actualizada" : "Sucursal creada" })
      setBranchDialog(false)
      setEditingBranch(null)
      setBranchForm({ name: "", address: "", phone: "" })
      await loadBranches()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSavingBranch(false)
    }
  }

  const handleToggleBranch = async (branch: any) => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/admin/branches", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: branch.id, is_active: !branch.is_active }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: branch.is_active ? "Sucursal desactivada" : "Sucursal activada" })
      await loadBranches()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  // ── Helpers de plantillas de consentimiento ───────────────────────────
  const loadConsentTemplates = async () => {
    if (!clinic?.id) return
    setLoadingTemplates(true)
    try {
      const data = await consentTemplateService.getByClinic(clinic.id)
      setConsentTemplates(data)
    } catch (e: any) {
      toast({ title: "Error al cargar plantillas", description: e.message, variant: "destructive" })
    } finally {
      setLoadingTemplates(false)
    }
  }

  useEffect(() => { if (clinic?.id) loadConsentTemplates() }, [clinic?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const openTemplateDialog = (tmpl?: ConsentTemplate) => {
    if (tmpl) {
      setEditingTemplate(tmpl)
      setTemplateForm({ name: tmpl.name, specialty: tmpl.specialty, content: tmpl.content })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ name: "", specialty: "general", content: "" })
    }
    setTemplateDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast({ title: "Nombre y contenido son requeridos", variant: "destructive" }); return
    }
    if (!clinic?.id) return
    setSavingTemplate(true)
    try {
      if (editingTemplate) {
        await consentTemplateService.update(editingTemplate.id, {
          name: templateForm.name.trim(),
          specialty: templateForm.specialty,
          content: templateForm.content,
        })
      } else {
        await consentTemplateService.create({
          clinic_id: clinic.id,
          name: templateForm.name.trim(),
          specialty: templateForm.specialty,
          content: templateForm.content,
        })
      }
      toast({ title: editingTemplate ? "Plantilla actualizada" : "Plantilla creada" })
      setTemplateDialog(false)
      await loadConsentTemplates()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (tmpl: ConsentTemplate) => {
    if (!confirm(`¿Eliminar la plantilla "${tmpl.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await consentTemplateService.delete(tmpl.id)
      setConsentTemplates((prev) => prev.filter((t) => t.id !== tmpl.id))
      toast({ title: "Plantilla eliminada" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleAddBuiltin = async (builtin: typeof BUILTIN_TEMPLATES[number]) => {
    if (!clinic?.id) return
    try {
      await consentTemplateService.create({ clinic_id: clinic.id, ...builtin })
      toast({ title: "Plantilla agregada", description: `"${builtin.name}" fue agregada a tus plantillas.` })
      await loadConsentTemplates()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const name = file.name.replace(/\.[^.]+$/, "")
      setEditingTemplate(null)
      setTemplateForm({ name, specialty: "general", content: text })
      setTemplateDialog(true)
    }
    reader.readAsText(file, "utf-8")
  }

  const handleExportTemplate = (tmpl: ConsentTemplate) => {
    const blob = new Blob([tmpl.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tmpl.name.replace(/\s+/g, "_")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNotificationMinutesChange = async (userId: string, minutes: number) => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notification_before_minutes: minutes }),
      })
      if (!res.ok) throw new Error(await res.text())
      setClinicUsers(prev => prev.map(u => u.id === userId ? { ...u, notification_before_minutes: minutes } : u))
      toast({ title: "Preferencia guardada" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleUserBranchChange = async (userId: string, branchId: string) => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, branch_id: branchId === "ninguna" ? null : branchId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setClinicUsers(prev => prev.map(u => u.id === userId ? { ...u, branch_id: branchId === "ninguna" ? null : branchId } : u))
      toast({ title: "Sucursal actualizada" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  // ── Helpers de usuarios ───────────────────────────────────────────────
  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const loadClinicUsers = async () => {
    setLoadingUsers(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch("/api/admin/users", { headers })
      if (res.ok) setClinicUsers(await res.json())
      else throw new Error(await res.text())
    } catch (e: any) {
      toast({ title: "Error al cargar usuarios", description: e.message, variant: "destructive" })
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => { loadClinicUsers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateUser = async () => {
    const { name, email, password, role } = newUserForm
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Completa todos los campos", variant: "destructive" }); return
    }
    if (password.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return
    }
    setCreatingUser(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Usuario creado", description: `${name} fue agregado exitosamente.` })
      setNewUserDialog(false)
      setNewUserForm({ name: "", email: "", password: "", role: "asistente" })
      await loadClinicUsers()
    } catch (e: any) {
      toast({ title: "Error al crear usuario", description: e.message, variant: "destructive" })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingUserId(userId)
    try {
      const headers = await getAuthHeader()
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      if (!res.ok) throw new Error(await res.text())
      setClinicUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast({ title: "Rol actualizado" })
    } catch (e: any) {
      toast({ title: "Error al cambiar rol", description: e.message, variant: "destructive" })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) return
    setDeletingUserId(userId)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE", headers })
      if (!res.ok) throw new Error(await res.text())
      setClinicUsers(prev => prev.filter(u => u.id !== userId))
      toast({ title: "Usuario eliminado" })
    } catch (e: any) {
      toast({ title: "Error al eliminar usuario", description: e.message, variant: "destructive" })
    } finally {
      setDeletingUserId(null)
    }
  }

  if (user?.role !== "admin" && user?.role !== "superadmin") {
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

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-uploaded
    e.target.value = ""

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato no permitido", description: "Usa JPG, PNG, WebP o GIF.", variant: "destructive" })
      return
    }

    setUploadingSignature(true)
    const { url, error } = await uploadSignature(file)
    setUploadingSignature(false)

    if (error) {
      const msg = error?.message ?? String(error)
      toast({ title: "Error al subir firma", description: msg, variant: "destructive" })
    } else {
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
    e.target.value = ""

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato no permitido", description: "Usa JPG, PNG, WebP o GIF.", variant: "destructive" })
      return
    }

    setUploadingLogo(true)
    const { url, error } = await uploadLogo(file)
    setUploadingLogo(false)

    if (error) {
      const msg = error?.message ?? String(error)
      toast({ title: "Error al subir logo", description: msg, variant: "destructive" })
    } else {
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
          <TabsTrigger value="sucursales" className="gap-2">
            <MapPin className="h-4 w-4" />
            Sucursales
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
                    type="button"
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
                accept="image/jpeg,image/png,image/webp,image/gif"
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
        <TabsContent value="documentos" className="space-y-4">
          {/* Plantilla general (legacy / backward compat) */}
          <Card>
            <CardHeader>
              <CardTitle>Consentimiento general</CardTitle>
              <CardDescription>
                Texto por defecto que se muestra al firmar la ficha odontológica. Se guarda una copia
                inmutable junto a cada firma, por lo que cambios futuros no afectan firmas anteriores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={consentTemplate}
                onChange={(e) => setConsentTemplate(e.target.value)}
                rows={10}
                placeholder="Escriba el texto del consentimiento informado..."
                className="font-mono text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground">{consentTemplate.length} caracteres</p>
              <Button onClick={handleSaveConsent} disabled={savingConsent}>
                {savingConsent ? "Guardando..." : "Guardar texto"}
              </Button>
            </CardContent>
          </Card>

          {/* Plantillas adicionales por especialidad */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Plantillas por especialidad</CardTitle>
                  <CardDescription>
                    Creá plantillas específicas para cada tratamiento o especialidad. En la ficha del
                    paciente podrás seleccionar cuál usar antes de firmar.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Import from file */}
                  <input
                    ref={templateFileRef}
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleImportTemplate}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => templateFileRef.current?.click()}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Importar .txt
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openTemplateDialog()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva plantilla
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Built-in templates */}
              <div className="rounded-lg border border-dashed p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plantillas incluidas en el sistema</p>
                <div className="flex flex-wrap gap-2">
                  {BUILTIN_TEMPLATES.map((bt) => {
                    const alreadyAdded = consentTemplates.some(
                      (t) => t.name === bt.name && t.specialty === bt.specialty
                    )
                    return (
                      <Button
                        key={bt.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={alreadyAdded}
                        onClick={() => handleAddBuiltin(bt)}
                      >
                        <Plus className="h-3 w-3" />
                        {bt.name}
                        {alreadyAdded && <span className="text-muted-foreground">(ya agregada)</span>}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Template list */}
              {loadingTemplates ? (
                <p className="text-sm text-muted-foreground py-2">Cargando plantillas...</p>
              ) : consentTemplates.length === 0 ? (
                <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  <FileSignature className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No hay plantillas aún. Creá una nueva o importá desde archivo.</p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border overflow-hidden">
                  {consentTemplates.map((tmpl) => (
                    <div key={tmpl.id} className="bg-card">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{tmpl.name}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {SPECIALTY_LABELS[tmpl.specialty] ?? tmpl.specialty}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tmpl.content.length} caracteres
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Ver / ocultar contenido"
                            onClick={() => setExpandedTemplate(expandedTemplate === tmpl.id ? null : tmpl.id)}
                          >
                            {expandedTemplate === tmpl.id
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />
                            }
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Exportar como .txt"
                            onClick={() => handleExportTemplate(tmpl)}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Editar"
                            onClick={() => openTemplateDialog(tmpl)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Eliminar"
                            onClick={() => handleDeleteTemplate(tmpl)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {expandedTemplate === tmpl.id && (
                        <div className="px-4 pb-4">
                          <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto font-mono leading-relaxed">
                            {tmpl.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog nueva / editar plantilla */}
          <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Editar plantilla" : "Nueva plantilla de consentimiento"}</DialogTitle>
                <DialogDescription>
                  El texto se guardará tal cual. Podés usar guiones bajos como espacio en blanco para campos a completar a mano.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre de la plantilla *</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Toxina Botulínica"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Especialidad</Label>
                    <Select
                      value={templateForm.specialty}
                      onValueChange={(v) => setTemplateForm((p) => ({ ...p, specialty: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIALTY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Texto del consentimiento *</Label>
                  <Textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, content: e.target.value }))}
                    rows={16}
                    placeholder="Escribí o pegá el texto del consentimiento..."
                    className="font-mono text-sm resize-y"
                  />
                  <p className="text-xs text-muted-foreground">{templateForm.content.length} caracteres</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTemplateDialog(false)}>Cancelar</Button>
                <Button type="button" onClick={handleSaveTemplate} disabled={savingTemplate}>
                  {savingTemplate ? "Guardando..." : editingTemplate ? "Actualizar" : "Crear plantilla"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    type="button"
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
                  accept="image/jpeg,image/png,image/webp,image/gif"
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
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Usuarios de la clínica</CardTitle>
                <CardDescription>Administra quién tiene acceso al sistema</CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadClinicUsers}
                  disabled={loadingUsers}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setNewUserDialog(true)}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Nuevo usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : clinicUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay usuarios registrados en tu clínica.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Nombre</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Rol</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Aviso de cita</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicUsers.map((u) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4 font-medium">
                            {u.name}
                            {u.id === user?.id && (
                              <Badge variant="outline" className="ml-2 text-xs">Tú</Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 pr-4">
                            {u.role === "superadmin" ? (
                              <Badge>Superadmin</Badge>
                            ) : (
                              <Select
                                value={u.role}
                                onValueChange={(role) => handleRoleChange(u.id, role)}
                                disabled={updatingUserId === u.id || u.id === user?.id}
                              >
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="dentista">Dentista</SelectItem>
                                  <SelectItem value="asistente">Asistente</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Select
                              value={String(u.notification_before_minutes ?? 30)}
                              onValueChange={(v) => handleNotificationMinutesChange(u.id, Number(v))}
                            >
                              <SelectTrigger className="h-8 w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10 min</SelectItem>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="20">20 min</SelectItem>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">60 min</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingUserId === u.id || u.id === user?.id || u.role === "superadmin"}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sucursales */}
        <TabsContent value="sucursales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Sucursales</CardTitle>
                <CardDescription>Gestiona las sedes físicas de tu clínica</CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={loadBranches} disabled={loadingBranches} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${loadingBranches ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                <Button size="sm" onClick={() => { setEditingBranch(null); setBranchForm({ name: "", address: "", phone: "" }); setBranchDialog(true) }} className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Nueva sucursal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBranches ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : branches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay sucursales registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Sucursal</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Dirección</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Teléfono</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((b) => (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4 font-medium">{b.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{b.address || "—"}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{b.phone || "—"}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={b.is_active ? "default" : "secondary"}>
                              {b.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => { setEditingBranch(b); setBranchForm({ name: b.name, address: b.address || "", phone: b.phone || "" }); setBranchDialog(true) }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => handleToggleBranch(b)}
                              >
                                {b.is_active ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-green-600" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usuarios por sucursal */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios por sucursal</CardTitle>
              <CardDescription>Asigna cada usuario a su sucursal de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers || loadingBranches ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : clinicUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay usuarios registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Usuario</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Rol</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Sucursal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicUsers.map((u) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4 font-medium">{u.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground capitalize">{u.role}</td>
                          <td className="py-3">
                            <Select
                              value={u.branch_id ?? "ninguna"}
                              onValueChange={(val) => handleUserBranchChange(u.id, val)}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="h-8 w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ninguna">Sin sucursal</SelectItem>
                                {branches.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Sucursal */}
      <Dialog open={branchDialog} onOpenChange={setBranchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle>
            <DialogDescription>
              {editingBranch ? "Actualiza los datos de la sucursal." : "Agrega una nueva sede a tu clínica."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="br-name">Nombre *</Label>
              <Input
                id="br-name"
                value={branchForm.name}
                onChange={(e) => setBranchForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Sede Norte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-address">Dirección</Label>
              <Input
                id="br-address"
                value={branchForm.address}
                onChange={(e) => setBranchForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Av. Principal 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-phone">Teléfono</Label>
              <Input
                id="br-phone"
                value={branchForm.phone}
                onChange={(e) => setBranchForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+595 21 xxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialog(false)} disabled={savingBranch}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBranch} disabled={savingBranch} className="gap-2">
              <MapPin className="h-4 w-4" />
              {savingBranch ? "Guardando..." : editingBranch ? "Guardar cambios" : "Crear sucursal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo usuario */}
      <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Crea una cuenta para un miembro de tu clínica. Recibirá acceso inmediato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nu-name">Nombre completo</Label>
              <Input
                id="nu-name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Ana Torres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-email">Correo electrónico</Label>
              <Input
                id="nu-email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ana@clinica.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nu-password">Contraseña temporal</Label>
              <Input
                id="nu-password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(role) => setNewUserForm(f => ({ ...f, role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dentista">Dentista</SelectItem>
                  <SelectItem value="asistente">Asistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialog(false)} disabled={creatingUser}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {creatingUser ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
