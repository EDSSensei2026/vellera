import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { TrendingUp, Dumbbell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StrengthMetrics() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TrainingSession.list("-date", 30).then(s => {
      setSessions(s.filter(x => x.lifting_exercises));
      setLoading(false);
    });
  }, []);

  // Extract 1RM estimate from lifting_exercises (e.g., "Squat: 5x3 @ 405lbs")
  const parseLifting = (exercises) => {
    if (!exercises) return {};
    const lines = exercises.split('\n');
    const parsed = {};
    lines.forEach(line => {
      const match = line.match(/(\w+).*?(\d{2,3})lbs/);
      if (match) {
        const [, lift, weight] = match;
        if (!parsed[lift] || parseInt(weight) > parsed[lift]) {
          parsed[lift] = parseInt(weight);
        }
      }
    });
    return parsed;
  };

  const allLifts = {};
  sessions.forEach(s => {
    const parsed = parseLifting(s.lifting_exercises);
    Object.entries(parsed).forEach(([lift, weight]) => {
      if (!allLifts[lift]) allLifts[lift] = [];
      allLifts[lift].push({ date: s.date?.slice(5), weight });
    });
  });

  const topLifts = Object.entries(allLifts)
    .map(([name, data]) => ({
      name,
      max: Math.max(...data.map(d => d.weight)),
      data: data.slice(-10),
    }))
    .sort((a, b) => b.max - a.max)
    .slice(0, 3);

  if (loading) return <div className="text-commander-muted text-xs">Loading strength data...</div>;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-orange-400" />
        <h3 className="text-white font-bold text-sm">Strength Progress</h3>
        <TrendingUp className="w-4 h-4 text-green-400 ml-auto" />
      </div>

      {topLifts.length > 0 ? (
        <div className="space-y-4">
          {topLifts.map(lift => (
            <div key={lift.name}>
              <div className="flex justify-between mb-2">
                <p className="text-white text-xs font-semibold">{lift.name}</p>
                <p className="text-orange-400 font-bold text-sm">{lift.max} lbs</p>
              </div>
              {lift.data.length > 1 && (
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={lift.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 9 }} />
                    <YAxis domain={["dataMin - 20", "dataMax + 20"]} tick={{ fill: "#666", fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 11 }} />
                    <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-commander-muted text-xs">Log lifting sessions to see 1RM trends</p>
      )}
    </div>
  );
}