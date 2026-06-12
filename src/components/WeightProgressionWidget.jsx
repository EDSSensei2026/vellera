import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { TrendingDown, TrendingUp, Minus, Target, Zap, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const TARGET_BF = 12; // default target body fat %
const TARGET_WEIGHT = 215; // default target weight lbs

function getTrajectory(entries) {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysDiff = Math.max(1, (new Date(last.date) - new Date(first.date)) / 86400000);
  const weightDelta = (last.weight_lbs || 0) - (first.weight_lbs || 0);
  const bfDelta = (last.body_fat_pct || 0) - (first.body_fat_pct || 0);
  return {
    lbsPerWeek: (weightDelta / daysDiff) * 7,
    bfPerWeek: (bfDelta / daysDiff) * 7,
    currentWeight: last.weight_lbs,
    currentBF: last.body_fat_pct,
    weeksDiff: daysDiff / 7,
  };
}

function calcAdjustment(trajectory, targetWeight, targetBF) {
  if (!trajectory) return { adjustment: 0, reason: "Not enough data yet", urgency: "neutral" };

  const { lbsPerWeek, currentWeight, currentBF } = trajectory;
  const weightGap = (currentWeight || 0) - (targetWeight || TARGET_WEIGHT);
  const bfGap = (currentBF || 0) - (targetBF || TARGET_BF);

  // Losing too fast (>2 lbs/week) → add calories (muscle preservation)
  if (lbsPerWeek < -2) return { adjustment: +250, reason: "Losing too fast — risk of muscle loss. Adding 250 kcal buffer.", urgency: "warning" };
  // Not losing (within 0.5 lbs/week) and still above target → cut
  if (lbsPerWeek > -0.5 && weightGap > 5) return { adjustment: -200, reason: "Progress stalled. Reducing by 200 kcal to re-trigger fat loss.", urgency: "cut" };
  // Close to target weight (within 5 lbs)
  if (Math.abs(weightGap) <= 5) return { adjustment: +100, reason: "Near goal weight — shifting to maintenance/recomp phase.", urgency: "maintain" };
  // BF still high but losing steadily → stay course
  if (bfGap > 3 && lbsPerWeek < -0.5) return { adjustment: 0, reason: "On track. Current deficit is working.", urgency: "green" };
  return { adjustment: 0, reason: "Holding current targets.", urgency: "neutral" };
}

const URGENCY_STYLES = {
  warning: "border-yellow-600 bg-yellow-900/20 text-yellow-300",
  cut: "border-red-600 bg-red-900/20 text-red-300",
  maintain: "border-vellera-blue bg-vellera-blue/10 text-vellera-blue",
  green: "border-vellera-green bg-vellera-green/10 text-vellera-green",
  neutral: "border-commander-border bg-commander-surface text-commander-muted",
};

export default function WeightProgressionWidget({ onAdjustmentReady }) {
  const [entries, setEntries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [physique, profiles] = await Promise.all([
        base44.entities.PhysiqueTracker.list("-date", 30),
        base44.entities.UserProfile.list("-created_date", 1),
      ]);
      setEntries(physique);
      setProfile(profiles[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  const targetWeight = profile?.zulu_target_weight_lbs || TARGET_WEIGHT;
  const trajectory = getTrajectory(entries);
  const { adjustment, reason, urgency } = calcAdjustment(trajectory, targetWeight, TARGET_BF);

  // Notify parent of adjustment value
  useEffect(() => {
    if (!loading && onAdjustmentReady) onAdjustmentReady(adjustment);
  }, [adjustment, loading]);

  const chartData = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-12)
    .map(e => ({
      date: e.date?.slice(5), // MM-DD
      weight: e.weight_lbs || null,
      bf: e.body_fat_pct || null,
    }));

  const handleApplyAdjustment = async () => {
    if (adjustment === 0) return;
    setApplying(true);
    await base44.functions.invoke("adjustCaloricTargets", { calorie_adjustment: adjustment });
    setApplied(true);
    setApplying(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-vellera-blue" />
    </div>
  );

  if (entries.length === 0) return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center space-y-2">
      <Target className="w-8 h-8 mx-auto text-commander-muted opacity-50" />
      <p className="text-commander-muted text-sm">No physique data yet.</p>
      <p className="text-xs text-gray-600">Log entries in Physique Tracker to enable auto-adjustments.</p>
    </div>
  );

  const latest = entries[0];
  const weightToGoal = latest?.weight_lbs ? latest.weight_lbs - targetWeight : null;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-black text-lg">{latest?.weight_lbs ?? "—"}</p>
          <p className="text-commander-muted text-xs">Current lbs</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-black text-lg">{latest?.body_fat_pct != null ? `${latest.body_fat_pct}%` : "—"}</p>
          <p className="text-commander-muted text-xs">Body Fat</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${weightToGoal > 0 ? "border-yellow-700 bg-yellow-900/20" : "border-vellera-green bg-vellera-green/10"}`}>
          <p className={`font-black text-lg ${weightToGoal > 0 ? "text-yellow-300" : "text-vellera-green"}`}>
            {weightToGoal != null ? (weightToGoal > 0 ? `-${weightToGoal.toFixed(1)}` : "✓") : "—"}
          </p>
          <p className="text-xs text-commander-muted">lbs to goal</p>
        </div>
      </div>

      {/* Trend Info */}
      {trajectory && (
        <div className="flex items-center gap-3 bg-commander-surface border border-commander-border rounded-xl p-3">
          {trajectory.lbsPerWeek < -0.3 ? (
            <TrendingDown className="w-5 h-5 text-vellera-green shrink-0" />
          ) : trajectory.lbsPerWeek > 0.3 ? (
            <TrendingUp className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Minus className="w-5 h-5 text-yellow-400 shrink-0" />
          )}
          <div>
            <p className="text-white text-sm font-bold">
              {trajectory.lbsPerWeek < 0 ? "↓" : "↑"} {Math.abs(trajectory.lbsPerWeek).toFixed(2)} lbs/week
            </p>
            <p className="text-commander-muted text-xs">
              {trajectory.bfPerWeek != null && trajectory.bfPerWeek !== 0
                ? `BF% trend: ${trajectory.bfPerWeek < 0 ? "↓" : "↑"} ${Math.abs(trajectory.bfPerWeek).toFixed(2)}%/week`
                : "BF% tracking insufficient"}
            </p>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length >= 2 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 space-y-2">
          <p className="text-white text-xs font-bold uppercase tracking-widest">Weight Trend</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 9 }} />
                <YAxis domain={["auto", "auto"]} stroke="#555" tick={{ fontSize: 9 }} width={32} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: 11 }}
                  labelStyle={{ color: "#fff" }}
                />
                <ReferenceLine y={targetWeight} stroke="#CCFF00" strokeDasharray="4 2" label={{ value: `Goal ${targetWeight}`, fill: "#CCFF00", fontSize: 9 }} />
                <Line type="monotone" dataKey="weight" stroke="#00E5FF" dot={{ r: 3 }} strokeWidth={2} name="Weight (lbs)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Auto-Adjustment Recommendation */}
      <div className={`rounded-xl p-4 border space-y-3 ${URGENCY_STYLES[urgency]}`}>
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              {adjustment > 0 ? `+${adjustment} kcal/day recommended` : adjustment < 0 ? `${adjustment} kcal/day recommended` : "Targets on track"}
            </p>
            <p className="text-xs opacity-80">{reason}</p>
          </div>
        </div>
        {adjustment !== 0 && !applied && (
          <button onClick={handleApplyAdjustment} disabled={applying}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-2 text-xs font-black transition-all disabled:opacity-60">
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {applying ? "Applying..." : `Apply ${adjustment > 0 ? "+" : ""}${adjustment} kcal to Today's Plan`}
          </button>
        )}
        {applied && <p className="text-xs text-center opacity-70 font-bold">✓ Applied to today's nutrition plan</p>}
      </div>
    </div>
  );
}