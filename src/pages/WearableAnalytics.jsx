import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend, ReferenceLine
} from "recharts";
import { Activity, RefreshCw, Loader2, Heart, Moon, Zap, ArrowLeft, AlertCircle } from "lucide-react";

const RANGES = [
  { label: "7D",  days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const SOURCE_COLORS = { whoop: "#CCFF00", strava: "#FC4C02", fitbit: "#00B0B9", mixed: "#00E5FF" };

function KpiCard({ label, value, unit, icon: Icon, color, sub }) {
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-black ${color}`}>
        {value ?? <span className="text-gray-600 text-base">—</span>}
        {value != null && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-bold">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value != null ? Math.round(p.value * 10) / 10 : "—"}</span>
        </div>
      ))}
    </div>
  );
};

export default function WearableAnalytics() {
  const [range, setRange] = useState(30);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState([]);

  useEffect(() => { fetchData(); }, [range]);

  const fetchData = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - range * 86400000).toISOString().slice(0, 10);
    const [bio, wearables, whoopTokens] = await Promise.all([
      base44.entities.BiometricLog.list("-date", range + 5),
      base44.entities.WearableToken.list().catch(() => []),
      base44.entities.WhoopToken.list().catch(() => []),
    ]);
    const filtered = bio.filter(b => b.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    setLogs(filtered);
    const providers = [];
    if (whoopTokens.length) providers.push("whoop");
    wearables.forEach(w => { if (!providers.includes(w.provider)) providers.push(w.provider); });
    setConnectedProviders(providers);
    setLoading(false);
  };

  const syncAll = async () => {
    setSyncing(true);
    const fns = [];
    if (connectedProviders.includes("whoop"))  fns.push(base44.functions.invoke("whoopSync", {}).catch(() => {}));
    if (connectedProviders.includes("strava")) fns.push(base44.functions.invoke("stravaSync", {}).catch(() => {}));
    if (connectedProviders.includes("fitbit")) fns.push(base44.functions.invoke("fitbitSync", {}).catch(() => {}));
    await Promise.all(fns);
    await fetchData();
    setSyncing(false);
  };

  // ── Build chart data ────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // Fill all days in range
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push(d);
    }
    const byDate = {};
    logs.forEach(l => { byDate[l.date] = l; });

    return days.map(d => {
      const l = byDate[d] || {};
      return {
        date: d.slice(5), // MM-DD
        fullDate: d,
        recovery: l.recovery_pct ?? null,
        strain: l.strain ?? null,
        hrv: l.hrv ?? null,
        rhr: l.rhr ?? l.resting_hr ?? null,
        sleep: l.sleep_performance ?? null,
        calories: l.active_calories ?? null,
        steps: l.steps ?? null,
        source: l.source ?? null,
      };
    });
  }, [logs, range]);

  // ── KPIs (last 7 days avg) ──────────────────────────────────────────────────
  const recent = chartData.slice(-7).filter(d => d.recovery != null || d.strain != null);
  const avg = (key) => {
    const vals = recent.map(d => d[key]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const avgRecovery = avg("recovery");
  const avgStrain   = avg("strain");
  const avgHrv      = avg("hrv");
  const avgSleep    = avg("sleep");

  // Insight: over-training flag
  const overtraining = chartData.slice(-7).filter(d => d.recovery != null && d.strain != null && d.strain > 15 && d.recovery < 50).length >= 3;
  const undertraining = chartData.slice(-7).filter(d => d.recovery != null && d.recovery > 80 && (d.strain ?? 0) < 8).length >= 3;

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/wearables" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-vellera-blue" />
                Wearable Analytics
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {connectedProviders.map(p => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded-full font-bold border"
                    style={{ color: SOURCE_COLORS[p] || "#aaa", borderColor: SOURCE_COLORS[p] || "#555", background: `${SOURCE_COLORS[p] || "#aaa"}15` }}>
                    {p}
                  </span>
                ))}
                {connectedProviders.length === 0 && (
                  <Link to="/wearables" className="text-xs text-vellera-blue hover:underline">Connect a device →</Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Range selector */}
            <div className="flex gap-1 bg-commander-surface border border-commander-border rounded-xl p-1">
              {RANGES.map(r => (
                <button key={r.days} onClick={() => setRange(r.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${range === r.days ? "bg-vellera-blue text-black" : "text-gray-400 hover:text-white"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={syncAll} disabled={syncing || connectedProviders.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-commander-surface border border-commander-border text-white text-xs font-bold rounded-xl hover:border-vellera-blue transition disabled:opacity-40">
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Sync
            </button>
          </div>
        </div>

        {/* Insight Banner */}
        {overtraining && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm font-bold">⚠️ High strain + low recovery detected over 3+ days — consider a deload or recovery session.</p>
          </div>
        )}
        {undertraining && !overtraining && (
          <div className="bg-vellera-green/10 border border-vellera-green/20 rounded-xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-vellera-green shrink-0" />
            <p className="text-vellera-green text-sm font-bold">✅ Great recovery with low strain — you're fresh. Good time to push hard.</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Avg Recovery" value={avgRecovery} unit="%" icon={Heart}     color={avgRecovery >= 67 ? "text-vellera-green" : avgRecovery >= 34 ? "text-yellow-400" : "text-red-400"} sub="7-day avg (Whoop)" />
          <KpiCard label="Avg Strain"   value={avgStrain}   unit=""  icon={Zap}       color="text-orange-400" sub="7-day avg (Whoop)" />
          <KpiCard label="Avg HRV"      value={avgHrv}      unit="ms" icon={Activity} color="text-vellera-blue" sub="7-day avg" />
          <KpiCard label="Sleep Score"  value={avgSleep}    unit="%" icon={Moon}      color={avgSleep >= 85 ? "text-vellera-green" : "text-yellow-400"} sub="7-day avg" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── MAIN CHART: Recovery vs Strain ─────────────────────────── */}
            <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
              <h2 className="text-white font-black mb-1">Recovery vs Training Load</h2>
              <p className="text-xs text-gray-500 mb-4">Recovery % (Whoop) · Strain Score (bars) — ideal: high recovery before high strain</p>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                  <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} interval={Math.floor(range / 7)} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: "#555", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 21]} tick={{ fill: "#555", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
                  <ReferenceLine yAxisId="left" y={67} stroke="#CCFF00" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <ReferenceLine yAxisId="left" y={33} stroke="#f87171" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <Area yAxisId="left" type="monotone" dataKey="recovery" name="Recovery %" stroke="#CCFF00" fill="#CCFF0022" strokeWidth={2} dot={false} connectNulls />
                  <Bar yAxisId="right" dataKey="strain" name="Strain" fill="#FC4C02" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><span className="w-3 h-px bg-vellera-green inline-block" style={{borderTop:"2px dashed #CCFF00",width:16}} /> 67% recovery threshold</span>
                <span className="flex items-center gap-1"><span className="w-3 h-px inline-block" style={{borderTop:"2px dashed #f87171",width:16}} /> 33% low recovery</span>
              </div>
            </div>

            {/* ── SECONDARY CHARTS ─────────────────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* HRV Trend */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
                <h2 className="text-white font-black text-sm mb-1">HRV Trend</h2>
                <p className="text-xs text-gray-500 mb-3">Heart Rate Variability (ms) — higher = better recovery</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval={Math.floor(range / 6)} />
                    <YAxis tick={{ fill: "#555", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#00E5FF" fill="#00E5FF22" strokeWidth={2} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep Performance */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
                <h2 className="text-white font-black text-sm mb-1">Sleep Performance</h2>
                <p className="text-xs text-gray-500 mb-3">Sleep quality score (%) — from Whoop or Fitbit</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval={Math.floor(range / 6)} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={85} stroke="#CCFF00" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <Area type="monotone" dataKey="sleep" name="Sleep %" stroke="#a78bfa" fill="#a78bfa22" strokeWidth={2} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Resting HR */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
                <h2 className="text-white font-black text-sm mb-1">Resting Heart Rate</h2>
                <p className="text-xs text-gray-500 mb-3">BPM — lower trend = improving fitness / recovery</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval={Math.floor(range / 6)} />
                    <YAxis tick={{ fill: "#555", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="rhr" name="Resting HR (bpm)" stroke="#f87171" fill="#f8717122" strokeWidth={2} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Active Calories / Steps */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
                <h2 className="text-white font-black text-sm mb-1">Active Calories</h2>
                <p className="text-xs text-gray-500 mb-3">From Strava activities or Fitbit daily summary</p>
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval={Math.floor(range / 6)} />
                    <YAxis tick={{ fill: "#555", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="calories" name="Calories" fill="#FC4C0288" radius={[2, 2, 0, 0]} />
                    <Line type="monotone" dataKey="calories" name="Trend" stroke="#FC4C02" strokeWidth={1.5} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-commander-border">
                <h2 className="text-white font-black text-sm">Raw Data — Last {Math.min(logs.length, 14)} Entries</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-commander-border">
                      {["Date","Source","Recovery","Strain","HRV","RHR","Sleep","Calories"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wider font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...logs].reverse().slice(0, 14).map(l => (
                      <tr key={l.id} className="border-b border-commander-border/50 hover:bg-gray-800/40 transition">
                        <td className="px-4 py-2 text-gray-300 font-bold">{l.date}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ color: SOURCE_COLORS[l.source] || "#888", background: `${SOURCE_COLORS[l.source] || "#888"}20` }}>
                            {l.source || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold" style={{ color: l.recovery_pct >= 67 ? "#CCFF00" : l.recovery_pct >= 34 ? "#facc15" : l.recovery_pct != null ? "#f87171" : "#555" }}>
                          {l.recovery_pct != null ? `${l.recovery_pct}%` : "—"}
                        </td>
                        <td className="px-4 py-2 text-orange-400">{l.strain != null ? Math.round(l.strain * 10) / 10 : "—"}</td>
                        <td className="px-4 py-2 text-vellera-blue">{l.hrv != null ? `${l.hrv}ms` : "—"}</td>
                        <td className="px-4 py-2 text-red-400">{(l.rhr || l.resting_hr) != null ? `${l.rhr || l.resting_hr}bpm` : "—"}</td>
                        <td className="px-4 py-2 text-purple-400">{l.sleep_performance != null ? `${l.sleep_performance}%` : "—"}</td>
                        <td className="px-4 py-2 text-gray-400">{l.active_calories != null ? `${l.active_calories}kcal` : "—"}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-600">
                          No data yet. Connect a wearable and sync to see your analytics.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}