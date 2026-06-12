import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { AlertTriangle, Flame, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

// Calorie burn estimates per minute by keyword (matches TacticalFuelStatus)
const DRILL_CALORIE_MAP = {
  "pistol draw": 4, "pack carry": 8, "ruck": 8, "threat": 4, "scan": 4,
  "extraction": 6, "vip": 6, "combative": 7, "restraint": 7,
  "stress inoculation": 9, "vehicle ambush": 6, "low-light": 4,
  "night movement": 4, "close protection": 5, "defensive driving": 3,
  "bjj": 8, "guard": 8, "submission": 8, "takedown": 8, "sparring": 9,
  "striking": 8, "heavy bag": 8, "strength": 6, "conditioning": 7,
  "training": 6, "workout": 6, "session": 6, "drill": 6, "ep": 5,
  "tactical": 6, "combat": 7,
};

const DRILL_KEYWORDS = Object.keys(DRILL_CALORIE_MAP);

function estimateCalories(title = "", durationMin = 60) {
  const lower = title.toLowerCase();
  for (const [key, rate] of Object.entries(DRILL_CALORIE_MAP)) {
    if (lower.includes(key)) return Math.round(rate * durationMin);
  }
  return Math.round(6 * durationMin);
}

function parseDuration(start, end) {
  if (!start || !end) return 60;
  const s = new Date(start.dateTime || start.date);
  const e = new Date(end.dateTime || end.date);
  return Math.round((e - s) / 60000) || 60;
}

// Only warn if deficit is >= this threshold
const WARN_THRESHOLD = 400;

export default function FuelDeficitWarning() {
  const [state, setState] = useState(null); // null = loading, false = no warning, object = warning data

  useEffect(() => {
    const run = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch today's food logs and calendar events in parallel
        const [foodLogs, calRes] = await Promise.all([
          base44.entities.FoodLog.filter({ date: today }),
          base44.functions.invoke("getUserCalendarEvents", {}),
        ]);

        const caloriesToday = foodLogs.reduce((s, l) => s + (l.calories || 0), 0);
        const events = calRes.data?.events || [];

        // Filter to today's tactical/training events
        const todayDrills = events.filter(ev => {
          const start = ev.start?.dateTime || ev.start?.date || "";
          return start.startsWith(today) &&
            DRILL_KEYWORDS.some(k => (ev.summary || "").toLowerCase().includes(k));
        });

        if (todayDrills.length === 0) {
          setState(false);
          return;
        }

        const totalBurn = todayDrills.reduce((s, ev) => {
          const dur = parseDuration(ev.start, ev.end);
          return s + estimateCalories(ev.summary || "", dur);
        }, 0);

        const deficit = totalBurn - caloriesToday;

        if (deficit >= WARN_THRESHOLD) {
          setState({ deficit, totalBurn, caloriesToday, sessionCount: todayDrills.length });
        } else {
          setState(false);
        }
      } catch {
        setState(false); // Fail silently — calendar may not be connected
      }
    };
    run();
  }, []);

  if (!state) return null;

  const severity = state.deficit >= 800 ? "critical" : "warning";

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${
      severity === "critical"
        ? "bg-red-950/40 border-red-700"
        : "bg-yellow-950/30 border-yellow-700"
    }`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${severity === "critical" ? "text-red-400" : "text-yellow-400"}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${severity === "critical" ? "text-red-300" : "text-yellow-300"}`}>
            {severity === "critical" ? "⚠️ Critical Fuel Deficit" : "📉 Under-Fueling Warning"}
          </p>
          <p className={`text-xs mt-0.5 ${severity === "critical" ? "text-red-400" : "text-yellow-400"}`}>
            You're <strong>{state.deficit} kcal</strong> short for today's{" "}
            {state.sessionCount} tactical session{state.sessionCount > 1 ? "s" : ""}.
          </p>

          {/* Mini calorie bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Consumed</span>
              <span className="font-bold text-white">{state.caloriesToday} kcal</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-vellera-blue rounded-full"
                style={{ width: `${Math.min(100, Math.round((state.caloriesToday / state.totalBurn) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Session burn estimate</span>
              <span className="font-bold text-amber-400">{state.totalBurn} kcal</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Add a carb + protein meal before your session to close the gap.
          </p>
        </div>
      </div>

      <Link
        to="/food"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs font-bold text-white"
      >
        <LinkIcon className="w-3.5 h-3.5" /> Log Food Now
      </Link>
    </div>
  );
}