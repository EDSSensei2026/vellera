import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Flame, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap } from "lucide-react";

// Caloric cost estimates per drill type (kcal/minute)
const DRILL_CALORIE_MAP = {
  "pistol draw": 4,
  "pack carry": 8,
  "ruck": 8,
  "threat": 4,
  "scan": 4,
  "extraction": 6,
  "vip": 6,
  "combative": 7,
  "restraint": 7,
  "stress inoculation": 9,
  "vehicle ambush": 6,
  "low-light": 4,
  "night movement": 4,
  "close protection": 5,
  "defensive driving": 3,
  "bjj": 8,
  "guard": 8,
  "submission": 8,
  "takedown": 8,
  "sparring": 9,
  "striking": 8,
  "heavy bag": 8,
  "strength": 6,
  "conditioning": 7,
  "default": 6,
};

function estimateCaloriesForDrill(title = "", durationMinutes = 60) {
  const lower = title.toLowerCase();
  for (const [key, rate] of Object.entries(DRILL_CALORIE_MAP)) {
    if (lower.includes(key)) return Math.round(rate * durationMinutes);
  }
  return Math.round(DRILL_CALORIE_MAP.default * durationMinutes);
}

function parseGCalDuration(start, end) {
  if (!start || !end) return 60;
  const s = new Date(start.dateTime || start.date);
  const e = new Date(end.dateTime || end.date);
  return Math.round((e - s) / 60000) || 60;
}

const STATUS_CONFIG = {
  fueled:    { color: "text-vellera-green",  border: "border-green-700/50",  bg: "bg-green-900/20",  icon: CheckCircle,    label: "Well Fueled" },
  low:       { color: "text-yellow-400",     border: "border-yellow-700/50", bg: "bg-yellow-900/20", icon: AlertTriangle,  label: "Under-Fueled" },
  critical:  { color: "text-red-400",        border: "border-red-700/50",    bg: "bg-red-900/20",    icon: AlertTriangle,  label: "Critical Deficit" },
  rest:      { color: "text-commander-muted",border: "border-commander-border", bg: "bg-commander-surface", icon: Zap,      label: "Rest Day" },
};

export default function TacticalFuelStatus({ caloriesToday = 0, date }) {
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const today = date || new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getUserCalendarEvents", {});
        const events = res.data?.events || [];

        // Filter to today's events that look like drill/training sessions
        const drillKeywords = ["drill", "bjj", "ep", "tactical", "strength", "conditioning", "ruck", "combat", "sparring", "training", "workout", "session", "extraction", "ambush", "pistol"];
        const todayDrills = events.filter(ev => {
          const start = ev.start?.dateTime || ev.start?.date || "";
          return start.startsWith(today) && drillKeywords.some(k => (ev.summary || "").toLowerCase().includes(k));
        });

        setDrills(todayDrills.map(ev => ({
          title: ev.summary || "Training Session",
          duration: parseGCalDuration(ev.start, ev.end),
          caloriesNeeded: estimateCaloriesForDrill(ev.summary || "", parseGCalDuration(ev.start, ev.end)),
          time: ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "All day",
        })));
      } catch {
        // Silently fail — calendar may not be connected
        setDrills([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  const totalDrillCalories = drills.reduce((s, d) => s + d.caloriesNeeded, 0);
  const deficit = totalDrillCalories - caloriesToday;

  let status = "rest";
  if (drills.length > 0) {
    if (deficit <= 0) status = "fueled";
    else if (deficit <= 300) status = "low";
    else status = "critical";
  }

  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  if (loading) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className={`border ${cfg.border} ${cfg.bg} rounded-xl overflow-hidden`}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <Shield className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm">Tactical Fuel Status</p>
          <p className="text-commander-muted text-xs">
            {drills.length === 0 ? "No sessions scheduled today" : `${drills.length} session${drills.length > 1 ? "s" : ""} scheduled`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className={`flex items-center gap-1 ${cfg.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-xs font-black">{cfg.label}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-commander-muted" /> : <ChevronDown className="w-4 h-4 text-commander-muted" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-commander-border/50 px-4 pb-4 space-y-3">

          {/* Calorie comparison bar */}
          {drills.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-commander-muted">
                <span>Calories consumed</span>
                <span className="text-white font-bold">{caloriesToday} kcal</span>
              </div>
              <div className="flex justify-between text-xs text-commander-muted">
                <span>Estimated burn for today's sessions</span>
                <span className={`font-bold ${cfg.color}`}>{totalDrillCalories} kcal</span>
              </div>

              {/* Visual bar */}
              <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                {/* Consumed */}
                <div
                  className="absolute left-0 top-0 h-full bg-vellera-blue rounded-full transition-all"
                  style={{ width: `${Math.min(100, totalDrillCalories > 0 ? (caloriesToday / totalDrillCalories) * 100 : 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-vellera-blue font-bold">Consumed</span>
                <span className={`font-bold ${cfg.color}`}>
                  {deficit > 0 ? `${deficit} kcal short` : `${Math.abs(deficit)} kcal surplus`}
                </span>
              </div>
            </div>
          )}

          {/* Macro targets for sessions */}
          {drills.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-commander-muted text-xs uppercase tracking-widest">Recommended Pre-Session Macros</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Carbs", value: `${Math.round(totalDrillCalories * 0.45 / 4)}g`, color: "text-yellow-400" },
                  { label: "Protein", value: `${Math.round(totalDrillCalories * 0.25 / 4)}g`, color: "text-orange-400" },
                  { label: "Fat", value: `${Math.round(totalDrillCalories * 0.30 / 9)}g`, color: "text-blue-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-900/60 rounded-lg p-2 text-center">
                    <p className={`font-black text-sm ${color}`}>{value}</p>
                    <p className="text-commander-muted text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drill list */}
          {drills.length > 0 && (
            <div className="space-y-2">
              <p className="text-commander-muted text-xs uppercase tracking-widest">Today's Sessions</p>
              {drills.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{d.title}</p>
                      <p className="text-commander-muted text-xs">{d.time} · {d.duration} min</p>
                    </div>
                  </div>
                  <span className="text-amber-400 text-xs font-bold shrink-0 ml-2">~{d.caloriesNeeded} kcal</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {status === "critical" && (
            <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-xs text-red-300">
              ⚠️ You're <strong>{deficit} kcal</strong> below what today's sessions demand. Add a high-carb pre-session meal or protein shake before training.
            </div>
          )}
          {status === "low" && (
            <div className="bg-yellow-950/40 border border-yellow-800 rounded-lg p-3 text-xs text-yellow-300">
              📌 Close to target — consider a quick 20–30g carb snack before your session.
            </div>
          )}
          {status === "fueled" && (
            <div className="bg-green-950/40 border border-green-800 rounded-lg p-3 text-xs text-green-300">
              ✅ You're fueled for today's sessions. Maintain hydration and time carbs 60–90 min pre-session.
            </div>
          )}
          {status === "rest" && (
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
              No drill sessions found on your Google Calendar for today. Schedule sessions via <strong>Schedule Drills</strong> to see fuel requirements here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}