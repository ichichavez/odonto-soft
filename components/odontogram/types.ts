export type Surface = "O" | "V" | "L" | "M" | "D"

export type Condition =
  | "sano"
  | "caries"
  | "obturado"
  | "obturado_caries"
  | "sellante"
  | "fractura"
  | "corona"
  | "endodoncia"
  | "extraido"
  | "implante"
  | "ausente"

export type ToothData = {
  /** Condición por superficie (ausente = sano/vacío). */
  surfaces: Partial<Record<Surface, Exclude<Condition, "sano">>>
  /** Condición que afecta el diente completo (corona, extraído, etc.). */
  whole?: "corona" | "endodoncia" | "extraido" | "implante" | "ausente"
}

export type OdontogramData = {
  permanent: Record<string, ToothData>
  primary: Record<string, ToothData>
}

// ── Configuración visual de cada condición ────────────────────────────────────

export type ConditionConfig = {
  label: string
  color: string       // fill SVG
  stroke: string      // border SVG
  textColor: string
  wholeOnly?: boolean // solo aplica al diente completo
  description: string
}

export const CONDITIONS: Record<Condition, ConditionConfig> = {
  sano:            { label: "Sano / Borrar",        color: "#ffffff", stroke: "#9ca3af", textColor: "#374151", description: "Limpia la condición" },
  caries:          { label: "Caries",                color: "#dc2626", stroke: "#991b1b", textColor: "#fff",     description: "Lesión cariosa activa" },
  obturado:        { label: "Obturado",              color: "#2563eb", stroke: "#1d4ed8", textColor: "#fff",     description: "Restauración presente" },
  obturado_caries: { label: "Obturado c/caries",    color: "#7c3aed", stroke: "#5b21b6", textColor: "#fff",     description: "Restauración con caries secundaria" },
  sellante:        { label: "Sellante",              color: "#0891b2", stroke: "#0e7490", textColor: "#fff",     description: "Sellante de fisuras" },
  fractura:        { label: "Fractura",              color: "#ea580c", stroke: "#c2410c", textColor: "#fff",     description: "Fractura coronaria" },
  corona:          { label: "Corona",                color: "#d97706", stroke: "#b45309", textColor: "#fff",     wholeOnly: true, description: "Corona protésica" },
  endodoncia:      { label: "Endodoncia",            color: "#e11d48", stroke: "#be123c", textColor: "#fff",     wholeOnly: true, description: "Tratamiento de conducto" },
  extraido:        { label: "Extraído",              color: "#9ca3af", stroke: "#6b7280", textColor: "#fff",     wholeOnly: true, description: "Diente extraído" },
  implante:        { label: "Implante",              color: "#475569", stroke: "#334155", textColor: "#fff",     wholeOnly: true, description: "Implante dental" },
  ausente:         { label: "Ausente",               color: "#f3f4f6", stroke: "#d1d5db", textColor: "#6b7280", wholeOnly: true, description: "No erupcionado / congénitamente ausente" },
}

export const WHOLE_CONDITIONS: Condition[] = ["corona", "endodoncia", "extraido", "implante", "ausente"]

// ── Distribución de dientes ───────────────────────────────────────────────────

// Permanentes — en orden de visualización izquierda→derecha
export const PERM_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const PERM_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]
export const PERM_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
export const PERM_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38]

// Temporales / leche
export const PRIM_UPPER_RIGHT = [55, 54, 53, 52, 51]
export const PRIM_UPPER_LEFT  = [61, 62, 63, 64, 65]
export const PRIM_LOWER_RIGHT = [85, 84, 83, 82, 81]
export const PRIM_LOWER_LEFT  = [71, 72, 73, 74, 75]

export function emptyTooth(): ToothData {
  return { surfaces: {} }
}
