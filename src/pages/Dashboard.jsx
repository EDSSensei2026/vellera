import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// import SafetyValve from "../components/SafetyValve";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
// import RecoveryPerformanceWidget from "../components/RecoveryPerformanceWidget";
// import RecoveryCommandCenter from "../components/RecoveryCommandCenter";
// import WhoopConnect from "../components/WhoopConnect";
// import WeeklyTrainingTrends from "../components/WeeklyTrainingTrends";
// import PerformanceSummaryWidget from "../components/PerformanceSummaryWidget";
// import StrengthMetrics from "../components/StrengthMetrics";
// import BodybuildingMetrics from "../components/BodybuildingMetrics";
// import EnduranceMetrics from "../components/EnduranceMetrics";
// import StreaksWidget from "../components/StreaksWidget";
// import DailyFocus from "../components/DailyFocus";
// import WeightTracker from "../components/WeightTracker";
// import DailyMatPriority from "../components/DailyMatPriority";
// import AdaptiveHome from "../components/AdaptiveHome";
// import ReadinessCheckIn from "../components/ReadinessCheckIn";
// import AdaptiveWorkoutDashboard from "../components/AdaptiveWorkoutDashboard";
// import AchievementsWidget from "../components/AchievementsWidget";
import { Droplets, Flame, Moon, Heart, Zap, ChevronRight } from "lucide-react";
import MorningReadinessAlert from "../components/MorningReadinessAlert";
import BetaWelcomeModal from "../components/BetaWelcomeModal";
import { Link } from "react-router-dom";

// User can set custom goal date in settings
const DEFAULT_GOAL_DATE = new Date("2026-07-18");
const PREP_START = new Date("2026-03-28");

// Generic daily training prompts
const DAILY_FOCUS = {
  1: { label: "Mobility & Recovery", color: "text-purple-400", desc: "Focus on flexibility, joint health, and CNS recovery." },
  2: { label: "Strength Training", color: "text-blue-400", desc: "Compound movements, progressive overload, power development." },
  3: { label: "Cardio & Conditioning", color: "text-green-400", desc: "Zone 2 steady state or HIIT based on your track." },
  4: { label: "Technique & Skill Work", color: "text-yellow-400", desc: "Focused drilling, form refinement, problem-solving." },
  5: { label: "Active Recovery", color: "text-pink-400", desc: "Light movement, stretching, breathing work." },
  6: { label: "Long Duration Session", color: "text-vellera-blue", desc: "Extended training for your primary discipline." },
  0: { label: "Complete Rest Day", color: "text-gray-400", desc: "Sleep, hydration, meal prep. Mental recovery prioritized." },
};

function getTrainingPhase(daysLeft) {
  if (daysLeft > 60) return { phase: 1, label: "Base Building", color: "text-blue-400", focus: "Build aerobic base & fundamental strength" };
  if (daysLeft > 30) return { phase: 2, label: "Strength & Power", color: "text-yellow-400", focus: "Progressive overload & sport-specific power" };
  if (daysLeft > 14) return { phase: 3, label: "Peak Training", color: "text-orange-400", focus: "High intensity, volume management" };
  return { phase: 4, label: "Taper", color: "text-red-400", focus: "Reduce volume, maintain intensity, prioritize recovery" };
}

