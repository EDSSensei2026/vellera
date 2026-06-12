import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { motion } from "framer-motion";
import { Moon, Zap, Brain, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().split("T")[0];

const METRICS = [
  {
    key: "sleep_quality",
    label: "Sleep Quality",
    icon: Moon,
    color: "#a855f7",
    low: "Rough night",
    high: "Slept great",
    inverseScore: false,
  },
  {
    key: "soreness",
    label: "Soreness",
    icon: Zap,
    color: "#f97316",
    low: "Fresh",
    high: "Destroyed",
    inverseScore: true,   // high soreness = lower readiness
  },
  {
    key: "stress",
    label: "Stress",
    icon: Brain,
    color: "#ef4444",
    low: "Calm",
    high: "Maxed out",
    inverseScore: true,
  },
];

function ScaleRow({ metric, value, onChange }) {
  const Icon = metric.icon;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: metric.color }} />
        <span className="text-white text-sm font-semibold">{metric.label}</span>
        <span className="ml-auto text-xs" style={{ color: metric.color }}>
          {value ? (metric.inverseScore ? ["", "Fresh", "Minor", "Moderate", "Heavy", "Can't move"][value] : ["", "Terrible", "Poor", "OK", "Good", "Perfect"][value]) : "—"}
        </span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 h-9 rounded-lg text-xs font-bold transition-all border"
            style={value === n
              ? { backgroundColor: metric.color + "30", borderColor: metric.color, color: metric.color }
              : { backgroundColor: "#111", borderColor: "#2a2a2a", color: "#555" }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadinessGauge({ score }) {
  const color = score >= 70 ? "#CCFF00" : score >= 45 ? "#f97316" : "#ef4444";
  const label = score >= 70 ? "Ready to Train Hard" : score >= 45 ? "Train Smart — Moderate Intensity" : "Recovery Day Recommended";
  const emoji = score >= 70 ? "💪" : score >= 45 ? "⚡" : "🛌";

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border" style={{ borderColor: color + "40", backgroundColor: color + "10" }}>
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#1f2937" strokeWidth="5" />
          <motion.circle
            cx="28" cy="28" r="22" fill="none"
            stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 22}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - score / 100) }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-base font-black" style={{ color }}>{emoji} {label}</p>
        <p className="text-gray-500 text-xs mt-0.5">AI Coach will adjust tone & workout intensity accordingly</p>
      </div>
    </div>
  );
}

export default function ReadinessCheckIn() {
  const [values, setValues] = useState({ sleep_quality: 0, soreness: 0, stress: 0 });
  const [saved, setSaved] = useState(null); // today's saved record
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.ReadinessCheckIn.filter({ date: today() })
      .then(records => { if (records[0]) setSaved(records[0]); })
      .catch(() => {});
  }, []);

  const calcScore = (v) => {
    if (!v.sleep_quality || !v.soreness || !v.stress) return null;
    // sleep: higher = better (×2 weight), soreness & stress: lower = better
    const sleepPts  = ((v.sleep_quality - 1) / 4) * 100;
    const sorenessPts = ((5 - v.soreness) / 4) * 100;
    const stressPts   = ((5 - v.stress) / 4) * 100;
    return Math.round(sleepPts * 0.4 + sorenessPts * 0.3 + stressPts * 0.3);
  };

  const score = saved ? saved.readiness_score : calcScore(values);
  const allSet = values.sleep_quality && values.soreness && values.stress;

  const handleSave = async () => {
    if (!allSet) { toast.error("Rate all three metrics first"); return; }
    setSaving(true);
    const readiness_score = calcScore(values);
    try {
      const record = await base44.entities.ReadinessCheckIn.create({
        date: today(),
        ...values,
        readiness_score,
      });
      setSaved(record);
      toast.success(`Readiness logged: ${readiness_score}/100`);
    } catch (e) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Already checked in today
  if (saved) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <p className="text-white text-sm font-bold">Today's Readiness Check-In</p>
          <span className="ml-auto text-gray-600 text-xs">{saved.date}</span>
        </div>
        <ReadinessGauge score={saved.readiness_score ?? 50} />
        <div className="grid grid-cols-3 gap-2">
          {METRICS.map(m => (
            <div key={m.key} className="bg-gray-900 rounded-lg p-2 text-center border border-gray-800">
              <m.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: m.color }} />
              <p className="font-black text-lg" style={{ color: m.color }}>{saved[m.key] ?? "—"}<span className="text-gray-600 font-normal text-xs">/5</span></p>
              <p className="text-gray-600 text-xs">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <p className="text-white text-sm font-bold">Daily Readiness Check-In</p>
        <span className="ml-auto text-gray-600 text-xs">Not logged yet</span>
      </div>
      <p className="text-gray-500 text-xs">Your AI Coach uses this to adjust workout intensity and advice.</p>

      <div className="space-y-4">
        {METRICS.map(m => (
          <ScaleRow
            key={m.key}
            metric={m}
            value={values[m.key]}
            onChange={v => setValues(prev => ({ ...prev, [m.key]: v }))}
          />
        ))}
      </div>

      {score !== null && <ReadinessGauge score={score} />}

      <button
        onClick={handleSave}
        disabled={!allSet || saving}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
        style={{ backgroundColor: allSet ? "#00E5FF" : "#1f2937", color: allSet ? "#000" : "#555" }}
      >
        {saving ? "Saving..." : "Log Readiness"}
      </button>
    </div>
  );
}