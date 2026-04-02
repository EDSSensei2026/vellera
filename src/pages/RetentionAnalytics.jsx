import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RetentionAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRetention = async () => {
      try {
        const response = await base44.functions.invoke("calculateDisciplineRetention", {});
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRetention();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-lg mx-auto safe-area-top">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300">
          Error: {error}
        </div>
      </div>
    );
  }

  const disciplines = data?.disciplines || {};
  const disciplineList = Object.entries(disciplines)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.retention30d - a.retention30d);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24 safe-area-top overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-2xl font-black">Discipline Retention</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disciplineList.map((d) => {
          const trend = d.retention30d >= 60 ? "text-green-400" : d.retention30d >= 40 ? "text-yellow-400" : "text-red-400";
          return (
            <div key={d.name} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-commander-muted text-xs uppercase tracking-widest">
                    {d.name || "General Fitness"}
                  </p>
                  <p className="text-white text-2xl font-black mt-1">{d.retention30d}%</p>
                </div>
                {d.retention30d >= 60 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-commander-muted text-xs">Total Users</p>
                  <p className="text-white font-bold">{d.totalUsers}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-commander-muted text-xs">7-Day Avg</p>
                  <p className="text-white font-bold">{d.retention7dAvg}%</p>
                </div>
              </div>

              <p className="text-xs text-commander-muted">
                {d.activeUsers} active in first 15 days
              </p>
            </div>
          );
        })}
      </div>

      {/* 30-Day Retention Chart */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <h2 className="text-white font-bold">30-Day Retention by Discipline</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disciplineList}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#888" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="retention30d" fill="#00E5FF" name="30-Day Retention %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Retention Trends */}
      {disciplineList.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <h2 className="text-white font-bold">Weekly Retention Trends</h2>
          <div className="space-y-6">
            {disciplineList.map((d) => (
              <div key={d.name}>
                <p className="text-white font-semibold mb-3">{d.name || "General Fitness"}</p>
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={d.weeklyRetention}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="week" stroke="#888" />
                      <YAxis stroke="#888" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="retention"
                        stroke="#CCFF00"
                        dot={{ fill: "#CCFF00" }}
                        strokeWidth={2}
                        name="Weekly Retention %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4 space-y-3">
        <h2 className="text-white font-bold">💡 Insights</h2>
        <div className="space-y-2 text-sm text-gray-300">
          {disciplineList.length > 0 && (
            <>
              <p>
                <strong>{disciplineList[0].name || "General Fitness"}</strong> has the highest 30-day retention at {disciplineList[0].retention30d}%.
              </p>
              {disciplineList.length > 1 && (
                <p>
                  <strong>{disciplineList[disciplineList.length - 1].name || "Other"}</strong> needs attention—30-day retention is {disciplineList[disciplineList.length - 1].retention30d}%.
                </p>
              )}
            </>
          )}
          <p>Focus on improving week-to-week consistency to increase long-term retention.</p>
        </div>
      </div>
    </div>
  );
}