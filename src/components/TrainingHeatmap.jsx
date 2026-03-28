import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getColor(duration) {
  if (!duration) return "bg-gray-800 border-gray-700";
  if (duration < 30) return "bg-red-950 border-red-900";
  if (duration < 60) return "bg-red-800 border-red-700";
  if (duration < 90) return "bg-red-600 border-red-500";
  return "bg-red-400 border-red-300";
}

function getLast90Days() {
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default function TrainingHeatmap() {
  const [sessionMap, setSessionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    // Get date 90 days ago
    const since = new Date();
    since.setDate(since.getDate() - 89);
    const sinceStr = since.toISOString().split("T")[0];

    base44.entities.TrainingSession.list("-date", 200).then(sessions => {
      const map = {};
      sessions.forEach(s => {
        if (s.date >= sinceStr && s.duration_minutes) {
          map[s.date] = (map[s.date] || 0) + Number(s.duration_minutes);
        }
      });
      setSessionMap(map);
      setLoading(false);
    });
  }, []);

  const days = getLast90Days();

  // Pad start to align with correct day-of-week
  const firstDay = new Date(days[0]).getDay(); // 0=Sun
  const padded = [...Array(firstDay).fill(null), ...days];

  // Split into weeks (columns)
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const totalSessions = Object.keys(sessionMap).length;
  const totalMinutes = Object.values(sessionMap).reduce((s, v) => s + v, 0);
  const streak = (() => {
    let count = 0;
    const today = new Date().toISOString().split("T")[0];
    const sorted = [...days].reverse();
    for (const d of sorted) {
      if (sessionMap[d]) count++;
      else break;
    }
    return count;
  })();

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest">Training Consistency — Last 90 Days</p>
        <div className="flex items-center gap-1 text-xs text-commander-muted">
          <span>Less</span>
          {["bg-gray-800", "bg-red-950", "bg-red-800", "bg-red-600", "bg-red-400"].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse bg-gray-800 rounded-lg" />
      ) : (
        <div className="relative">
          {/* Day labels */}
          <div className="flex gap-1 mb-1">
            <div className="w-3" /> {/* spacer */}
            {DAYS.map((d, i) => (
              <div key={i} className="w-3 text-center text-commander-muted" style={{ fontSize: 9 }}>{d}</div>
            ))}
          </div>

          {/* Grid: weeks as rows, days as columns */}
          <div className="overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
              {weeks.map((week, wi) => {
                // Get month label for first non-null day in week
                const firstDate = week.find(d => d);
                const showMonth = firstDate && (wi === 0 || new Date(firstDate).getDate() <= 7);
                const monthLabel = firstDate ? new Date(firstDate).toLocaleDateString("en-US", { month: "short" }) : "";

                return (
                  <div key={wi} className="flex flex-col gap-1">
                    <div className="text-center h-3" style={{ fontSize: 8, color: "#6b7280" }}>
                      {showMonth ? monthLabel : ""}
                    </div>
                    {week.map((date, di) => {
                      const duration = date ? sessionMap[date] : null;
                      return (
                        <div
                          key={di}
                          className={`w-3 h-3 rounded-sm border transition-all cursor-pointer hover:opacity-80 ${date ? getColor(duration) : "opacity-0"}`}
                          onMouseEnter={() => date && setTooltip({ date, duration })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-xs text-white z-10 pointer-events-none whitespace-nowrap shadow-xl">
              <span className="font-bold">{tooltip.date}</span>
              {tooltip.duration
                ? <> — <span className="text-red-400">{tooltip.duration} min</span></>
                : <span className="text-commander-muted"> — No session</span>}
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-commander-border">
        <div className="text-center">
          <p className="text-white font-bold text-lg">{totalSessions}</p>
          <p className="text-commander-muted text-xs">Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-bold text-lg">{Math.round(totalMinutes / 60)}h</p>
          <p className="text-commander-muted text-xs">Mat Time</p>
        </div>
        <div className="text-center">
          <p className="text-orange-400 font-bold text-lg">{streak}</p>
          <p className="text-commander-muted text-xs">Day Streak</p>
        </div>
        <div className="text-center">
          <p className="text-green-400 font-bold text-lg">{Math.round((totalSessions / 90) * 100)}%</p>
          <p className="text-commander-muted text-xs">Consistency</p>
        </div>
      </div>
    </div>
  );
}