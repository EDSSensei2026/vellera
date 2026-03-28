import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-bold mb-1">{d?.dayLabel}</p>
      {d?.recovery !== null && <p className="text-green-400">Recovery: {d.recovery}%</p>}
      {d?.hrv !== null && <p className="text-blue-400">HRV: {d.hrv} ms</p>}
      {d?.intensity !== null && <p className="text-yellow-400">Intensity: {d.intensity}/10</p>}
      {d?.gasLevel !== null && <p className="text-red-400">Gas Used: {d.gasLevel}/10</p>}
      {d?.alert && <p className="text-orange-300 mt-1 font-bold">⚠️ {d.alert}</p>}
    </div>
  );
};

export default function RecoveryPerformanceWidget() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const days = getLast7Days();
    const since = days[0];

    Promise.all([
      base44.entities.BiometricLog.list("-date", 14),
      base44.entities.TrainingSession.list("-date", 14),
    ]).then(([bios, sessions]) => {
      const bioMap = {};
      bios.forEach(b => { if (b.date >= since) bioMap[b.date] = b; });

      const sessionMap = {};
      sessions.forEach(s => {
        if (s.date >= since) {
          if (!sessionMap[s.date]) sessionMap[s.date] = { intensity: 0, gasLevel: 0, count: 0 };
          sessionMap[s.date].intensity = Math.max(sessionMap[s.date].intensity, s.intensity || 0);
          sessionMap[s.date].gasLevel = Math.max(sessionMap[s.date].gasLevel, s.gas_level || 0);
          sessionMap[s.date].count++;
        }
      });

      const flagged = [];
      const chartData = days.map(date => {
        const bio = bioMap[date];
        const sess = sessionMap[date];
        const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const shortDay = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });

        const recovery = bio?.recovery_pct ?? null;
        const hrv = bio?.hrv ?? null;
        const intensity = sess?.intensity || null;
        const gasLevel = sess?.gasLevel || null;

        // Detect correlation: low recovery + high gas usage
        let alert = null;
        let alertType = null;
        if (recovery !== null && recovery < 50 && gasLevel !== null && gasLevel >= 7) {
          alert = "Low recovery + high gas output — risk of overtraining";
          alertType = "danger";
          flagged.push({ date: dayLabel, msg: alert });
        } else if (recovery !== null && recovery < 60 && intensity !== null && intensity >= 8) {
          alert = "Below-average recovery with high intensity session";
          alertType = "warning";
          flagged.push({ date: dayLabel, msg: alert });
        } else if (recovery !== null && recovery >= 80 && gasLevel !== null && gasLevel <= 4) {
          alertType = "good";
        }

        return { date, dayLabel, shortDay, recovery, hrv, intensity, gasLevel, alert, alertType };
      });

      setData(chartData);
      setAlerts(flagged);
      setLoading(false);
    });
  }, []);

  const hasData = data.some(d => d.recovery !== null || d.intensity !== null);

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-commander-muted uppercase tracking-widest">Recovery vs Performance — 7 Days</p>
        {alerts.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-orange-400 font-bold">
            <AlertTriangle className="w-3 h-3" /> {alerts.length} alert{alerts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-gray-800 rounded-lg" />
      ) : !hasData ? (
        <div className="h-32 flex items-center justify-center text-commander-muted text-sm">
          Log biometrics and sessions to see correlation data.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="shortDay" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={5} stroke="#374151" strokeDasharray="3 3" />

              {/* Gas Level as bars — colored red if high */}
              <Bar dataKey="gasLevel" name="Gas Used" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.alertType === "danger" ? "#7f1d1d" :
                      entry.alertType === "warning" ? "#78350f" :
                      entry.gasLevel >= 7 ? "#dc2626" :
                      entry.gasLevel >= 5 ? "#ca8a04" :
                      "#16a34a"
                    }
                    opacity={entry.gasLevel ? 0.9 : 0.15}
                  />
                ))}
              </Bar>

              {/* Intensity as smaller bars */}
              <Bar dataKey="intensity" name="Intensity" radius={[2, 2, 0, 0]} maxBarSize={10} fill="#f59e0b" opacity={0.5} />

              {/* Recovery % scaled to 0-10 */}
              <Line
                dataKey={d => d.recovery !== null ? d.recovery / 10 : null}
                name="Recovery"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 3 }}
                connectNulls={false}
                type="monotone"
              />

              {/* HRV scaled to 0-10 range (assume max ~100ms) */}
              <Line
                dataKey={d => d.hrv !== null ? Math.min(10, d.hrv / 10) : null}
                name="HRV"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ fill: "#3b82f6", r: 2 }}
                connectNulls={false}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { color: "bg-red-600", label: "Gas Used (bars)" },
              { color: "bg-yellow-500", label: "Intensity" },
              { color: "bg-green-500", label: "Recovery %" },
              { color: "bg-blue-500", label: "HRV" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-commander-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-commander-border">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 bg-orange-950/30 border border-orange-900 rounded-lg px-3 py-2">
                  <TrendingDown className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-300 text-xs font-bold">{a.date}</p>
                    <p className="text-orange-200 text-xs">{a.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && hasData && (
            <div className="flex items-center gap-2 bg-green-950/30 border border-green-900 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-xs">No recovery-performance conflicts detected this week. 🥋</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}