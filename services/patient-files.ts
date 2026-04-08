import { createBrowserClient } from "@/lib/supabase"
import type { PatientFile, PatientFileInsert } from "@/types/database"

export type FileType = PatientFile["file_type"]

export const FILE_TYPE_LABELS: Record<string, string> = {
  radiografia: "Radiografías",
  foto_intraoral: "Fotos Intraorales",
  foto_extraoral: "Fotos Extraorales",
  interconsulta: "Interconsulta",
  documento: "Documentos",
  otro: "Otros",
}

export const patientFilesService = {
  // Obtener todos los archivos de un paciente
  async getByPatient(patientId: string): Promise<PatientFile[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_files")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data ?? []
  },

  // Obtener archivos de un paciente filtrados por tipo
  async getByType(patientId: string, fileType: FileType): Promise<PatientFile[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_files")
      .select("*")
      .eq("patient_id", patientId)
      .eq("file_type", fileType)
      .order("taken_at", { ascending: false, nullsFirst: false })

    if (error) throw error
    return data ?? []
  },

  // Subir archivo a Supabase Storage e insertar registro
  async upload(
    file: File,
    patientId: string,
    fileType: FileType,
    options: {
      notes?: string
      takenAt?: string
      clinicId?: string
      uploadedBy?: string
    } = {}
  ): Promise<PatientFile> {
    const supabase = createBrowserClient()

    const ext = file.name.split(".").pop()
    const timestamp = Date.now()
    const storagePath = `${patientId}/${fileType}/${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(storagePath, file, { upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from("patient-files")
      .getPublicUrl(storagePath)

    const insert: PatientFileInsert = {
      patient_id: patientId,
      clinic_id: options.clinicId ?? null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      notes: options.notes ?? null,
      taken_at: options.takenAt ?? null,
      uploaded_by: options.uploadedBy ?? null,
    }

    const { data, error } = await supabase
      .from("patient_files")
      .insert(insert)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Actualizar notas o fecha de un archivo
  async update(
    fileId: string,
    updates: { notes?: string; taken_at?: string; file_name?: string }
  ): Promise<PatientFile> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patient_files")
      .update(updates)
      .eq("id", fileId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Eliminar archivo (storage + registro)
  async delete(fileId: string): Promise<void> {
    const supabase = createBrowserClient()

    // Obtener URL para extraer el path de storage
    const { data: file, error: fetchError } = await supabase
      .from("patient_files")
      .select("file_url")
      .eq("id", fileId)
      .single()

    if (fetchError) throw fetchError

    // Intentar eliminar del storage (extraer path relativo)
    try {
      const url = new URL(file.file_url)
      const pathParts = url.pathname.split("/patient-files/")
      if (pathParts[1]) {
        await supabase.storage.from("patient-files").remove([pathParts[1]])
      }
    } catch {
      // Si falla el storage, igual eliminamos el registro
    }

    const { error } = await supabase.from("patient_files").delete().eq("id", fileId)
    if (error) throw error
  },

  // Subir avatar de paciente
  async uploadAvatar(file: File, patientId: string): Promise<string> {
    const supabase = createBrowserClient()

    const ext = file.name.split(".").pop()
    const path = `${patientId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("patient-avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from("patient-avatars").getPublicUrl(path)
    return data.publicUrl
  },
}
