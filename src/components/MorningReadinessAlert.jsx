import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Zap, Shield, Activity } from "lucide-react";

const SESSION_KEY = "morningAlertDismissed";

function getIntensityTier(score) {
  if (score >= 67) return {
    tier: "PROGRESSIVE LOAD",
    emoji: "🟢",
    title: "Green Light — Go Hard",
    description: "Recovery is optimal. Full combat session cleared. Drive progressive overload today.",
    color: "green",
    borderColor: "border-green-500",
    bgColor: "bg-green-900/30",
    textColor: "text-green-400",
    recommendations: [
      "AM Forge: Full strength session — progressive overload",
      "PM Combat: Full rounds — max intensity",
      "Nutrition: High carb day — fuel the work",
      "Sleep target: 8+ hours tonight"
    ]
  };
  if (score >= 34) return {
    tier: "DRILLS ONLY",
    emoji: "🟡",
    title: "Yellow — Technical Focus",
    description: "Moderate recovery. Skip heavy sparring. Focus on drilling and skill work.",
    color: "yellow",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-900/30",
    textColor: "text-yellow-400",
    recommendations: [
      "AM Forge: Reduce load 20% — technique emphasis",
      "PM Combat: Drilling only — no live rolls",
      "Nutrition: Moderate carbs — maintenance",
      "Sleep target: 9+ hours tonight"
    ]
  };
  return {
    tier: "SHIELD RECOVERY",
    emoji: "🔴",
    title: "Red — Shield Recovery Mode",
    description: "Low recovery. Mandatory rest or light mobility only.",
    color: "red",
    borderColor: "border-red-500",
    bgColor: "bg-red-900/30",
    textColor: "text-red-400",
    recommendations: [
      "AM: Mobility and breathwork only — 20 min max",
      "PM: Cancel combat session — prioritize sleep",
      "Nutrition: Increase protein, add 300 kcal buffer",
      "Hydration: 16+ oz additional water today"
    ]
  };
}

export default function MorningReadinessAlert() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const dismissed = sessionStorage.getItem(`${SESSION_KEY}_${today}`);
    if (dismissed) {
      setLoading(false);
      return;
    }

    // Only show between 05:00 and 12:00 (morning window)
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 12) {
      setLoading(false);
      return;
    }

    const fetchReadiness = async () => {
      try {
        // Check for today's biometric log with a recovery score
        const logs = await base44.entities.BiometricLog.filter({ date: today });
        const todayLog = logs[0];

        let recoveryScore = null;

        if (todayLog?.recovery_score) {
          recoveryScore = todayLog.recovery_score;
        } else {
          // Try ZuluShredMetrics for today
          const shred = await base44.entities.ZuluShredMetrics.filter({ date: today });
          if (shred[0]?.recovery_score) {
            recoveryScore = shred[0].recovery_score;
          }
        }

        if (recoveryScore !== null) {
          const intensity = getIntensityTier(recoveryScore);
          setData({
            recovery_score: recoveryScore,
            hrv: todayLog?.hrv || null,
            resting_hr: todayLog?.resting_heart_rate || null,
            ...intensity,
          });
          setVisible(true);
        }
      } catch (err) {
        console.warn("MorningReadinessAlert: could not fetch data", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReadiness();
  }, []);

  const dismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    sessionStorage.setItem(`${SESSION_KEY}_${today}`, "true");
    setVisible(false);
  };

  if (loading || !visible || !data) return null;

  const IconMap = {
    green: Zap,
    yellow: Activity,
    red: Shield,
  };
  const Icon = IconMap[data.color] || Zap;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border-2 ${data.borderColor} ${data.bgColor} bg-commander-dark overflow-hidden shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data.emoji}</span>
            <div>
              <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">
                05:00 AM Readiness Check
              </p>
              <p className={`font-black text-base ${data.textColor}`}>{data.title}</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-commander-muted hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recovery Score */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full border-4 ${data.borderColor} flex flex-col items-center justify-center`}>
              <p className={`text-2xl font-black ${data.textColor}`}>{data.recovery_score}%</p>
              <p className="text-xs text-commander-muted">Recovery</p>
            </div>
            <div className="flex-1 space-y-1">
              {data.hrv && (
                <div className="flex justify-between text-sm">
                  <span className="text-commander-muted">HRV</span>
                  <span className="text-white font-bold">{data.hrv} ms</span>
                </div>
              )}
              {data.resting_hr && (
                <div className="flex justify-between text-sm">
                  <span className="text-commander-muted">Resting HR</span>
                  <span className="text-white font-bold">{data.resting_hr} bpm</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-commander-muted">Mode</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded-full ${data.bgColor} ${data.textColor}`}>
                  {data.tier}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm">{data.description}</p>

          {/* Recommendations */}
          <div className="space-y-2">
            <p className="text-white text-xs font-bold uppercase tracking-widest">
              Today's Adjusted Plan
            </p>
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${data.textColor}`} />
                <span>{rec}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={dismiss}
            className={`w-full py-3 rounded-xl font-black text-commander-dark transition-all ${
              data.color === "green"
                ? "bg-green-400 hover:bg-green-300"
                : data.color === "yellow"
                ? "bg-yellow-400 hover:bg-yellow-300"
                : "bg-red-400 hover:bg-red-300"
            }`}
          >
            Understood — Execute Plan
          </button>
        </div>
      </div>
    </div>
  );
}