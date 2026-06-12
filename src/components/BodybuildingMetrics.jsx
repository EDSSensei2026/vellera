import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BodybuildingMetrics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BiometricLog.list("-date", 30).then(l => {
      setLogs(l.filter(x => x.weight || x.body_fat));
      setLoading(false);
    });
  }, []);

  const chartData = logs.slice().reverse().map(l => ({
    date: l.date?.slice(5),
    weight: l.weight,
    bodyFat: l.body_fat,
  })).filter(d => d.weight || d.bodyFat);

  const latestLog = logs[0];
  const prevLog = logs[1];
  const weightChange = latestLog?.weight && prevLog?.weight ? (latestLog.weight - prevLog.weight).toFixed(1) : 0;
  const fatChange = latestLog?.body_fat && prevLog?.body_fat ? (latestLog.body_fat - prevLog.body_fat).toFixed(1) : 0;

  if (loading) return <div className="text-commander-muted text-xs">Loading body composition...</div>;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-pink-400" />
        <h3 className="text-white font-bold text-sm">Body Composition</h3>
      </div>

      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 9 }} />
            <YAxis yAxisId="left" tick={{ fill: "#666", fontSize: 9 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#666", fontSize: 9 }} />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 11 }} />
            <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#f472b6" strokeWidth={2} dot={false} name="Weight" />
            <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#60a5fa" strokeWidth={2} dot={false} name="Body Fat %" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {latestLog && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-pink-400 font-bold text-sm">{latestLog.weight?.toFixed(1)} lbs</p>
            <p className="text-commander-muted text-xs">Current Weight</p>
            <p className={`text-xs font-semibold mt-1 ${weightChange > 0 ? "text-red-400" : "text-green-400"}`}>
              {weightChange > 0 ? "+" : ""}{weightChange} lbs
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-blue-400 font-bold text-sm">{latestLog.body_fat?.toFixed(1)}%</p>
            <p className="text-commander-muted text-xs">Body Fat</p>
            <p className={`text-xs font-semibold mt-1 ${fatChange > 0 ? "text-red-400" : "text-green-400"}`}>
              {fatChange > 0 ? "+" : ""}{fatChange}%
            </p>
          </div>
        </div>
      )}

      {chartData.length === 0 && (
        <p className="text-commander-muted text-xs">Log weight & body fat to track composition</p>
      )}
    </div>
  );
}