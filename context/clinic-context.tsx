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
  created_at: string
  updated_at: string
}

type ClinicContextType = {
  clinic: Clinic | null
  loading: boolean
  updateClinic: (updates: Partial<Pick<Clinic, "name" | "logo_url" | "primary_color">>) => Promise<{ error: any }>
  uploadLogo: (file: File) => Promise<{ url: string | null; error: any }>
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined)

const DEFAULT_COLOR = "#10b981"

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const fetchClinic = useCallback(async () => {
    if (!user?.clinic_id) {
      // Use default clinic values when no clinic_id is set
      setClinic({
        id: "00000000-0000-0000-0000-000000000001",
        name: "OdontoSoft Demo",
        slug: "demo",
        logo_url: null,
        primary_color: DEFAULT_COLOR,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", user.clinic_id)
        .single()

      if (error) {
        console.error("Error fetching clinic:", error)
        // Fallback to default
        setClinic({
          id: user.clinic_id,
          name: "OdontoSoft",
          slug: null,
          logo_url: null,
          primary_color: DEFAULT_COLOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } else {
        setClinic(data)
      }
    } catch (err) {
      console.error("Clinic fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.clinic_id, supabase])

  useEffect(() => {
    fetchClinic()
  }, [fetchClinic])

  const updateClinic = async (
    updates: Partial<Pick<Clinic, "name" | "logo_url" | "primary_color">>
  ): Promise<{ error: any }> => {
    if (!clinic) return { error: new Error("No clinic loaded") }

    try {
      const { data, error } = await supabase
        .from("clinics")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", clinic.id)
        .select()
        .single()

      if (error) return { error }

      setClinic(data)
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
