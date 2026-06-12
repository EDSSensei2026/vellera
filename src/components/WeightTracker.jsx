import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Scale } from "lucide-react";

const START_WEIGHT = 250;
const TARGET_WEIGHT = 230;
const COMP_DATE = new Date("2026-07-18");

export default function WeightTracker() {
  const [logs, setLogs] = useState([]);
  const [inputWeight, setInputWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    const all = await base44.entities.BiometricLog.list("-date", 60);
    const withWeight = all.filter(l => l.weight_lbs);
    setLogs(withWeight);
    const todayEntry = withWeight.find(l => l.date === today);
    if (todayEntry) {
      setTodayLogged(true);
      setInputWeight(String(todayEntry.weight_lbs));
    }
  };

  useEffect(() => {
    // Stagger to avoid rate limit burst on dashboard mount
    const timer = setTimeout(() => load(), 200);
    return () => clearTimeout(timer);
  }, []);

  const saveWeight = async () => {
    if (!inputWeight) return;
    setSaving(true);
    const existing = await base44.entities.BiometricLog.filter({ date: today });
    if (existing[0]) {
      await base44.entities.BiometricLog.update(existing[0].id, { weight_lbs: Number(inputWeight) });
    } else {
      await base44.entities.BiometricLog.create({ date: today, weight_lbs: Number(inputWeight) });
    }
    toast.success("Weight logged!");
    setTodayLogged(true);
    setSaving(false);
    load();
  };

  const chartData = logs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(l => ({ date: l.date.slice(5), weight: l.weight_lbs }));

  const latestWeight = logs[0]?.weight_lbs ?? START_WEIGHT;
  const lostSoFar = START_WEIGHT - latestWeight;
  const remaining = latestWeight - TARGET_WEIGHT;
  const daysLeft = Math.max(1, Math.ceil((COMP_DATE - new Date()) / 86400000));
  const lbsPerWeek = remaining > 0 ? ((remaining / daysLeft) * 7).toFixed(1) : 0;
  const onTrack = remaining <= 0 || Number(lbsPerWeek) <= 1.5;

  const progressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / (START_WEIGHT - TARGET_WEIGHT)) * 100)));

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-commander-red" />
          <p className="text-white font-bold text-sm">Weight Cut Tracker</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${onTrack ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
          {onTrack ? "✓ On Track" : "⚠ Behind Pace"}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-white font-black text-lg">{latestWeight}</p>
          <p className="text-commander-muted text-xs">Current lbs</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-commander-red font-black text-lg">{TARGET_WEIGHT}</p>
          <p className="text-commander-muted text-xs">Target lbs</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className={`font-black text-lg ${remaining <= 0 ? "text-green-400" : "text-yellow-400"}`}>
            {remaining <= 0 ? "DONE" : `${remaining} lbs`}
          </p>
          <p className="text-commander-muted text-xs">To go</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-commander-muted">Cut Progress: {START_WEIGHT} → {TARGET_WEIGHT} lbs</span>
          <span className="text-white font-bold">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="bg-gradient-to-r from-red-700 to-green-600 h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        {remaining > 0 && (
          <p className={`text-xs mt-1 ${onTrack ? "text-green-400" : "text-red-400"}`}>
            Need ~{lbsPerWeek} lbs/week over {Math.ceil(daysLeft / 7)} weeks · {onTrack ? "Sustainable pace ✓" : "Pace too aggressive — review deficit"}
          </p>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#555", fontSize: 9 }} width={32} />
            <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} lbs`, "Weight"]} />
            <ReferenceLine y={TARGET_WEIGHT} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Target", fill: "#22c55e", fontSize: 9, position: "insideTopRight" }} />
            <Line type="monotone" dataKey="weight" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} name="Weight" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Daily Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={inputWeight}
            onChange={e => setInputWeight(e.target.value)}
            placeholder="Today's weight (lbs)"
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm pr-10"
          />
          <span className="absolute right-3 top-2.5 text-commander-muted text-xs">lbs</span>
        </div>
        <button
          onClick={saveWeight}
          disabled={saving || !inputWeight}
          className="bg-commander-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {saving ? "..." : todayLogged ? "Update" : "Log"}
        </button>
      </div>
    </div>
  );
}