import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"]
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"]

export type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"]
export type MedicalRecordInsert = Database["public"]["Tables"]["medical_records"]["Insert"]
export type MedicalRecordUpdate = Database["public"]["Tables"]["medical_records"]["Update"]

export type DentalRecord = Database["public"]["Tables"]["dental_records"]["Row"]
export type DentalRecordInsert = Database["public"]["Tables"]["dental_records"]["Insert"]
export type DentalRecordUpdate = Database["public"]["Tables"]["dental_records"]["Update"]

export const patientService = {
  // Obtener todos los pacientes
  async getAll(branchId?: string | null) {
    const supabase = createBrowserClient()
    let q = supabase.from("patients").select("*")
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("last_name", { ascending: true })

    if (error) throw error
    return data
  },

  // Obtener un paciente por ID con sus historiales
  async getById(id: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("patients")
      .select(`
        *,
        medical_records(*),
        dental_records(*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  // Crear un nuevo paciente con sus historiales
  async create(
    patient: PatientInsert,
    medicalRecord: Omit<MedicalRecordInsert, "patient_id"> = {},
    dentalRecord: Omit<DentalRecordInsert, "patient_id"> = {},
    branchId?: string | null,
  ) {
    const supabase = createBrowserClient()

    try {
      // Insertar paciente
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([{ ...patient, branch_id: branchId ?? null }])
        .select()
        .single()

      if (patientError) throw patientError

      // Insertar historial médico
      const { error: medicalError } = await supabase
        .from("medical_records")
        .insert([{ ...medicalRecord, patient_id: patientData.id }])

      if (medicalError) {
        console.error("Error creating medical record:", medicalError)
        // No lanzamos el error para no interrumpir la creación del paciente
      }

      // Insertar historial dental
      const { error: dentalError } = await supabase
        .from("dental_records")
        .insert([{ ...dentalRecord, patient_id: patientData.id }])

      if (dentalError) {
        console.error("Error creating dental record:", dentalError)
        // No lanzamos el error para no interrumpir la creación del paciente
      }

      return patientData
    } catch (error) {
      console.error("Error in patient creation:", error)
      throw error
    }
  },

  // Actualizar un paciente
  async update(id: string, patient: PatientUpdate) {
    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase.from("patients").update(patient).eq("id", id).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating patient:", error)
      throw error
    }
  },

  // Actualizar historial médico
  async updateMedicalRecord(patientId: string, medicalRecord: Omit<MedicalRecordUpdate, "patient_id">) {
    const supabase = createBrowserClient()

    try {
      // Primero verificar si existe un registro médico
      const { data: existingRecord } = await supabase
        .from("medical_records")
        .select("id")
        .eq("patient_id", patientId)
        .single()

      if (existingRecord) {
        // Actualizar registro existente
        const { data, error } = await supabase
          .from("medical_records")
          .update(medicalRecord)
          .eq("patient_id", patientId)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from("medical_records")
          .insert([{ ...medicalRecord, patient_id: patientId }])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error("Error updating medical record:", error)
      throw error
    }
  },

  // Actualizar historial dental
  async updateDentalRecord(patientId: string, dentalRecord: Omit<DentalRecordUpdate, "patient_id">) {
    const supabase = createBrowserClient()

    try {
      // Primero verificar si existe un registro dental
      const { data: existingRecord } = await supabase
        .from("dental_records")
        .select("id")
        .eq("patient_id", patientId)
        .single()

      if (existingRecord) {
        // Actualizar registro existente
        const { data, error } = await supabase
          .from("dental_records")
          .update(dentalRecord)
          .eq("patient_id", patientId)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from("dental_records")
          .insert([{ ...dentalRecord, patient_id: patientId }])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error("Error updating dental record:", error)
      throw error
    }
  },

  // Eliminar un paciente (también eliminará sus historiales por CASCADE)
  async delete(id: string) {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("patients").delete().eq("id", id)

    if (error) throw error
    return true
  },

  // Subir foto de perfil del paciente
  async uploadPhoto(patientId: string, clinicId: string, file: File): Promise<string> {
    const supabase = createBrowserClient()
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `clinic-assets/${clinicId}/patients/${patientId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("clinic-assets")
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path)
    const avatarUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from("patients")
      .update({ avatar_url: avatarUrl })
      .eq("id", patientId)

    if (updateError) throw updateError
    return avatarUrl
  },

  // Buscar pacientes
  async search(query: string, branchId?: string | null) {
    const supabase = createBrowserClient()
    let q = supabase
      .from("patients")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    if (branchId) q = q.eq("branch_id", branchId)
    const { data, error } = await q.order("last_name", { ascending: true })

    if (error) throw error
    return data
  },
}
