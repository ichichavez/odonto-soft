"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

export type Clinic = {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  primary_color: string
  currency: string
  consent_template: string | null
  created_at: string | null
  updated_at: string | null
}

type ClinicUpdates = Partial<Pick<Clinic, "name" | "logo_url" | "primary_color" | "currency" | "consent_template">>

type ClinicContextType = {
  clinic: Clinic | null
  loading: boolean
  updateClinic: (updates: ClinicUpdates) => Promise<{ error: any }>
  uploadLogo: (file: File) => Promise<{ url: string | null; error: any }>
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined)

const DEFAULT_COLOR = "#10b981"
const DEMO_CLINIC_ID = "00000000-0000-0000-0000-000000000001"

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const fetchClinic = useCallback(async () => {
    const clinicId = user?.clinic_id ?? DEMO_CLINIC_ID

    try {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .maybeSingle()

      if (data) {
        setClinic({ ...data, primary_color: data.primary_color ?? DEFAULT_COLOR, currency: data.currency ?? "PYG" })
      } else {
        // La fila no existe todavía — usar valores por defecto en memoria
        setClinic({
          id: clinicId,
          name: "OdontoSoft Demo",
          slug: "demo",
          logo_url: null,
          primary_color: DEFAULT_COLOR,
          currency: "PYG",
          consent_template: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error("Clinic fetch error:", err)
      setClinic({
        id: clinicId,
        name: "OdontoSoft Demo",
        slug: "demo",
        logo_url: null,
        primary_color: DEFAULT_COLOR,
        consent_template: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [user?.clinic_id, supabase])

  useEffect(() => {
    fetchClinic()
  }, [fetchClinic])

  const updateClinic = async (updates: ClinicUpdates): Promise<{ error: any }> => {
    if (!clinic) return { error: new Error("No clinic loaded") }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (updates.name !== undefined)             updateData.name = updates.name
    if (updates.logo_url !== undefined)         updateData.logo_url = updates.logo_url
    if (updates.primary_color !== undefined)    updateData.primary_color = updates.primary_color
    if (updates.currency !== undefined)         updateData.currency = updates.currency
    if (updates.consent_template !== undefined) updateData.consent_template = updates.consent_template

    try {
      const { data, error } = await supabase
        .from("clinics")
        .update(updateData)
        .eq("id", clinic.id)
        .select()
        .single()

      if (error) return { error }

      setClinic({ ...clinic, ...data })
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const uploadLogo = async (file: File): Promise<{ url: string | null; error: any }> => {
    if (!clinic) return { url: null, error: new Error("No clinic loaded") }

    try {
      const ext = file.name.split(".").pop()
      const path = `${clinic.id}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("clinic-assets")
        .upload(path, file, { upsert: true })

      if (uploadError) return { url: null, error: uploadError }

      const { data } = supabase.storage.from("clinic-assets").getPublicUrl(path)
      const url = data.publicUrl

      const { error: updateError } = await updateClinic({ logo_url: url })
      if (updateError) return { url: null, error: updateError }

      return { url, error: null }
    } catch (err) {
      return { url: null, error: err }
    }
  }

  return (
    <ClinicContext.Provider value={{ clinic, loading, updateClinic, uploadLogo }}>
      {children}
    </ClinicContext.Provider>
  )
}

export function useClinic() {
  const context = useContext(ClinicContext)
  if (context === undefined) {
    throw new Error("useClinic debe ser usado dentro de un ClinicProvider")
  }
  return context
}
