import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, TrendingUp, MousePointerClick, Eye, Search, Globe, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function StatCard({ icon: Icon, label, value, sub, color = "text-vellera-blue" }) {
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-commander-muted text-xs uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value ?? "—"}</p>
      {sub && <p className="text-commander-muted text-xs">{sub}</p>}
    </div>
  );
}

export default function SearchConsoleDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("searchConsoleSync", {});
    if (res.data?.error) setError(res.data.error);
    else setData(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Search Console</h1>
            <p className="text-commander-muted text-xs">{data?.siteUrl || "Loading site..."}</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-2 bg-commander-surface border border-commander-border rounded-lg hover:border-vellera-blue transition-all">
          <RefreshCw className={`w-4 h-4 text-vellera-blue ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {data && !loading && (
        <>
          {/* Date Range */}
          <p className="text-commander-muted text-xs text-center">
            {data.dateRange.startDate} → {data.dateRange.endDate} (last 28 days)
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={MousePointerClick} label="Total Clicks" value={data.summary.totalClicks.toLocaleString()} color="text-vellera-blue" />
            <StatCard icon={Eye} label="Impressions" value={data.summary.totalImpressions.toLocaleString()} color="text-vellera-green" />
            <StatCard icon={TrendingUp} label="Avg CTR" value={`${data.summary.avgCTR}%`} color="text-yellow-400" />
            <StatCard icon={Search} label="Avg Position" value={`#${data.summary.avgPosition}`} sub="Lower is better" color="text-purple-400" />
          </div>

          {/* Daily Clicks Chart */}
          {data.dailyData.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <p className="text-white text-xs font-bold uppercase tracking-widest">Daily Clicks & Impressions</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis stroke="#555" tick={{ fontSize: 9 }} width={32} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: 11 }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line type="monotone" dataKey="clicks" stroke="#00E5FF" dot={false} strokeWidth={2} name="Clicks" />
                    <Line type="monotone" dataKey="impressions" stroke="#CCFF00" dot={false} strokeWidth={2} name="Impressions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Queries */}
          {data.topQueries.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-vellera-blue" />
                <p className="text-white text-xs font-bold uppercase tracking-widest">Top Search Queries</p>
              </div>
              <div className="space-y-2">
                {data.topQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-commander-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{q.query}</p>
                      <p className="text-commander-muted text-xs">Pos #{q.position} · CTR {q.ctr}%</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-vellera-blue text-sm font-bold">{q.clicks}</p>
                      <p className="text-commander-muted text-xs">{q.impressions.toLocaleString()} imp</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Pages */}
          {data.topPages.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-vellera-green" />
                <p className="text-white text-xs font-bold uppercase tracking-widest">Top Pages</p>
              </div>
              <div className="space-y-2">
                {data.topPages.map((p, i) => {
                  const pagePath = p.page.replace(/^https?:\/\/[^/]+/, '') || '/';
                  return (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-commander-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{pagePath}</p>
                        <p className="text-commander-muted text-xs">Pos #{p.position} · CTR {p.ctr}%</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-vellera-green text-sm font-bold">{p.clicks}</p>
                        <p className="text-commander-muted text-xs">{p.impressions.toLocaleString()} imp</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}