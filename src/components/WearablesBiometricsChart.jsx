import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Heart, Zap, Loader2 } from "lucide-react";

const METRICS = [
  { key: "hrv", label: "HRV", unit: "ms", color: "#00E5FF" },
  { key: "resting_heart_rate", label: "Resting HR", unit: "bpm", color: "#CCFF00" },
  { key: "training_strain", label: "Strain", unit: "", color: "#a855f7" },
];

const ICONS = { hrv: Activity, resting_heart_rate: Heart, training_strain: Zap };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value ?? "—"}{METRICS.find(m => m.key === p.dataKey)?.unit}
        </p>
      ))}
    </div>
  );
};

export default function WearablesBiometricsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(["hrv", "resting_heart_rate", "training_strain"]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const logs = await base44.entities.BiometricLog.list("-log_date", 30);
      // Group by date, take last 14 days, sort ascending
      const byDate = {};
      logs.forEach(log => {
        const d = log.log_date?.slice(0, 10) || log.created_date?.slice(0, 10);
        if (!d) return;
        if (!byDate[d]) byDate[d] = { date: d, hrv: null, resting_heart_rate: null, training_strain: null };
        if (log.hrv != null) byDate[d].hrv = log.hrv;
        if (log.resting_heart_rate != null) byDate[d].resting_heart_rate = log.resting_heart_rate;
        if (log.training_strain != null) byDate[d].training_strain = log.training_strain;
      });

      const sorted = Object.values(byDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
        .map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }));

      setData(sorted);
      setLoading(false);
    };
    load();
  }, []);

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="bg-commander-surface border border-commander-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-black text-base">Biometrics Trends</p>
          <p className="text-commander-muted text-xs">Last 14 days</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {METRICS.map(({ key, label, color }) => {
            const Icon = ICONS[key];
            return (
              <button
                key={key}
                onClick={() => toggleMetric(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  activeMetrics.includes(key)
                    ? "border-transparent text-black"
                    : "border-gray-700 text-gray-500 bg-transparent"
                }`}
                style={activeMetrics.includes(key) ? { backgroundColor: color } : {}}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-vellera-blue animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-commander-muted">
          <Activity className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No biometric data yet.</p>
          <p className="text-xs mt-1">Sync a wearable below to populate trends.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {METRICS.map(m => (
                <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {METRICS.filter(m => activeMetrics.includes(m.key)).map(m => (
              <Area
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                fill={`url(#grad-${m.key})`}
                dot={{ fill: m.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}