import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const COMP_DATE = new Date("2026-07-18");
const TARGET_WEIGHT = 230;
const START_WEIGHT = 250;

function getCompPhase(daysLeft) {
  if (daysLeft > 60) return { num: 1, label: "Base Building", color: "text-blue-400", desc: "Prioritize Zone 2 at Crunch + Foundation Technique at The Lab." };
  if (daysLeft > 30) return { num: 2, label: "Specific Prep", color: "text-yellow-400", desc: "Strength & Power at Work Gym + Positional Sparring." };
  if (daysLeft > 14) return { num: 3, label: "The Grind", color: "text-orange-400", desc: "Maximum mat time. Sleep is your weapon. Whoop Recovery over everything." };
  return { num: 4, label: "TAPER", color: "text-red-400", desc: "Home mobility and film study ONLY. No Work Gym. Protect the body." };
}

export default function Competition() {
  const [sessions, setSessions] = useState([]);
  const [bioLogs, setBioLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(250);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((COMP_DATE - today) / 86400000));
  const weeksLeft = Math.floor(daysLeft / 7);
  const phase = getCompPhase(daysLeft);

  useEffect(() => {
    Promise.all([
      base44.entities.TrainingSession.list("-date", 100),
      base44.entities.BiometricLog.list("-date", 30),
    ]).then(([sl, bl]) => {
      setSessions(sl);
      setBioLogs(bl);
      const latestWithWeight = bl.find(l => l.weight_lbs);
      if (latestWithWeight) setCurrentWeight(latestWithWeight.weight_lbs);
    });
  }, []);

  // Comp Score
  const matHours = sessions.reduce((s, sess) => s + ((sess.duration_minutes || 60) / 60), 0);
  const avgSleep = bioLogs.length ? bioLogs.reduce((s, l) => s + (l.sleep_performance || 0), 0) / bioLogs.length : 0;
  const totalInjuries = sessions.reduce((s, sess) => s + (sess.injury_notes?.length || 0), 0);
  const compScore = Math.min(100, Math.round((matHours * 2) + (avgSleep * 0.3) - (totalInjuries * 2)));

  // Weight forecast
  const lbsToLose = currentWeight - TARGET_WEIGHT;
  const weeklyRequired = weeksLeft > 0 ? lbsToLose / weeksLeft : 0;
  const sustainable = weeklyRequired <= 2.0;
  const pctLoss = (weeklyRequired / currentWeight) * 100;
  const strengthWarning = pctLoss > 1;

  // Weight chart data
  const weightData = bioLogs.filter(l => l.weight_lbs).slice().reverse().map(l => ({
    date: l.date?.slice(5),
    weight: l.weight_lbs,
  }));

  // IBJJF class suggestion
  const projectedWeight = currentWeight - (weeklyRequired * weeksLeft);
  const ibjjfClass = projectedWeight > 221 ? "Ultra Heavy (+221 lbs)" : projectedWeight > 194 ? "Super Heavy (194-221 lbs)" : "Heavy (181-194 lbs)";

  // Avg Whoop burn estimate
  const avgBurn = 3200;
  const caloricTarget = avgBurn - 500;

  const saveWeight = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.BiometricLog.create({ date: today, weight_lbs: currentWeight });
    setSaving(false);
  };

  const goScore = compScore >= 70 ? "green" : compScore >= 45 ? "yellow" : "red";
  const scoreColors = { green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400" };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black tracking-tight">Competition</h1>
      </div>

      {/* Countdown */}
      <div className="bg-gradient-to-br from-red-950 to-commander-surface border border-commander-red rounded-xl p-5">
        <p className="text-commander-muted text-xs uppercase tracking-widest mb-1">July 18, 2026 · The Lab Tournament</p>
        <div className="flex items-end gap-3">
          <span className="text-white font-black text-6xl font-mono">{daysLeft}</span>
          <div className="pb-2">
            <p className="text-white text-lg font-bold">days</p>
            <p className="text-commander-muted text-xs">{weeksLeft} weeks · {weeksLeft * 6} sessions</p>
          </div>
        </div>
        <div className="mt-3 border-t border-red-900 pt-3">
          <p className={`text-xs font-bold uppercase tracking-wider ${phase.color}`}>Phase {phase.num}: {phase.label}</p>
          <p className="text-gray-400 text-xs mt-1">{phase.desc}</p>
        </div>
      </div>

      {/* Comp Score */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Competition Readiness Score</p>
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-black font-mono ${scoreColors[goScore]}`}>{compScore}</div>
          <div className="flex-1">
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${goScore === "green" ? "bg-green-500" : goScore === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${compScore}%` }} />
            </div>
            <div className="flex justify-between text-xs text-commander-muted mt-1">
              <span>Mat Hours: {matHours.toFixed(1)}h</span>
              <span>Sleep: {avgSleep.toFixed(0)}%</span>
              <span>Injuries: -{totalInjuries * 2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Forecaster */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest">Weight Class Forecaster</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-commander-muted block mb-1">Current Weight (lbs)</label>
            <input type="number" value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <button onClick={saveWeight} disabled={saving} className="mt-5 bg-commander-red text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50">
            {saving ? "..." : "Log"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-white font-bold text-lg">{TARGET_WEIGHT} lbs</p>
            <p className="text-commander-muted text-xs">Target</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className={`font-bold text-lg ${sustainable ? "text-green-400" : "text-red-400"}`}>{weeklyRequired.toFixed(1)} lbs/wk</p>
            <p className="text-commander-muted text-xs">Required loss</p>
          </div>
        </div>

        {strengthWarning && (
          <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2">
            <p className="text-red-300 text-xs font-bold">⚠️ High risk of strength loss. Increase protein intake. {">"} 1% body weight per week.</p>
          </div>
        )}
        {!sustainable && !strengthWarning && (
          <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2">
            <p className="text-red-300 text-xs font-bold">⚠️ {weeklyRequired.toFixed(1)} lbs/week may tank your BJJ performance. Reassess target weight.</p>
          </div>
        )}
        {sustainable && (
          <div className="bg-green-950 border border-green-700 rounded-lg px-3 py-2">
            <p className="text-green-300 text-xs font-bold">✅ Sustainable pace. Maintaining strength while cutting.</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg px-3 py-2">
          <p className="text-commander-muted text-xs">Avg daily burn: <span className="text-white">{avgBurn} cal</span> · Stay under <span className="text-yellow-400">{caloricTarget} cal</span> to hit target</p>
          <p className="text-commander-muted text-xs mt-1">Projected IBJJF division: <span className="text-blue-400">{ibjjfClass}</span></p>
        </div>

        {weightData.length > 1 && (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
              <YAxis domain={[210, 260]} tick={{ fill: "#666", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={TARGET_WEIGHT} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Target", fill: "#22c55e", fontSize: 10 }} />
              <Line type="monotone" dataKey="weight" stroke="#ef4444" strokeWidth={2} dot={false} name="Weight (lbs)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Competition Go-Bag */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Competition Go-Bag Checklist</p>
        {["Competition Gi (Lightweight/IBJJF approved)", "Belt", "Long-Sleeve Rashguard", "Spats", "Mouthguard (SISU/Shock Doctor)", "Athletic Supporter/Cup", "Knee Pads", "Water Bottle (64oz+)", "Government ID", "Athletic Tape", "Towel"].map(item => (
          <label key={item} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input type="checkbox" className="accent-red-600 w-4 h-4" />
            <span className="text-sm text-white">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}