export default function Dashboard() {
  const containerRef = useRef(null);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
          setUserProfile(profiles[0] || null);

          // Award achievements on login (only run once per session)
          const sessionKey = 'achievementsRun';
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            base44.functions.invoke('awardAchievements', {}).catch(err => {
              console.warn('Award achievements failed (rate limited):', err.message);
            });
          }
        }

        base44.analytics.track({
          eventName: "daily_login",
          properties: {
            day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
            hour_of_day: new Date().getHours(),
          },
        });
      } catch (err) {
        console.error('Dashboard init failed:', err);
      }
    };

    initDashboard();
  }, []);

  const today = new Date();
  const goalDate = userProfile?.goal_date ? new Date(userProfile.goal_date) : DEFAULT_GOAL_DATE;
  const daysLeft = Math.max(0, Math.ceil((goalDate - today) / 86400000));
  const totalDays = Math.ceil((goalDate - PREP_START) / 86400000);
  const progress = Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)));
  const weeksLeft = Math.floor(daysLeft / 7);
  const sessionsLeft = weeksLeft * 5;
  const dayOfWeek = today.getDay();
  const phase = getTrainingPhase(daysLeft);
  const dailyFocus = DAILY_FOCUS[dayOfWeek] || DAILY_FOCUS[0];

  const { data: todayLog = null } = useQuery({
    queryKey: ["biometrics", "today"],
    queryFn: async () => {
      const todayStr = today.toISOString().split("T")[0];
      const result = await base44.entities.BiometricLog.filter({ date: todayStr });
      return result[0] || null;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: weekLogs = [] } = useQuery({
    queryKey: ["biometrics", "week"],
    queryFn: () => new Promise(r => setTimeout(r, 300)).then(() => base44.entities.BiometricLog.list("-date", 7)),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ["sessions", "recent"],
    queryFn: () => new Promise(r => setTimeout(r, 600)).then(() => base44.entities.TrainingSession.list("-date", 5)),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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

  const userWeight = userProfile?.weight_kg || 113;
  const waterTarget = Math.round(userWeight * 0.5 + 32);

  const WARRIOR_IMAGES = [
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/9af62c059_2845.png",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/3d1213c6a_2825.jpg",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/96befed01_2826.jpg",
    "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/112a5c2cc_2827.jpg",
  ];
  const heroImg = WARRIOR_IMAGES[today.getDay() % WARRIOR_IMAGES.length];

  return (
    <div ref={pullRef} className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <BetaWelcomeModal />
      <MorningReadinessAlert />
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
      <div className="relative rounded-xl overflow-hidden border border-commander-border bg-gradient-to-br from-commander-surface to-gray-900" style={{ minHeight: 200 }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(45deg, ${userProfile?.vellera_track === 'strength' ? '#CCFF00' : userProfile?.vellera_track === 'endurance' ? '#00E5FF' : '#888888'}44 2px, transparent 2px)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        <div className="relative p-4 flex flex-col justify-end" style={{ minHeight: 200 }}>
          <p className="text-xs text-vellera-blue uppercase tracking-widest font-bold mb-1">{userProfile?.vellera_track?.replace(/_/g, ' ') || 'Training'} Path</p>
          <p className="text-white text-5xl font-black font-mono leading-none">{daysLeft}</p>
          <p className="text-white/70 text-sm mb-2">days to your goal</p>
          <div className="w-full bg-white/20 rounded-full h-2 mb-1">
            <div className="bg-vellera-blue h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs">{progress}% complete · <span className={phase.color}>{phase.label}</span></p>
            <p className="text-white/60 text-xs">{sessionsLeft} sessions planned</p>
          </div>
          {daysLeft < 14 && (
            <div className="mt-2 bg-red-900/60 border border-red-700 rounded-lg px-3 py-2">
              <p className="text-red-300 text-xs font-bold">⚠️ TAPER WEEK: Reduce volume, maintain intensity.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recovery Command Center — auto-syncs wearable data + color-codes intensity */}
      {/* <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <RecoveryCommandCenter />
      </div> */}

      {/* Readiness Check-In */}
      {/* <ReadinessCheckIn /> */}

      {/* Adaptive Home — personalized track greeting + featured routines */}
      {/* <AdaptiveHome /> */}

      {/* Daily Mat Priority — AI-generated morning brief */}
      {/* <DailyMatPriority /> */}

      {/* Achievements */}
      {/* <AchievementsWidget /> */}

      {/* Streaks */}
      {/* <StreaksWidget /> */}

      {/* Weight Tracker */}
      {/* <WeightTracker /> */}

      {/* Daily Focus */}
      {/* <DailyFocus /> */}

      {/* Path-Specific Metrics */}
      {/* {userProfile?.fitness_path === "strength" && <StrengthMetrics />}
      {userProfile?.fitness_path === "bodybuilding" && <BodybuildingMetrics />}
      {userProfile?.fitness_path === "endurance" && <EnduranceMetrics />} */}

      {/* Safety Valve */}
      {/* <SafetyValve log={todayLog} weekLogs={weekLogs} /> */}

      {/* Generic Daily Schedule Note */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Today's Plan</p>
        <p className="text-white text-sm font-medium mb-1">Check your calendar for scheduled sessions</p>
        <p className="text-commander-muted text-xs">View Training Log to log today's workout or adjust based on recovery.</p>
      </div>

      {/* Daily Training Focus */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-1">Today's Focus</p>
        <p className={`font-bold text-sm ${dailyFocus.color}`}>{dailyFocus.label}</p>
        <p className="text-commander-muted text-xs mt-1">{dailyFocus.desc}</p>
      </div>

      {/* Hydration */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center gap-3">
        <Droplets className="w-5 h-5 text-blue-400" />
        <div>
          <p className="text-white text-sm font-semibold">Daily Hydration: {waterTarget}+ oz</p>
          <p className="text-commander-muted text-xs">Bodyweight ÷ 2 + 32 oz per hour of training</p>
        </div>
      </div>

      {/* Whoop Connect */}
      {/* <WhoopConnect /> */}

      {/* Recovery vs Performance Widget */}
      {/* <RecoveryPerformanceWidget /> */}

      {/* Weekly Training Trends */}
      {/* <WeeklyTrainingTrends /> */}

      {/* Performance Summary PDF */}
      {/* <PerformanceSummaryWidget /> */}

      {/* Adaptive Workout Dashboard — filtered by user track */}
      {/* <AdaptiveWorkoutDashboard /> */}

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
        <Link to="/workout-history" className="bg-commander-surface border border-commander-border rounded-xl p-3 flex items-center justify-between hover:border-[#00E5FF] transition-all">
          <span className="text-white text-sm font-medium">📊 Workout Analytics</span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
        <Link to="/analyze" className="bg-commander-surface border border-[#00E5FF40] rounded-xl p-3 flex items-center justify-between hover:border-[#00E5FF] transition-all">
          <span className="text-white text-sm font-medium">🎯 Analyze Technique</span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
        <Link to="/squads" className="col-span-2 bg-commander-surface border border-purple-900 rounded-xl p-3 flex items-center justify-between hover:border-purple-500 transition-all">
          <span className="text-white text-sm font-medium">👥 Training Squads</span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
        <Link to="/search-console" className="col-span-2 bg-commander-surface border border-green-900 rounded-xl p-3 flex items-center justify-between hover:border-green-500 transition-all">
          <span className="text-white text-sm font-medium">🔍 Search Performance</span>
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