import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, TrendingUp, Activity, Brain, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart, Line, Bar, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart,
  LineChart
} from "recharts";

const DAYS = 30;

function getOptimalZone(correlationData) {
  if (!correlationData.length) return null;
  const goodPerf = correlationData.filter(d => d.session_rating >= 7 && d.recovery !== undefined);
  if (!goodPerf.length) return null;
  const avgRecovery = goodPerf.reduce((s, d) => s + d.recovery, 0) / goodPerf.length;
  return { min: Math.max(0, Math.round(avgRecovery - 10)), max: Math.min(100, Math.round(avgRecovery + 10)) };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-commander-dark border border-commander-border rounded-lg p-3 text-xs space-y-1">
      <p className="text-commander-muted font-bold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}</span></p>
      ))}
    </div>
  );
};

export default function TrainingCorrelationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [optimalZone, setOptimalZone] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - DAYS);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        // Fetch all data sources in parallel
        const [biometrics, shredMetrics, sessions, journals] = await Promise.all([
          base44.entities.BiometricLog.list("-date", 60),
          base44.entities.ZuluShredMetrics.list("-date", 60),
          base44.entities.TrainingSession.list("-date", 60),
          base44.entities.BJJTacticalJournal.list("-session_date", 60),
        ]);

        // Build a day-by-day map for the last DAYS days
        const dayMap = {};
        for (let i = DAYS - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          dayMap[dateStr] = {
            date: dateStr,
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            recovery: null,
            hrv: null,
            strain: null,
            resting_hr: null,
            session_rating: null,
            technique_count: null,
            session_minutes: null,
            gas_level: null,
          };
        }

        // Fill biometric data
        biometrics.forEach(b => {
          if (dayMap[b.date]) {
            dayMap[b.date].recovery = b.recovery_score ?? null;
            dayMap[b.date].hrv = b.hrv ?? null;
            dayMap[b.date].resting_hr = b.resting_heart_rate ?? null;
            dayMap[b.date].strain = b.training_load ?? null;
          }
        });

        // Fill shred metrics (recovery + strain fallback)
        shredMetrics.forEach(m => {
          if (dayMap[m.date]) {
            if (!dayMap[m.date].recovery && m.recovery_score) dayMap[m.date].recovery = m.recovery_score;
            if (!dayMap[m.date].strain && m.weekly_strain_avg) dayMap[m.date].strain = m.weekly_strain_avg;
          }
        });

        // Fill session data
        sessions.forEach(s => {
          if (dayMap[s.date]) {
            dayMap[s.date].session_minutes = (dayMap[s.date].session_minutes || 0) + (s.duration_minutes || 0);
            dayMap[s.date].gas_level = s.gas_level ?? null;
          }
        });

        // Fill BJJ journal data
        journals.forEach(j => {
          if (dayMap[j.session_date]) {
            dayMap[j.session_date].session_rating = j.overall_feeling ?? null;
            dayMap[j.session_date].technique_count = j.techniques_practiced?.length ?? null;
          }
        });

        const timeline = Object.values(dayMap);
        setTimelineData(timeline);

        // Build correlation scatter data (recovery vs session rating)
        const corr = timeline.filter(d => d.recovery !== null && d.session_rating !== null).map(d => ({
          recovery: d.recovery,
          session_rating: d.session_rating,
          date: d.label,
          technique_count: d.technique_count || 0,
        }));
        setCorrelationData(corr);
        setOptimalZone(getOptimalZone(corr));

        // Build weekly aggregates
        const weeks = {};
        timeline.forEach(d => {
          const date = new Date(d.date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const key = weekStart.toISOString().split("T")[0];
          const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!weeks[key]) weeks[key] = { label, total_minutes: 0, avg_recovery: [], avg_rating: [], sessions: 0 };
          if (d.session_minutes) {
            weeks[key].total_minutes += d.session_minutes;
            weeks[key].sessions += 1;
          }
          if (d.recovery !== null) weeks[key].avg_recovery.push(d.recovery);
          if (d.session_rating !== null) weeks[key].avg_rating.push(d.session_rating);
        });

        const weekly = Object.values(weeks).map(w => ({
          label: w.label,
          total_minutes: w.total_minutes,
          avg_recovery: w.avg_recovery.length ? Math.round(w.avg_recovery.reduce((s, v) => s + v, 0) / w.avg_recovery.length) : null,
          avg_rating: w.avg_rating.length ? Math.round(w.avg_rating.reduce((s, v) => s + v, 0) / w.avg_rating.length * 10) / 10 : null,
        }));
        setWeeklyData(weekly);

        // Generate insights
        const ins = [];
        if (corr.length >= 3) {
          const highRecoveryDays = corr.filter(d => d.recovery >= 67);
          const lowRecoveryDays = corr.filter(d => d.recovery < 34);
          if (highRecoveryDays.length) {
            const avgRating = highRecoveryDays.reduce((s, d) => s + d.session_rating, 0) / highRecoveryDays.length;
            ins.push({ icon: "🟢", text: `On high-recovery days (67%+), average session rating is ${avgRating.toFixed(1)}/10` });
          }
          if (lowRecoveryDays.length) {
            const avgRating = lowRecoveryDays.reduce((s, d) => s + d.session_rating, 0) / lowRecoveryDays.length;
            ins.push({ icon: "🔴", text: `On low-recovery days (<34%), average session rating drops to ${avgRating.toFixed(1)}/10` });
          }
          if (optimalZone) {
            ins.push({ icon: "🎯", text: `Your optimal training zone: ${optimalZone.min}–${optimalZone.max}% recovery for best performance` });
          }
        }
        if (!ins.length) {
          ins.push({ icon: "📊", text: "Log more sessions and Whoop data to unlock correlation insights" });
        }
        setInsights(ins);

      } catch (err) {
        console.error("TrainingCorrelationDashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = timelineData.some(d => d.recovery !== null || d.session_rating !== null);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Training Correlation</h1>
          <p className="text-commander-muted text-xs">Whoop × BJJ Journal × Load — last {DAYS} days</p>
        </div>
      </div>

      {/* Optimal Zone Banner */}
      {optimalZone && (
        <div className="bg-vellera-blue/10 border border-vellera-blue/40 rounded-xl p-4 flex items-center gap-3">
          <Target className="w-8 h-8 text-vellera-blue flex-shrink-0" />
          <div>
            <p className="text-vellera-blue font-black text-sm">Optimal Training Zone Detected</p>
            <p className="text-gray-300 text-xs mt-0.5">
              You perform best at <span className="text-vellera-green font-bold">{optimalZone.min}–{optimalZone.max}% recovery</span>. Schedule peak sessions when Whoop is in this range.
            </p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 gap-2">
        {insights.map((ins, idx) => (
          <div key={idx} className="bg-commander-surface border border-commander-border rounded-lg px-4 py-2 flex items-start gap-2 text-sm text-gray-300">
            <span className="text-base mt-0.5">{ins.icon}</span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>

      {!hasData && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-commander-muted mb-3 opacity-40" />
          <p className="text-white font-bold">No correlation data yet</p>
          <p className="text-commander-muted text-sm mt-1">Connect Whoop and log BJJ sessions to see insights.</p>
        </div>
      )}

      {/* Chart 1: Recovery vs Session Rating Over Time */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-vellera-blue" />
          <p className="text-white font-bold text-sm">Recovery % vs Session Rating (30 Days)</p>
        </div>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 10 }} interval={4} />
              <YAxis yAxisId="left" stroke="#00E5FF" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#CCFF00" domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {optimalZone && (
                <ReferenceLine yAxisId="left" y={optimalZone.min} stroke="#00E5FF44" strokeDasharray="4 4" />
              )}
              {optimalZone && (
                <ReferenceLine yAxisId="left" y={optimalZone.max} stroke="#00E5FF44" strokeDasharray="4 4" label={{ value: "Optimal Zone", fill: "#00E5FF", fontSize: 9 }} />
              )}
              <Line yAxisId="left" type="monotone" dataKey="recovery" stroke="#00E5FF" name="Recovery %" dot={false} strokeWidth={2} connectNulls />
              <Bar yAxisId="right" dataKey="session_rating" fill="#CCFF0044" name="Session Rating" stroke="#CCFF00" strokeWidth={1} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Scatter — Recovery vs Session Performance */}
      {correlationData.length >= 3 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-vellera-green" />
            <p className="text-white font-bold text-sm">Recovery ↔ Session Performance Correlation</p>
          </div>
          <p className="text-commander-muted text-xs">Each dot = one session. Higher right = best performance.</p>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="recovery" name="Recovery %" stroke="#666" tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: "Recovery %", fill: "#666", fontSize: 10, position: "insideBottom", offset: -2 }} />
                <YAxis dataKey="session_rating" name="Session Rating" stroke="#666" tick={{ fontSize: 10 }} domain={[1, 10]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
                {optimalZone && (
                  <ReferenceLine x={optimalZone.min} stroke="#00E5FF44" strokeDasharray="4 4" />
                )}
                {optimalZone && (
                  <ReferenceLine x={optimalZone.max} stroke="#00E5FF44" strokeDasharray="4 4" />
                )}
                <Scatter data={correlationData} fill="#CCFF00" opacity={0.8} name="Session" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 3: Weekly Load vs Recovery */}
      {weeklyData.length >= 2 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <p className="text-white font-bold text-sm">Weekly Training Load vs Avg Recovery</p>
          </div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#888" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#00E5FF" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="total_minutes" fill="#7c3aed88" name="Training Minutes" stroke="#7c3aed" strokeWidth={1} />
                <Line yAxisId="right" type="monotone" dataKey="avg_recovery" stroke="#00E5FF" name="Avg Recovery %" dot={{ fill: "#00E5FF", r: 3 }} strokeWidth={2} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 4: HRV Trend */}
      {timelineData.some(d => d.hrv !== null) && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">HRV Trend (30 Days)</p>
          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 10 }} interval={4} />
                <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="hrv" stroke="#f472b6" name="HRV (ms)" dot={false} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Intensity Zone Guide */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-white font-bold text-sm">Intensity Zone Reference</p>
        <div className="space-y-2">
          {[
            { emoji: "🟢", label: "PROGRESSIVE LOAD", range: "67–100%", desc: "Full combat session. Max effort. Progressive overload." },
            { emoji: "🟡", label: "DRILLS ONLY", range: "34–66%", desc: "Technique focus. No live rolls. Reduce load 20%." },
            { emoji: "🔴", label: "SHIELD RECOVERY", range: "0–33%", desc: "Mobility only. Cancel PM session. Protect capacity." },
          ].map((zone, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-base">{zone.emoji}</span>
              <div>
                <p className="text-white font-bold text-xs">{zone.label} <span className="text-commander-muted font-normal">({zone.range} recovery)</span></p>
                <p className="text-commander-muted text-xs">{zone.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}