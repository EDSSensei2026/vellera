import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NativeSelect — mobile-friendly single-select that uses the OS native picker.
 * Drop-in replacement for <select> with consistent dark styling.
 */
export default function NativeSelect({ value, onChange, options = [], placeholder, className, disabled }) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-vellera-blue transition disabled:opacity-50"
        style={{ colorScheme: "dark" }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  );
}