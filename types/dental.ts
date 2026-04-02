// Tipos para el módulo de ficha odontológica.
// Estas son las formas de los campos JSONB en la tabla dental_records,
// más los tipos derivados de la tabla auto-generada.

import type { Database } from "./database"

// ─── Tipos derivados de la BD ────────────────────────────────────────
export type DentalRecord     = Database["public"]["Tables"]["dental_records"]["Row"]
export type DentalRecordInsert = Database["public"]["Tables"]["dental_records"]["Insert"]
export type DentalRecordUpdate = Database["public"]["Tables"]["dental_records"]["Update"]
export type DentalRecordHistory = Database["public"]["Tables"]["dental_record_history"]["Row"]

// ─── Formas de los campos JSONB ──────────────────────────────────────

export type ExtraOralExam = {
  atm: {
    pain_palpation: boolean
    pain_opening: boolean
    pain_closing: boolean
    joint_noise: boolean
    no_issues: boolean
    other: string
  }
  head: {
    scar: boolean
    asymmetry: boolean
    normal_size: boolean
    normal_shape: boolean
    other: string
  }
  face: {
    asymmetric_front: boolean
    convex_profile: boolean
    concave_profile: boolean
    straight_profile: boolean
    no_particularities: boolean
  }
  lymph_nodes: {
    no_particularities: boolean
    enlarged: boolean
    enlarged_detail: string
    other: string
  }
  lips: {
    short: boolean
    normal: boolean
    dry_cracked: boolean
    injured_commissures: boolean
    labial_incompetence: boolean
  }
}

export type IntraOralExam = {
  gums: {
    localized_gingivitis: boolean
    generalized_gingivitis: boolean
    healthy: boolean
    periodontal_pockets: boolean
    other: string
  }
  tongue: {
    no_anomalies: boolean
    short_frenulum: boolean
    geographic: boolean
    coated: boolean
    other: string
  }
  hard_palate: {
    color: string
    normal_size: boolean
    normal_shape: boolean
    color_anomaly: boolean
    ulcers: boolean
    size_anomaly: boolean
    torus: boolean
    burns: boolean
    erythema: boolean
    other: string
  }
  soft_palate: {
    no_particularities: boolean
    burns: boolean
    ulcers: boolean
    petechiae_erythema: boolean
  }
  pharynx: {
    normal: boolean
    grade1: boolean
    grade2: boolean
    grade3: boolean
    grade4: boolean
    surgically_removed: boolean
  }
  floor_of_mouth: {
    no_abnormalities: boolean
    ranula: boolean
    short_frenulum: boolean
    lingual_tori: boolean
  }
  occlusion_temporary: {
    straight_terminal_plane: boolean
    mesial_terminal_plane: boolean
    distal_terminal_plane: boolean
  }
  occlusion_mixed_permanent: {
    class1: boolean
    class2: boolean
    class3: boolean
  }
  bite_type: {
    normal: boolean
    anterior_crossbite: boolean
    posterior_crossbite: boolean
    single_tooth_crossbite: boolean
    anterior_open_bite: boolean
    scissor_bite: boolean
    other: string
  }
}

export type Habits = {
  // Malos hábitos
  finger_sucking: boolean
  finger_sucking_which: string
  nail_biting: boolean
  pencil_biting: boolean
  pen_biting: boolean
  lip_interposition: boolean
  no_bad_habits: boolean
  // Función
  mouth_opening: string   // "normal" | "limited" | "right" | "left"
  lip_closure: string     // "normal" | "insufficient" | "other"
  lip_closure_other: string
  breathing: string       // "nasal" | "oral" | "mixed"
  swallowing: string      // "normal" | "chin_wrinkle" | "lingual_interposition" | "lower_lip_interposition"
}

export type MedicalHistory = {
  under_medical_treatment: boolean
  treatment_duration: string
  taking_medication: boolean
  medication_detail: string
  diseases: {
    tuberculosis: boolean
    leprosy: boolean
    cardiac: boolean
    sexual_diseases: boolean
    asthma: boolean
    hepatitis: boolean
    hypertension: boolean
    malaria: boolean
    allergy: boolean
    aids: boolean
    chagas: boolean
    psychiatric: boolean
    rheumatic_fever: boolean
    seizures: boolean
    epilepsy: boolean
    fainting: boolean
    sinusitis: boolean
    coagulation_problems: boolean
    anemia: boolean
    diabetes: boolean
    hemophilia: boolean
    ulcers: boolean
    other: boolean
    other_detail: string
  }
  needs_blood_transfusion: boolean
  transfusion_reason: string
  had_surgery: boolean
  surgery_detail: string
  bleeds_excessively: boolean
  smokes: boolean
  smoking_duration: string
  cigarettes_per_day: string
  drinks_alcohol: boolean
  alcohol_duration: string
  pregnant: boolean
  pregnancy_duration: string
  tolerates_anesthesia: boolean
  never_had_anesthesia: boolean
  elisa_test: boolean
  elisa_test_duration: string
  consultation_reason: string
}

export type DentalHistory = {
  last_dentist_visit: string
  has_tooth_loss: boolean
  tooth_loss_reason: string
  brushing_frequency: string
  hygiene_brush: boolean
  hygiene_floss: boolean
  hygiene_mouthwash: boolean
  hygiene_other: string
}

export type FeedingHistory = {
  breastfeeding_type: string      // "maternal" | "formula" | "mixed"
  breastfeeding_duration: string  // "3months" | "6months" | "1year" | ...
  breastfeeding_duration_other: string
  solid_food_age: string
  breakfast: string
  mid_morning: string
  lunch: string
  snack: string
  dinner: string
}

export type DietRecord = {
  preferred_foods: {
    cakes: boolean
    cookies: boolean
    flan: boolean
    homemade_sweets: boolean
    condensed_milk: boolean
    excess_sugar: boolean
    pasta: boolean
    gum: boolean
    candy: boolean
    chocolate: boolean
    lollipops: boolean
    sodas: boolean
    juice_boxes: boolean
  }
  weekly_diet: {
    monday:    { breakfast: string; mid_morning: string; lunch: string; snack: string }
    tuesday:   { breakfast: string; mid_morning: string; lunch: string; snack: string }
    wednesday: { breakfast: string; mid_morning: string; lunch: string; snack: string }
    thursday:  { breakfast: string; mid_morning: string; lunch: string; snack: string }
    friday:    { breakfast: string; mid_morning: string; lunch: string; snack: string }
  }
}
