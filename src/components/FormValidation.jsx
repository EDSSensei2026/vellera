import { AlertCircle, CheckCircle } from "lucide-react";

export function FormError({ message }) {
  return (
    <div className="flex items-center gap-2 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2 mt-1">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <span className="text-xs text-red-300">{message}</span>
    </div>
  );
}

export function FormSuccess({ message }) {
  return (
    <div className="flex items-center gap-2 bg-green-950/50 border border-green-800 rounded-lg px-3 py-2 mt-1">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
      <span className="text-xs text-green-300">{message}</span>
    </div>
  );
}

export function SubmitButton({ onClick, disabled, loading, label, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full bg-commander-red text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${className}`}
      title={disabled ? "Complete required fields to continue" : ""}
    >
      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
      {loading ? "Saving..." : label}
    </button>
  );
}

export function RequiredField({ children }) {
  return (
    <div>
      {children}
      <span className="text-red-400 text-xs ml-1">*</span>
    </div>
  );
}