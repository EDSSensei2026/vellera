import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ShieldCheck, Activity, TrendingUp } from "lucide-react";

const MOBILITY_PROTOCOL = "🧘 Run tonight's Heavyweight Restoration Protocol (20 min)";
const REST_PROTOCOL = "🛑 Mandatory Rest Day — no mat work, no lifting";
const ZONE2_PROTOCOL = "🚶 Zone 2 only (30 min walk/bike at 130–145 bpm)";

const AREA_RISK = {
  "Lower Back": { threshold: 2, protocol: REST_PROTOCOL, color: "text-red-400", bg: "bg-red-950/30 border-red-800" },
  "Knees": { threshold: 2, protocol: REST_PROTOCOL, color: "text-red-400", bg: "bg-red-950/30 border-red-800" },
  "Neck/Spine": { threshold: 1, protocol: REST_PROTOCOL, color: "text-red-400", bg: "bg-red-950/30 border-red-800" },
  "Hips": { threshold: 3, protocol: MOBILITY_PROTOCOL, color: "text-orange-400", bg: "bg-orange-950/30 border-orange-800" },
  "Shoulders": { threshold: 3, protocol: MOBILITY_PROTOCOL, color: "text-orange-400", bg: "bg-orange-950/30 border-orange-800" },
  "Fingers/Grips": { threshold: 3, protocol: ZONE2_PROTOCOL, color: "text-yellow-400", bg: "bg-yellow-950/30 border-yellow-800" },
  "Ankles/Feet": { threshold: 3, protocol: MOBILITY_PROTOCOL, color: "text-orange-400", bg: "bg-orange-950/30 border-orange-800" },
  "Ribs": { threshold: 2, protocol: REST_PROTOCOL, color: "text-red-400", bg: "bg-red-950/30 border-red-800" },
};

export default function InjuryPatternAnalytics() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TrainingSession.list("-date", 30).then(s => {
      setSessions(s);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const last14 = sessions.filter(s => {
    const d = new Date(s.date);
    return (Date.now() - d) / 86400000 <= 14;
  });

  // Aggregate injury counts per area (last 14 days)
  const injuryCounts = {};
  last14.forEach(s => {
    (s.injury_notes || []).forEach(area => {
      injuryCounts[area] = (injuryCounts[area] || 0) + 1;
    });
  });

  // Aggregate injury counts per session type (last 30 days)
  const typeInjuries = {};
  sessions.forEach(s => {
    if ((s.injury_notes || []).length > 0) {
      typeInjuries[s.session_type] = (typeInjuries[s.session_type] || 0) + s.injury_notes.length;
    }
  });

  const typeSessions = {};
  sessions.forEach(s => {
    typeSessions[s.session_type] = (typeSessions[s.session_type] || 0) + 1;
  });

  // Active alerts where count >= threshold
  const activeAlerts = Object.entries(injuryCounts)
    .map(([area, count]) => ({ area, count, ...(AREA_RISK[area] || {}) }))
    .filter(a => a.threshold && a.count >= a.threshold)
    .sort((a, b) => b.count - a.count);

  // Session types ranked by injury rate
  const typeRates = Object.entries(typeInjuries)
    .map(([type, injuries]) => ({
      type,
      injuries,
      sessions: typeSessions[type] || 1,
      rate: ((injuries / (typeSessions[type] || 1)) * 100).toFixed(0),
    }))
    .sort((a, b) => b.rate - a.rate);

  const totalInjuryFlags = Object.values(injuryCounts).reduce((a, b) => a + b, 0);

  // Track view
  useEffect(() => {
    if (!loading) {
      base44.analytics.track({
        eventName: "injury_analytics_viewed",
        properties: {
          active_alerts: activeAlerts.length,
          total_injury_flags_14d: totalInjuryFlags,
        },
      });
    }
  }, [loading]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-commander-red" />
        <p className="text-white font-bold text-sm uppercase tracking-wider">43yo Injury Pattern Analysis</p>
        <span className="text-xs text-commander-muted ml-auto">Last 14 days</span>
      </div>

      {/* No issues */}
      {activeAlerts.length === 0 && totalInjuryFlags === 0 && (
        <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-bold text-sm">Body feels good — no recurring flags</p>
            <p className="text-green-700 text-xs mt-0.5">Keep logging sessions to build your injury pattern baseline.</p>
          </div>
        </div>
      )}

      {/* Active alerts with recommendations */}
      {activeAlerts.map(({ area, count, color, bg, protocol }) => (
        <div key={area} className={`border rounded-xl p-4 ${bg}`}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${color} flex-shrink-0`} />
              <p className={`font-bold text-sm ${color}`}>{area} — {count}x in 14 days</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/30 ${color}`}>
              {count >= (AREA_RISK[area]?.threshold * 2) ? "HIGH" : "MODERATE"}
            </span>
          </div>
          <p className="text-white text-xs mt-2 font-medium">Recommendation: {protocol}</p>
        </div>
      ))}

      {/* Low-level flags (below threshold) */}
      {Object.entries(injuryCounts).filter(([area, count]) => !AREA_RISK[area] || count < AREA_RISK[area].threshold).length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3">
          <p className="text-xs text-commander-muted mb-2 uppercase tracking-wider">Monitoring (below threshold)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(injuryCounts)
              .filter(([area, count]) => !AREA_RISK[area] || count < AREA_RISK[area].threshold)
              .map(([area, count]) => (
                <span key={area} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  {area} ×{count}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Session type injury rates */}
      {typeRates.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-commander-muted uppercase tracking-wider">Injury Rate by Session Type (30 days)</p>
          </div>
          <div className="space-y-2">
            {typeRates.map(({ type, injuries, sessions: sc, rate }) => (
              <div key={type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white">{type}</span>
                  <span className={`font-bold ${Number(rate) >= 50 ? "text-red-400" : Number(rate) >= 25 ? "text-yellow-400" : "text-green-400"}`}>
                    {rate}% ({injuries} flags / {sc} sessions)
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${Number(rate) >= 50 ? "bg-red-500" : Number(rate) >= 25 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(100, Number(rate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}