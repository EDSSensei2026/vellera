import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const RESTORATION_PROTOCOLS = [
  { name: "Open the Book", sets: "10 reps/side", desc: "Lie on your side, knees tucked. Reach top arm over to other side. Opens chest for better breathing." },
  { name: "90/90 Hip Switch", sets: "2 minutes continuous", desc: "Both legs at 90°. Rotate knees side to side without lifting your butt. Essential for guard play." },
  { name: "Cat-Cow into Child's Pose", sets: "3 minutes rhythmic", desc: "Flow from Cat-Cow into wide-knee Child's Pose. Decompresses spine after wrestling." },
  { name: "Thoracic Bridge", sets: "5 reps", desc: "From seated, drive hips up and reach one arm back. Opens anterior chain." },
  { name: "Hip Flexor Lunge Stretch", sets: "60s each side", desc: "Long split stance, back knee down. Essential at 250lb for protecting lower back." },
];

export default function Recovery() {
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.BiometricLog.list("-date", 14),
      base44.entities.TrainingSession.list("-date", 14),
    ]).then(([bl, sl]) => {
      setLogs(bl);
      setSessions(sl);
      setLoading(false);
    });
  }, []);

  const chartData = logs.slice().reverse().map(l => ({
    date: l.date?.slice(5),
    recovery: l.recovery_pct,
    hrv: l.hrv,
    bodyBattery: l.body_battery,
    sleep: l.sleep_performance,
  }));

  // Recent gas levels
  const gasData = sessions.slice().reverse().map(s => ({
    date: s.date?.slice(5),
    gas: s.gas_level,
    type: s.session_type,
  }));

  // Check if any recent injury flags warrant restoration
  const recentInjuries = sessions.flatMap(s => s.injury_notes || []);
  const needsRestoration = recentInjuries.some(i => ["Lower Back", "Knees", "Hips"].includes(i));

  // Slow-growth algo: weekly strain check
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return (now - d) / 86400000 <= 7;
  });
  const avgGas = weekSessions.length ? weekSessions.reduce((a, s) => a + (s.gas_level || 0), 0) / weekSessions.length : 0;
  const slowGrowthFlag = avgGas > 8.5;

  // Sleep flag
  const latestLog = logs[0];
  const lowSleep = latestLog && latestLog.sleep_performance < 70;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-white text-xl font-black tracking-tight">Recovery Hub</h1>

      {/* Alerts */}
      {slowGrowthFlag && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4">
          <p className="text-red-300 font-bold text-sm">⚠️ Slow-Growth Algorithm Triggered</p>
          <p className="text-red-400 text-xs mt-1">Average gas level {">"} 8.5 this week. 43yo Rule: High-intensity sparring locked for 48 hours. Technique only.</p>
        </div>
      )}
      {lowSleep && (
        <div className="bg-purple-950 border border-purple-700 rounded-xl p-4">
          <p className="text-purple-300 font-bold text-sm">💤 Sleep Performance {"<"} 70%</p>
          <p className="text-purple-400 text-xs mt-1">CNS recovery priority. Consider a 2:00 PM nap instead of Work Gym lifting today.</p>
        </div>
      )}
      {needsRestoration && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-4">
          <p className="text-yellow-300 font-bold text-sm">🦵 Restoration Protocol Recommended</p>
          <p className="text-yellow-400 text-xs mt-1">Recent lower body or back flags detected. Run the Heavyweight Restoration below tonight.</p>
        </div>
      )}

      {/* Recovery Chart */}
      {chartData.length > 1 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Recovery % — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="recovery" stroke="#ef4444" strokeWidth={2} dot={false} name="Recovery %" />
              <Line type="monotone" dataKey="sleep" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Sleep %" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gas vs Recovery */}
      {gasData.length > 1 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Gas Level vs Mat Sessions</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={gasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#666", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="gas" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gas Level" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heavyweight Restoration Protocol */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Heavyweight Restoration Protocol</p>
        <p className="text-commander-muted text-xs mb-4">Monday & Friday · 20 minutes · No equipment · 250lb spine & joint care</p>
        <div className="space-y-3">
          {RESTORATION_PROTOCOLS.map((p, i) => (
            <div key={p.name} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-commander-red flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{p.name} <span className="text-commander-red text-xs">· {p.sets}</span></p>
                <p className="text-commander-muted text-xs mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-black text-2xl">{weekSessions.length}</p>
          <p className="text-commander-muted text-xs">Sessions this week</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className={`font-black text-2xl ${avgGas > 8 ? "text-red-400" : avgGas > 6 ? "text-yellow-400" : "text-green-400"}`}>{avgGas.toFixed(1)}</p>
          <p className="text-commander-muted text-xs">Avg gas level</p>
        </div>
      </div>
    </div>
  );
}