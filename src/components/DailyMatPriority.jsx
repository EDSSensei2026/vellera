import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Loader2, RefreshCw, Zap, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const CACHE_KEY = "daily_mat_priority";

function getIntensityColor(level) {
  if (level === "HIGH") return "text-red-400 bg-red-950 border-red-800";
  if (level === "MODERATE") return "text-yellow-400 bg-yellow-950 border-yellow-800";
  return "text-green-400 bg-green-950 border-green-800";
}

function getIntensityIcon(level) {
  if (level === "HIGH") return <AlertTriangle className="w-3.5 h-3.5" />;
  if (level === "MODERATE") return <Zap className="w-3.5 h-3.5" />;
  return <CheckCircle className="w-3.5 h-3.5" />;
}

export default function DailyMatPriority() {
  const [priority, setPriority] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const loadFromCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached?.date === today) {
        setPriority(cached.data);
        setLoading(false);
        return true;
      }
    } catch {}
    return false;
  };

  const generate = async (force = false) => {
    if (!force && loadFromCache()) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch last 14 days of data
      const [sessions, biometrics, techniques] = await Promise.all([
        base44.entities.TrainingSession.list("-date", 14),
        base44.entities.BiometricLog.list("-date", 7),
        base44.entities.Technique.list("-last_drilled", 20),
      ]);

      const sessionSummary = sessions.slice(0, 7).map(s =>
        `${s.date}: ${s.session_type} | intensity=${s.intensity ?? "?"}/10 | gas=${s.gas_level ?? "?"}/10 | injuries=${(s.injury_notes || []).join(", ") || "none"}`
      ).join("\n");

      const bioSummary = biometrics.slice(0, 5).map(b =>
        `${b.date}: recovery=${b.recovery_pct ?? "?"}% | hrv=${b.hrv ?? "?"}ms | sleep=${b.sleep_performance ?? "?"}% | strain=${b.strain ?? "?"}`
      ).join("\n");

      const overdueSkills = techniques
        .filter(t => !t.locked_for_review)
        .sort((a, b) => {
          if (!a.last_drilled) return -1;
          if (!b.last_drilled) return 1;
          return a.last_drilled.localeCompare(b.last_drilled);
        })
        .slice(0, 5)
        .map(t => `${t.name} (${t.category}, last drilled: ${t.last_drilled || "never"})`)
        .join(", ");

      const prompt = `You are an elite BJJ and combat sports coach for a 43-year-old, ~250lb athlete. Today is ${today}.

RECENT TRAINING SESSIONS (last 7):
${sessionSummary || "No sessions logged"}

RECENT BIOMETRICS (last 5 days):
${bioSummary || "No biometrics logged"}

MOST OVERDUE TECHNIQUES:
${overdueSkills || "None found"}

Generate a DAILY MAT PRIORITY brief for this morning. Be specific, data-driven, and direct. Reference actual numbers. Apply the 43yo Rule: if avg recovery < 60% or avg gas > 8.5, recommend reduced intensity.

Return JSON with:
- headline: string (one punchy sentence, max 10 words, e.g. "Z-Guard today. Recovery trending up — push moderate.")
- technique_focus: string (specific technique + why, 1-2 sentences)  
- intensity_recommendation: string ("LOW", "MODERATE", or "HIGH")
- intensity_reason: string (1 sentence explaining why based on data)
- recovery_trend: string ("IMPROVING", "STABLE", or "DECLINING")
- key_warning: string or null (injury/overtraining alert if any, else null)
- session_type_suggestion: string (e.g. "Technique drilling — no hard sparring" or "Full go — gas tank is full")`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            technique_focus: { type: "string" },
            intensity_recommendation: { type: "string" },
            intensity_reason: { type: "string" },
            recovery_trend: { type: "string" },
            key_warning: { type: "string" },
            session_type_suggestion: { type: "string" },
          },
        },
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data: result }));
      setPriority(result);
    } catch (e) {
      setError("Failed to generate priority. Tap refresh to retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Stagger to avoid rate limit burst
    const timer = setTimeout(() => generate(), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-commander-red" />
          <p className="text-xs text-commander-muted uppercase tracking-widest">Daily Mat Priority</p>
        </div>
        <div className="flex items-center gap-2 text-commander-muted text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin text-commander-red" />
          <span>Analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Daily Mat Priority</p>
          <button onClick={() => generate(true)} className="touch-target-min p-1">
            <RefreshCw className="w-4 h-4 text-commander-muted hover:text-white transition-colors" />
          </button>
        </div>
        <p className="text-commander-muted text-xs">{error}</p>
      </div>
    );
  }

  if (!priority) return null;

  const intensityClass = getIntensityColor(priority.intensity_recommendation);
  const trendColor = priority.recovery_trend === "IMPROVING" ? "text-green-400" : priority.recovery_trend === "DECLINING" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-commander-red/10 border-b border-commander-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-commander-red" />
          <p className="text-xs text-commander-red uppercase tracking-widest font-bold">Daily Mat Priority</p>
        </div>
        <button onClick={() => generate(true)} className="touch-target-min p-1" title="Regenerate">
          <RefreshCw className="w-3.5 h-3.5 text-commander-muted hover:text-white transition-colors" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Headline */}
        <p className="text-white font-black text-base leading-tight">{priority.headline}</p>

        {/* Warning banner */}
        {priority.key_warning && (
          <div className="flex items-start gap-2 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs font-semibold">{priority.key_warning}</p>
          </div>
        )}

        {/* Intensity + Recovery Trend row */}
        <div className="flex gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold flex-1 justify-center ${intensityClass}`}>
            {getIntensityIcon(priority.intensity_recommendation)}
            {priority.intensity_recommendation} INTENSITY
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-commander-border bg-commander-dark text-xs font-bold flex-1 justify-center ${trendColor}`}>
            <Shield className="w-3.5 h-3.5" />
            {priority.recovery_trend}
          </div>
        </div>

        {/* Technique Focus */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-1">Technique Focus</p>
          <p className="text-white text-sm leading-relaxed">{priority.technique_focus}</p>
        </div>

        {/* Session suggestion */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-1">Session Type</p>
          <p className="text-white text-sm">{priority.session_type_suggestion}</p>
        </div>

        {/* Intensity reason */}
        <p className="text-commander-muted text-xs italic leading-relaxed">{priority.intensity_reason}</p>
      </div>
    </div>
  );
}