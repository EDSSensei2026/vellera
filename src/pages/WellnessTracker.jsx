import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function WellnessTracker() {
  const [target, setTarget] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ target_metric: "", target_date: "" });
  const [lastLog, setLastLog] = useState(null);
  const [todayLog, setTodayLog] = useState({
    weight: "",
    exerciseCompleted: false,
  });
  const [last30Days, setLast30Days] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Load target
      const targets = await base44.entities.Wellness_Targets.list("-created_date", 1);
      if (targets.length > 0) {
        setTarget(targets[0]);
        setGoalForm({
          target_metric: targets[0].target_metric || "",
          target_date: targets[0].target_date || "",
        });
      }

      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .split("T")[0];

      // Fetch 30-day history
      const allLogs = await base44.entities.BiometricLog.list("-date", 100);
      const recentLogs = allLogs
        .filter((l) => l.date >= thirtyDaysAgo)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setLast30Days(recentLogs);

      // Get today's log
      const todayData = allLogs.find((l) => l.date === today);
      if (todayData) {
        setTodayLog({
          weight: todayData.weight_lbs || "",
          exerciseCompleted: todayData.exercise_completed || false,
        });
        setCurrentWeight(todayData.weight_lbs);
      }

      // Get latest weight
      if (recentLogs.length > 0) {
        setCurrentWeight(recentLogs[recentLogs.length - 1].weight_lbs);
        setLastLog(recentLogs[recentLogs.length - 1]);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSaveLog = async () => {
    if (!todayLog.weight) {
      toast.error("Please enter your weight");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      await base44.entities.BiometricLog.create({
        date: today,
        weight_lbs: Number(todayLog.weight),
        exercise_completed: todayLog.exerciseCompleted,
      });

      toast.success("Wellness log saved!");
      setCurrentWeight(Number(todayLog.weight));

      // Refresh data
      const allLogs = await base44.entities.BiometricLog.list("-date", 100);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .split("T")[0];
      const recentLogs = allLogs
        .filter((l) => l.date >= thirtyDaysAgo)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setLast30Days(recentLogs);
    } catch (error) {
      toast.error("Failed to save log");
    }

    setSaving(false);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.target_metric) {
      toast.error("Enter target weight");
      return;
    }
    if (target) {
      await base44.entities.Wellness_Targets.update(target.id, goalForm);
      setTarget({ ...target, ...goalForm });
    } else {
      const newTarget = await base44.entities.Wellness_Targets.create(goalForm);
      setTarget(newTarget);
    }
    setEditingGoal(false);
    toast.success("Goal updated!");
  };

  const targetWeight = target?.target_metric;
  const weightDiff = currentWeight && lastLog ? currentWeight - lastLog.weight_lbs : null;
  const progress =
    currentWeight && targetWeight
      ? Math.round(((currentWeight - targetWeight) / (currentWeight - targetWeight + 50)) * 100)
      : 0;

  const chartData = last30Days.map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: log.weight_lbs,
  }));

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto pb-24">
      <h1 className="text-white text-2xl font-black tracking-tight">Wellness Tracker</h1>

      {/* Goal Editor Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-white font-bold text-lg">Set Wellness Goal</h2>
            <div>
              <label className="text-xs text-commander-muted block mb-2">Target Weight (lbs)</label>
              <input
                type="number"
                step="0.5"
                value={goalForm.target_metric}
                onChange={(e) => setGoalForm((p) => ({ ...p, target_metric: Number(e.target.value) }))}
                placeholder="e.g. 240"
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-commander-muted block mb-2">Target Date (optional)</label>
              <input
                type="date"
                value={goalForm.target_date || ""}
                onChange={(e) => setGoalForm((p) => ({ ...p, target_date: e.target.value }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={handleSaveGoal}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-bold hover:bg-blue-700 transition-all"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      {/* Goal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 bg-gradient-to-r from-blue-950 to-commander-surface border border-blue-800 rounded-2xl p-6 shadow-lg">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">
            Goal Overview
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-commander-muted text-xs mb-1">Target Weight</p>
                <p className="text-white font-black text-2xl">
                  {targetWeight ? `${targetWeight} lbs` : "—"}
                </p>
              </div>
              <button
                onClick={() => setEditingGoal(!editingGoal)}
                className="text-blue-400 text-xs font-bold hover:text-blue-300 transition-all"
              >
                {editingGoal ? "Cancel" : "Edit"}
              </button>
            </div>
            <div>
              <p className="text-commander-muted text-xs mb-1">Current Weight</p>
              <p className="text-blue-300 font-black text-2xl">
                {currentWeight ? `${currentWeight} lbs` : "—"}
              </p>
            </div>
            <div>
              <p className="text-commander-muted text-xs mb-1">Difference</p>
              <p
                className={`font-black text-2xl ${
                  weightDiff !== null && weightDiff < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {weightDiff !== null ? `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)} lbs` : "—"}
              </p>
            </div>
            <div>
              <p className="text-commander-muted text-xs mb-1">Progress</p>
              <p className="text-yellow-400 font-black text-2xl">{progress}%</p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Logging + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Logging Form */}
        <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-3">
              Daily Logging
            </p>
            <p className="text-sm text-commander-muted mb-4">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div>
            <label className="text-sm text-white font-semibold block mb-2">Recorded Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              value={todayLog.weight}
              onChange={(e) =>
                setTodayLog((prev) => ({ ...prev, weight: e.target.value }))
              }
              placeholder="e.g. 245.5"
              className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-800/30 border border-commander-border rounded-xl p-4">
            <input
              type="checkbox"
              id="exercise"
              checked={todayLog.exerciseCompleted}
              onChange={(e) =>
                setTodayLog((prev) => ({ ...prev, exerciseCompleted: e.target.checked }))
              }
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="exercise" className="text-white font-semibold cursor-pointer flex-1">
              Exercise Completed
            </label>
            {todayLog.exerciseCompleted && (
              <span className="text-green-400 text-xs font-bold">✓</span>
            )}
          </div>

          <button
            onClick={handleSaveLog}
            disabled={saving || !todayLog.weight}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Daily Log"}
          </button>
        </div>

        {/* 30-Day Weight Chart */}
        <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-4">
            Last 30 Days
          </p>
          {loading ? (
            <div className="h-64 bg-gray-800/30 rounded-lg animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-commander-muted">No data yet. Start logging to see your trend!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v) => [`${v} lbs`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {last30Days.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-2">
              Avg Weight (30d)
            </p>
            <p className="text-white font-black text-2xl">
              {(
                last30Days.reduce((s, l) => s + (l.weight_lbs || 0), 0) /
                last30Days.length
              ).toFixed(1)}{" "}
              lbs
            </p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-2">
              Lowest (30d)
            </p>
            <p className="text-green-400 font-black text-2xl">
              {Math.min(...last30Days.map((l) => l.weight_lbs || 999))} lbs
            </p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-2">
              Logs This Month
            </p>
            <p className="text-blue-400 font-black text-2xl">{last30Days.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}