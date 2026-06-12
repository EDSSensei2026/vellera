import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function WeeklyTrainingTrends() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgVolume: 0, avgIntensity: 0, weekCount: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get last 8 weeks of sessions
        const sessions = await base44.entities.TrainingSession.list("-date", 500);
        
        // Group by week
        const weeklyMap = {};
        const now = new Date();
        
        sessions.forEach(session => {
          if (!session.date) return;
          
          const sessionDate = new Date(session.date);
          const weekStart = new Date(sessionDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weeklyMap[weekKey]) {
            weeklyMap[weekKey] = { 
              week: weekKey,
              totalMinutes: 0,
              totalIntensity: 0,
              count: 0,
              avgIntensity: 0
            };
          }
          
          weeklyMap[weekKey].totalMinutes += session.duration_minutes || 0;
          weeklyMap[weekKey].totalIntensity += (session.intensity_level || 5);
          weeklyMap[weekKey].count += 1;
        });
        
        // Convert to array, calculate averages, keep last 8 weeks
        const chartData = Object.values(weeklyMap)
          .map(w => ({
            week: new Date(w.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            volume: Math.round(w.totalMinutes),
            intensity: Math.round((w.totalIntensity / w.count) * 10) / 10,
            sessions: w.count
          }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-8);
        
        setData(chartData);
        
        if (chartData.length > 0) {
          const avgVol = Math.round(chartData.reduce((sum, w) => sum + w.volume, 0) / chartData.length);
          const avgInt = Math.round((chartData.reduce((sum, w) => sum + w.intensity, 0) / chartData.length) * 10) / 10;
          setStats({ avgVolume: avgVol, avgIntensity: avgInt, weekCount: chartData.length });
        }
      } catch (err) {
        console.error("Failed to load weekly trends:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 h-64 animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Weekly Trends</p>
        </div>
        <p className="text-commander-muted text-sm text-center py-8">No training data yet. Log sessions to see trends.</p>
      </div>
    );
  }

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Weekly Training Trends</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-sm">{stats.avgVolume}</p>
          <p className="text-commander-muted text-xs">avg minutes</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-sm">{stats.avgIntensity}</p>
          <p className="text-commander-muted text-xs">avg intensity</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-sm">{stats.weekCount}</p>
          <p className="text-commander-muted text-xs">weeks tracked</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="week" tick={{ fill: "#666", fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fill: "#666", fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#666", fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} dot={false} name="Training Minutes" />
          <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="#f59e0b" strokeWidth={2} dot={false} name="Avg Intensity" strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>

      {/* Info */}
      <p className="text-commander-muted text-xs mt-3">Volume: minutes per week · Intensity: 1-10 scale</p>
    </div>
  );
}