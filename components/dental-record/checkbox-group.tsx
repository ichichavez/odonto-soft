"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CheckboxItem {
  key: string
  label: string
  withInput?: boolean
  inputPlaceholder?: string
}

interface CheckboxGroupProps {
  items: CheckboxItem[]
  values: Record<string, any>
  onChange: (key: string, value: boolean | string) => void
  columns?: 1 | 2 | 3
}

export function CheckboxGroup({ items, values, onChange, columns = 1 }: CheckboxGroupProps) {
  return (
    <div
      className={cn("gap-3", {
        "grid grid-cols-1": columns === 1,
        "grid grid-cols-2": columns === 2,
        "grid grid-cols-3": columns === 3,
      })}
    >
      {items.map(({ key, label, withInput, inputPlaceholder }) => (
        <div key={key} className="flex items-start gap-2">
          <input
            type="checkbox"
            id={key}
            checked={!!values[key]}
            onChange={(e) => onChange(key, e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <Label htmlFor={key} className="cursor-pointer text-sm font-normal leading-snug">
              {label}
            </Label>
            {withInput && !!values[key] && (
              <Input
                value={values[`${key}_detail`] ?? ""}
                onChange={(e) => onChange(`${key}_detail`, e.target.value)}
                placeholder={inputPlaceholder ?? "Especificar..."}
                className="mt-1 h-7 text-sm"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
