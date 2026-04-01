import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SafetyValve from "../components/SafetyValve";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useTabStack } from "../hooks/useTabStack";
import RecoveryPerformanceWidget from "../components/RecoveryPerformanceWidget";
import DailyFocus from "../components/DailyFocus";
import WeightTracker from "../components/WeightTracker";
import DailyMatPriority from "../components/DailyMatPriority";
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
  const containerRef = useRef(null);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

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

  const { data: todayLog = null } = useQuery({
    queryKey: ["biometrics", "today"],
    queryFn: async () => {
      const todayStr = today.toISOString().split("T")[0];
      const result = await base44.entities.BiometricLog.filter({ date: todayStr });
      return result[0] || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: weekLogs = [] } = useQuery({
    queryKey: ["biometrics", "week"],
    queryFn: () => base44.entities.BiometricLog.list("-date", 7),
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ["sessions", "recent"],
    queryFn: () => base44.entities.TrainingSession.list("-date", 5),
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["biometrics", "today"] }),
        queryClient.refetchQueries({ queryKey: ["biometrics", "week"] }),
        queryClient.refetchQueries({ queryKey: ["sessions", "recent"] }),
      ]);
      toast.success("Data refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const pullRef = usePullToRefresh(handleRefresh);
  useTabStack(containerRef);

  const waterTarget = Math.round(250 / 2 + 32 * (todayClasses.length > 0 ? 1.5 : 0));

  const WARRIOR_IMAGES = [
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/9af62c059_2845.png",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/3d1213c6a_2825.jpg",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/96befed01_2826.jpg",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/112a5c2cc_2827.jpg",
  ];
  const heroImg = WARRIOR_IMAGES[today.getDay() % WARRIOR_IMAGES.length];

  return (
    <div ref={containerRef} className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {/* Refresh Indicator */}
      {refreshing && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-commander-surface border border-commander-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-commander-red border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white font-semibold">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Motivational Hero */}
      <div className="relative rounded-xl overflow-hidden border border-commander-border" style={{ minHeight: 200 }}>
        <img src={heroImg} alt="warrior" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
        <div className="relative p-4 flex flex-col justify-end" style={{ minHeight: 200 }}>
          <p className="text-xs text-commander-red uppercase tracking-widest font-bold mb-1">July 18, 2026 Competition</p>
          <p className="text-white text-5xl font-black font-mono leading-none">{daysLeft}</p>
          <p className="text-white/70 text-sm mb-2">days until the mat calls</p>
          <div className="w-full bg-white/20 rounded-full h-2 mb-1">
            <div className="bg-commander-red h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs">{progress}% complete · <span className={phase.color}>{phase.label}</span></p>
            <p className="text-white/60 text-xs">{sessionsLeft} sessions left</p>
          </div>
          {daysLeft < 14 && (
            <div className="mt-2 bg-red-900/60 border border-red-700 rounded-lg px-3 py-2">
              <p className="text-red-300 text-xs font-bold">⚠️ TAPER: Reduce lifting 50%. Home mobility only.</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Mat Priority — AI-generated morning brief */}
      <DailyMatPriority />

      {/* Weight Tracker */}
      <WeightTracker />

      {/* Daily Focus */}
      <DailyFocus />

      {/* Safety Valve */}
      <SafetyValve log={todayLog} weekLogs={weekLogs} />

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

      {/* Recovery vs Performance Widget */}
      <RecoveryPerformanceWidget />

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