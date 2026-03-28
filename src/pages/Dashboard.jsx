import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SafetyValve from "../components/SafetyValve";
import { Droplets, Flame, Moon, Heart, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const COMP_DATE = new Date("2026-07-18");
const PREP_START = new Date("2026-03-28");

const SCHEDULE = {
  1: [{ time: "6:15 PM", name: "BJJ Foundations", type: "bjj" }, { time: "7:15 PM", name: "MMA Wrestling", type: "mma" }],
  2: [{ time: "6:15 PM", name: "BJJ Foundations", type: "bjj" }],
  3: [{ time: "6:15 PM", name: "No-Gi / BJJ", type: "nogi" }],
  4: [{ time: "6:15 PM", name: "BJJ Foundations", type: "bjj" }, { time: "7:15 PM", name: "MMA Wrestling", type: "mma" }],
  5: [{ time: "6:15 PM", name: "No-Gi / BJJ", type: "nogi" }],
  6: [{ time: "10:00 AM", name: "Masters Class", type: "masters" }],
};

const SC_PROMPT = {
  1: { label: "Home Mobility", color: "text-purple-400", desc: "90/90 Hips · Open the Book · Cat-Cow · Child's Pose" },
  2: { label: "Work Gym — Strength & Power", color: "text-blue-400", desc: "Compound lifts · Focus on posterior chain" },
  3: { label: "Crunch — Zone 2 Cardio", color: "text-green-400", desc: "30 min at 130–145 bpm. Exhale with every strike." },
  4: { label: "Work Gym — Strength & Power", color: "text-blue-400", desc: "Explosive movements · Hip drive" },
  5: { label: "Home Mobility", color: "text-purple-400", desc: "Decompression · Joint lubrication · Wall walks" },
  6: { label: "Active Recovery", color: "text-yellow-400", desc: "Light movement only. Film study after Masters." },
  0: { label: "Rest Day", color: "text-gray-400", desc: "CNS recovery. Prioritize sleep and hydration." },
};

function getCompPhase(daysLeft) {
  if (daysLeft > 60) return { phase: 1, label: "Base Building", color: "text-blue-400", focus: "Zone 2 Cardio & Foundation Technique" };
  if (daysLeft > 30) return { phase: 2, label: "Specific Prep", color: "text-yellow-400", focus: "Strength/Power & Positional Sparring" };
  if (daysLeft > 14) return { phase: 3, label: "The Grind", color: "text-orange-400", focus: "Max Mat Time & Sleep Optimization" };
  return { phase: 4, label: "TAPER PHASE", color: "text-red-400", focus: "Home Mobility & Film Study ONLY" };
}

export default function Dashboard() {
  const [todayLog, setTodayLog] = useState(null);
  const [weekLogs, setWeekLogs] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((COMP_DATE - today) / 86400000));
  const totalDays = Math.ceil((COMP_DATE - PREP_START) / 86400000);
  const progress = Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)));
  const weeksLeft = Math.floor(daysLeft / 7);
  const sessionsLeft = weeksLeft * 6;
  const dayOfWeek = today.getDay();
  const phase = getCompPhase(daysLeft);
  const sc = SC_PROMPT[dayOfWeek];
  const todayClasses = SCHEDULE[dayOfWeek] || [];

  useEffect(() => {
    const todayStr = today.toISOString().split("T")[0];
    Promise.all([
      base44.entities.BiometricLog.filter({ date: todayStr }),
      base44.entities.BiometricLog.list("-date", 7),
      base44.entities.TrainingSession.list("-date", 5),
    ]).then(([tl, wl, rs]) => {
      setTodayLog(tl[0] || null);
      setWeekLogs(wl);
      setRecentSessions(rs);
      setLoading(false);
    });
  }, []);

  const waterTarget = Math.round(250 / 2 + 32 * (todayClasses.length > 0 ? 1.5 : 0));

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      {/* Countdown Hero */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-commander-muted text-xs uppercase tracking-widest">July 18, 2026 Competition</p>
            <p className="text-white text-4xl font-black font-mono">{daysLeft} <span className="text-lg text-commander-muted font-normal">days</span></p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold uppercase tracking-wider ${phase.color}`}>Phase {phase.phase}: {phase.label}</p>
            <p className="text-commander-muted text-xs mt-0.5">{sessionsLeft} mat sessions remaining</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
          <div className="bg-commander-red h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-commander-muted">{progress}% of prep camp complete · <span className={phase.color}>{phase.focus}</span></p>
        {daysLeft < 14 && (
          <div className="mt-2 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            <p className="text-red-300 text-xs font-bold">⚠️ TAPER: Reduce lifting 50%. Home mobility only.</p>
          </div>
        )}
      </div>

      {/* Safety Valve */}
      {loading ? (
        <div className="h-20 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />
      ) : (
        <SafetyValve log={todayLog} weekLogs={weekLogs} />
      )}

      {/* Today's Biometrics */}
      {todayLog && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Heart, label: "Recovery", val: `${todayLog.recovery_pct}%`, color: todayLog.recovery_pct > 75 ? "text-green-400" : todayLog.recovery_pct < 45 ? "text-red-400" : "text-yellow-400" },
            { icon: Zap, label: "Body Batt", val: `${todayLog.body_battery ?? "—"}`, color: "text-blue-400" },
            { icon: Moon, label: "Sleep", val: `${todayLog.sleep_performance ?? "—"}%`, color: "text-purple-400" },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className={`font-bold text-lg ${color}`}>{val}</p>
              <p className="text-commander-muted text-xs">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's Schedule */}
      {todayClasses.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Tonight @ The Lab</p>
          <div className="space-y-2">
            {todayClasses.map((cls) => (
              <div key={cls.time} className="flex items-center gap-3">
                <span className="text-commander-red font-mono text-xs w-16">{cls.time}</span>
                <span className="text-white text-sm font-medium">{cls.name}</span>
                {cls.time === "5:15 PM" && <span className="text-xs text-yellow-400 ml-auto">👦 Watch son</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* S&C Prompt */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-1">Today's S&C Focus</p>
        <p className={`font-bold text-sm ${sc.color}`}>{sc.label}</p>
        <p className="text-commander-muted text-xs mt-1">{sc.desc}</p>
      </div>

      {/* Hydration */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center gap-3">
        <Droplets className="w-5 h-5 text-blue-400" />
        <div>
          <p className="text-white text-sm font-semibold">Hydration Target: {waterTarget} oz</p>
          <p className="text-commander-muted text-xs">250 lbs ÷ 2 + 32 oz per mat hour</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/training" className="bg-commander-surface border border-commander-border rounded-xl p-3 flex items-center justify-between hover:border-commander-red transition-all">
          <span className="text-white text-sm font-medium">Log Session</span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
        <Link to="/techniques" className="bg-commander-surface border border-commander-border rounded-xl p-3 flex items-center justify-between hover:border-commander-red transition-all">
          <span className="text-white text-sm font-medium">Skill Matrix</span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {recentSessions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{s.session_type}</p>
                  <p className="text-commander-muted text-xs">{s.date}</p>
                </div>
                {s.gas_level && (
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.gas_level > 7 ? "bg-red-900 text-red-300" : s.gas_level > 4 ? "bg-yellow-900 text-yellow-300" : "bg-green-900 text-green-300"}`}>
                    Gas: {s.gas_level}/10
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}