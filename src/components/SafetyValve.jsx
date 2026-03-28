import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

export function computeDRS(log, weekLogs) {
  if (!log) return null;
  const avg7RHR = weekLogs.length
    ? weekLogs.reduce((s, l) => s + (l.rhr || 0), 0) / weekLogs.length
    : log.rhr;
  const rhrDelta = (log.rhr || 0) - avg7RHR;
  return (log.recovery_pct || 0) - rhrDelta;
}

export function getDRSStatus(drs, recovery) {
  if (drs === null) return null;
  if (recovery < 45 || drs < 40) return "red";
  if (recovery > 75 && drs > 75) return "green";
  return "yellow";
}

export default function SafetyValve({ log, weekLogs }) {
  const drs = computeDRS(log, weekLogs);
  const recovery = log?.recovery_pct ?? null;
  const status = getDRSStatus(drs, recovery);

  if (!log) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
        <p className="text-commander-muted text-sm">No biometric data for today — log your morning metrics.</p>
      </div>
    );
  }

  const config = {
    red: {
      bg: "bg-red-950 border-red-700",
      badge: "bg-red-700 text-white",
      icon: AlertTriangle,
      label: "RED LIGHT",
      msg: "Technical Drills Only — No Live Rolling Today",
      sub: "Recovery too low or RHR spiked. Protect the body.",
    },
    yellow: {
      bg: "bg-yellow-950 border-yellow-700",
      badge: "bg-yellow-600 text-black",
      icon: AlertCircle,
      label: "YELLOW LIGHT",
      msg: "Light Technique Work — Listen to Your Body",
      sub: "Moderate readiness. Avoid max intensity.",
    },
    green: {
      bg: "bg-green-950 border-green-700",
      badge: "bg-green-600 text-white",
      icon: CheckCircle,
      label: "GREEN LIGHT",
      msg: "Competition Intensity — Maximize Mat Time",
      sub: "Full go. Push your rounds and pressure game.",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`border rounded-xl p-4 ${c.bg}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-6 h-6 text-white" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full tracking-widest ${c.badge}`}>{c.label}</span>
        <span className="text-white font-mono text-sm ml-auto">DRS: {drs?.toFixed(1)}</span>
      </div>
      <p className="text-white font-semibold text-sm">{c.msg}</p>
      <p className="text-gray-400 text-xs mt-1">{c.sub}</p>
    </div>
  );
}