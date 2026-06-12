import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";
import { Dumbbell, Clock, Target, TrendingUp, Award, Zap } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color = "text-[#00E5FF]" }) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className={`font-black text-xl leading-none ${color}`}>{value}</p>
        <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
        {sub && <p className="text-gray-500 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}{p.unit || ""}
        </p>
      ))}
    </div>
  );
};

export default function WorkoutHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30); // days

  useEffect(() => {
    base44.entities.Session_History.list("-date_completed", 100)
      .then(s => { setSessions(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Filter to selected range
  const cutoff = new Date(Date.now() - range * 86400000);
  const filtered = sessions.filter(s => s.date_completed && new Date(s.date_completed) >= cutoff);

  // Aggregate stats
  const totalWorkouts = filtered.length;
  const totalRounds = filtered.reduce((a, s) => a + (s.completed_rounds || 1), 0);
  const totalMinutes = Math.round(filtered.reduce((a, s) => a + (s.total_time_spent || 0), 0) / 60);
  const avgRounds = totalWorkouts ? (totalRounds / totalWorkouts).toFixed(1) : 0;
  const avgDuration = totalWorkouts ? Math.round(filtered.reduce((a, s) => a + (s.total_time_spent || 0), 0) / totalWorkouts / 60) : 0;

  // Weekly aggregation for trend charts
  const weeklyMap = {};
  filtered.forEach(s => {
    const d = new Date(s.date_completed);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!weeklyMap[key]) weeklyMap[key] = { week: key.slice(5), workouts: 0, rounds: 0, minutes: 0 };
    weeklyMap[key].workouts += 1;
    weeklyMap[key].rounds += s.completed_rounds || 1;
    weeklyMap[key].minutes += Math.round((s.total_time_spent || 0) / 60);
  });
  const weeklyData = Object.values(weeklyMap).sort((a, b) => a.week.localeCompare(b.week));

  // Daily rounds trend (last N sessions)
  const dailyTrend = [...filtered]
    .sort((a, b) => new Date(a.date_completed) - new Date(b.date_completed))
    .slice(-20)
    .map((s, i) => ({
      session: `S${i + 1}`,
      rounds: s.completed_rounds || 1,
      duration: Math.round((s.total_time_spent || 0) / 60),
    }));

  // Rolling avg for rounds
  const withRolling = dailyTrend.map((d, i) => {
    const window = dailyTrend.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((a, x) => a + x.rounds, 0) / window.length;
    return { ...d, rollingAvg: parseFloat(avg.toFixed(1)) };
  });

  // Best streak calculation
  const sortedDates = [...filtered]
    .map(s => new Date(s.date_completed).toISOString().split("T")[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  let maxStreak = 0, streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
    if (diff <= 2) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 1;
  }

  const RANGE_OPTIONS = [7, 30, 90];

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen bg-[#121212]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">Workout History</h1>
          <p className="text-gray-500 text-xs">Performance trends & analytics</p>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGE_OPTIONS.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all border min-h-[40px]"
            style={range === r
              ? { backgroundColor: "#00E5FF20", borderColor: "#00E5FF", color: "#00E5FF" }
              : { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a", color: "#888" }
            }
          >
            {r}d
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-[#00E5FF] rounded-full animate-spin" />
        </div>
      ) : totalWorkouts === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-10 text-center">
          <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-semibold">No workout sessions logged yet.</p>
          <p className="text-gray-600 text-xs mt-1">Complete a workout to see your analytics here.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Dumbbell} label="Total Workouts" value={totalWorkouts} sub={`Last ${range} days`} color="text-[#00E5FF]" />
            <StatCard icon={Target} label="Total Rounds" value={totalRounds} sub={`Avg ${avgRounds}/session`} color="text-[#CCFF00]" />
            <StatCard icon={Clock} label="Avg Duration" value={`${avgDuration}m`} sub={`${totalMinutes} mins total`} color="text-orange-400" />
            <StatCard icon={Award} label="Best Streak" value={`${maxStreak}d`} sub="Consecutive days" color="text-purple-400" />
          </div>

          {/* Rounds Per Session — trend line */}
          {withRolling.length > 1 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
                <p className="text-white text-sm font-bold">Rounds Per Session</p>
                <span className="text-gray-600 text-xs ml-auto">last {withRolling.length} sessions</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={withRolling}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="session" tick={{ fill: "#555", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rounds" stroke="#00E5FF" strokeWidth={2} dot={{ r: 3, fill: "#00E5FF" }} name="Rounds" />
                  <Line type="monotone" dataKey="rollingAvg" stroke="#CCFF00" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="3-Session Avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-end">
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#00E5FF]" /><span className="text-xs text-gray-500">Rounds</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#CCFF00]" style={{ borderTop: "2px dashed #CCFF00" }} /><span className="text-xs text-gray-500">Rolling Avg</span></div>
              </div>
            </div>
          )}

          {/* Session Duration Trend */}
          {dailyTrend.length > 1 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-400" />
                <p className="text-white text-sm font-bold">Session Duration (min)</p>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={dailyTrend} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="session" tick={{ fill: "#555", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="duration" fill="#f97316" radius={[4, 4, 0, 0]} name="Duration" unit="m" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Volume */}
          {weeklyData.length > 1 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#CCFF00]" />
                <p className="text-white text-sm font-bold">Weekly Rounds Volume</p>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="week" tick={{ fill: "#555", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={parseFloat(avgRounds)} stroke="#00E5FF" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "avg", fill: "#00E5FF", fontSize: 9 }} />
                  <Bar dataKey="rounds" fill="#CCFF00" radius={[4, 4, 0, 0]} name="Rounds" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent sessions list */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent Sessions</p>
            <div className="space-y-2">
              {filtered.slice(0, 8).map((s, i) => (
                <div key={s.id || i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-semibold">{s.notes || "Workout Session"}</p>
                    <p className="text-gray-600 text-xs">{s.date_completed ? new Date(s.date_completed).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</p>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div>
                      <p className="text-[#00E5FF] font-bold text-sm">{s.completed_rounds || 1}</p>
                      <p className="text-gray-600 text-xs">rounds</p>
                    </div>
                    <div>
                      <p className="text-orange-400 font-bold text-sm">{Math.round((s.total_time_spent || 0) / 60)}m</p>
                      <p className="text-gray-600 text-xs">time</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}