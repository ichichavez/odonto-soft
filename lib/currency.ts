export type CurrencyCode = "PYG" | "USD" | "ARS" | "BRL" | "EUR" | "CLP" | "COP" | "BOB" | "UYU"

export type CurrencyOption = {
  code: CurrencyCode
  label: string
  symbol: string
  locale: string
  decimals: number
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "PYG", label: "Guaraní paraguayo (₲)",  symbol: "₲",  locale: "es-PY", decimals: 0 },
  { code: "USD", label: "Dólar americano ($)",     symbol: "$",  locale: "en-US", decimals: 2 },
  { code: "ARS", label: "Peso argentino ($)",      symbol: "$",  locale: "es-AR", decimals: 2 },
  { code: "BRL", label: "Real brasileño (R$)",     symbol: "R$", locale: "pt-BR", decimals: 2 },
  { code: "EUR", label: "Euro (€)",                symbol: "€",  locale: "de-DE", decimals: 2 },
  { code: "CLP", label: "Peso chileno ($)",        symbol: "$",  locale: "es-CL", decimals: 0 },
  { code: "COP", label: "Peso colombiano ($)",     symbol: "$",  locale: "es-CO", decimals: 0 },
  { code: "BOB", label: "Boliviano (Bs.)",         symbol: "Bs.", locale: "es-BO", decimals: 2 },
  { code: "UYU", label: "Peso uruguayo ($U)",      symbol: "$U", locale: "es-UY", decimals: 2 },
]

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c])) as Record<CurrencyCode, CurrencyOption>

/**
 * Formatea un número como moneda según el código de moneda de la clínica.
 * Ejemplo: formatCurrency(150000, "PYG") → "₲ 150.000"
 */
export function formatCurrency(amount: number, currency: string = "PYG"): string {
  const cfg = CURRENCY_MAP[currency as CurrencyCode] ?? CURRENCY_MAP.PYG
  return `${cfg.symbol} ${amount.toLocaleString(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  })}`
}
