import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EnduranceMetrics() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TrainingSession.list("-date", 30).then(s => {
      // Filter for endurance-type sessions (Conditioning, Zone 2, etc.)
      setSessions(s.filter(x => x.duration_minutes && (x.session_type?.includes("Zone") || x.session_type?.includes("Conditioning"))));
      setLoading(false);
    });
  }, []);

  const chartData = sessions.slice().reverse().map(s => ({
    date: s.date?.slice(5),
    duration: s.duration_minutes || 0,
    intensity: s.intensity || 5,
  }));

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const avgIntensity = sessions.length > 0 ? (sessions.reduce((sum, s) => sum + (s.intensity || 0), 0) / sessions.length).toFixed(1) : 0;
  const longestSession = Math.max(...sessions.map(s => s.duration_minutes || 0), 0);

  if (loading) return <div className="text-commander-muted text-xs">Loading endurance data...</div>;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold text-sm">Endurance Progress</h3>
        <TrendingUp className="w-4 h-4 text-green-400 ml-auto" />
      </div>

      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 9 }} />
            <YAxis yAxisId="left" tick={{ fill: "#666", fontSize: 9 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#666", fontSize: 9 }} />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 11 }} />
            <Line yAxisId="left" type="monotone" dataKey="duration" stroke="#eab308" strokeWidth={2} dot={false} name="Duration (min)" />
            <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="#f97316" strokeWidth={2} dot={false} name="Intensity" />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-yellow-400 font-bold text-sm">{totalMinutes}</p>
          <p className="text-commander-muted text-xs">Total Min</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-orange-400 font-bold text-sm">{avgIntensity}</p>
          <p className="text-commander-muted text-xs">Avg Intensity</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-cyan-400 font-bold text-sm">{longestSession}</p>
          <p className="text-commander-muted text-xs">Max Duration</p>
        </div>
      </div>

      {chartData.length === 0 && (
        <p className="text-commander-muted text-xs">Log endurance sessions to track volume & intensity</p>
      )}
    </div>
  );
}