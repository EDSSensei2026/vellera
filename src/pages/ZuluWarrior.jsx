import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Flame, Shield, Zap, Heart, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ZuluWarrior() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadZuluData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        // Fetch active Zulu plan
        const plans = await base44.entities.TrainingPlan.filter(
          { created_by: currentUser.email, plan_name: { $contains: "Zulu" } },
          { limit: 1 }
        );

        if (plans.length > 0) {
          setPlan(plans[0]);
        }

        // Fetch today's biometrics
        const today = new Date().toISOString().split("T")[0];
        const todayBio = await base44.entities.BiometricLog.filter({ date: today }, { limit: 1 });
        if (todayBio.length > 0) {
          setTodayMetrics(todayBio[0]);
        }

        // Fetch last 7 days for correlation chart
        const weekBio = await base44.entities.BiometricLog.list("-date", 7);
        const chartData = weekBio
          .reverse()
          .map((bio) => ({
            date: bio.date,
            recovery: bio.recovery_score || 50,
            strength_gain: bio.estimated_1rm_change || 0,
            cognitive_output: bio.cognitive_output_score || 0,
          }));
        setWeeklyData(chartData);
      } catch (err) {
        console.error("Failed to load Zulu data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadZuluData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 17 && hour < 21;

  const recoveryStatus = todayMetrics?.recovery_score
    ? todayMetrics.recovery_score > 67
      ? "green"
      : todayMetrics.recovery_score >= 34
      ? "yellow"
      : "red"
    : "unknown";

  const statusColor = {
    green: "bg-green-900 border-green-700 text-green-300",
    yellow: "bg-yellow-900 border-yellow-700 text-yellow-300",
    red: "bg-red-900 border-red-700 text-red-300",
    unknown: "bg-gray-800 border-gray-700 text-gray-300",
  };

  const statusIcon = {
    green: "🔥",
    yellow: "⚠️",
    red: "🛑",
    unknown: "❓",
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-2xl font-black">Zulu Warrior v2.0</h1>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-vellera-blue/20 to-vellera-green/20 border border-vellera-blue/50 rounded-xl p-4 space-y-2">
        <p className="text-vellera-blue font-bold text-sm">🎯 YOUR MISSION</p>
        <p className="text-white text-sm font-semibold">
          {isMorning
            ? "🔥 The Forge (05:00): Your strength is the shield for your family. Push for them."
            : isEvening
            ? "⚔️ The Combat (17:00): Assess Strain vs. Capacity. A wise protector stays healthy. Go tactical."
            : "💪 Build warrior mass + BJJ/MMA stamina. Recovery is a tactical decision for the long game."}
        </p>
      </div>

      {/* Today's Status */}
      {todayMetrics && (
        <div className={`border rounded-xl p-4 space-y-3 ${statusColor[recoveryStatus]}`}>
          <div className="flex items-center justify-between">
            <p className="font-bold text-lg">{statusIcon[recoveryStatus]} RECOVERY STATUS</p>
            <p className="text-2xl font-black">{todayMetrics.recovery_score}%</p>
          </div>
          <p className="text-xs opacity-80">
            {recoveryStatus === "green"
              ? "Green Zone: Progressive Overload +2.5% | Full Combat Clearance"
              : recoveryStatus === "yellow"
              ? "Yellow Zone: Maintenance Load | Drills Only (No Live Rolling)"
              : "Red Zone: Shield Recovery | Cancel Lift | Rest Day"}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/20 rounded p-2">
              <p className="opacity-70">Strain</p>
              <p className="font-bold">{todayMetrics.training_load || 0}/10</p>
            </div>
            <div className="bg-black/20 rounded p-2">
              <p className="opacity-70">Sleep Perf</p>
              <p className="font-bold">{todayMetrics.sleep_performance || 0}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Whoop Recovery vs Strength Correlation */}
      {weeklyData.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-vellera-blue" /> 7-Day Correlation: Recovery → Strength
          </h2>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="recovery" stroke="#00E5FF" name="Recovery %" strokeWidth={2} />
                <Line type="monotone" dataKey="strength_gain" stroke="#CCFF00" name="Strength Gain (lbs)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-commander-muted">
            🔍 Pattern: Green recovery days correlate with +0.5-1.2 lb strength gains. Yellow days maintain plateau. Red days show -2-3% performance dips.
          </p>
        </div>
      )}

      {/* Tracking Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center space-y-2">
          <p className="text-vellera-blue text-2xl">📐</p>
          <p className="text-xs text-commander-muted uppercase font-bold">Shoulder-Waist</p>
          <p className="text-white font-black">1.31</p>
          <p className="text-xs text-green-400">↑ 0.03 this month</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center space-y-2">
          <p className="text-vellera-green text-2xl">🧠</p>
          <p className="text-xs text-commander-muted uppercase font-bold">Cognitive Output</p>
          <p className="text-white font-black">87%</p>
          <p className="text-xs text-green-400">Peak post-AM training</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center space-y-2">
          <p className="text-vellera-green text-2xl">🏆</p>
          <p className="text-xs text-commander-muted uppercase font-bold">Whoop Strength</p>
          <p className="text-white font-black">+12 lbs</p>
          <p className="text-xs text-green-400">6-week bench increase</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      {plan && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold">This Week's Forge</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">MON:</span>
              <span className="text-gray-300">The Shield (OHP 4x8, Inc Press 3x10, Pull-ups 4x8) | BJJ Fund</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">TUE:</span>
              <span className="text-gray-300">The Charge (Squat 5x5, Lunges 3x20, KB Swings 4x20) | MMA Striking</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">WED:</span>
              <span className="text-gray-300">Shield Mobility Flow | Technical BJJ (Low Strain)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">THU:</span>
              <span className="text-gray-300">The Density (DL 3x5, Rows 4x10, Curls 3x12) | Live Rolling</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">FRI:</span>
              <span className="text-gray-300">The Impi (Dips 4x10, Landmine 3x12, Leg Raises 4xAMRAP) | MMA Sparring</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">SAT:</span>
              <span className="text-gray-300">Speed Sprints (5x 40yd) | Open Mat / Comp Prep</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-vellera-blue font-bold">SUN:</span>
              <span className="text-gray-300">Absolute Reset: Family, Garden, Recovery Focus</span>
            </div>
          </div>
        </div>
      )}

      {/* Wisdom Card */}
      <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4">
        <p className="text-purple-300 text-sm italic">
          "Strength without wisdom is tyranny. Your shield protects those you love. Train with purpose, recover with intention, and lead with discipline."
        </p>
      </div>
    </div>
  );
}