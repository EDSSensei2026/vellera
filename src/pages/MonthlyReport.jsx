import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, Heart, Zap, Award } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { toast } from "sonner";

export default function MonthlyReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      // Fetch training sessions
      const sessions = await base44.entities.TrainingSession.filter(
        { created_by: (await base44.auth.me()).email },
        "-date",
        200
      );
      const recentSessions = sessions.filter(s => s.date >= thirtyDaysAgo && s.date <= today);

      // Fetch biometric logs
      const biometrics = await base44.entities.BiometricLog.filter(
        { created_by: (await base44.auth.me()).email },
        "-date",
        100
      );
      const recentBio = biometrics.filter(b => b.date >= thirtyDaysAgo && b.date <= today);

      // Fetch skill roadmap for mastery improvements
      const skills = await base44.entities.SkillRoadmap.filter(
        { created_by: (await base44.auth.me()).email },
        "-updated_date",
        50
      );

      // Calculate aggregates
      const totalVolume = recentSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalSessions = recentSessions.length;
      const avgDuration = totalSessions > 0 ? Math.round(totalVolume / totalSessions) : 0;

      const avgRecovery = recentBio.length > 0
        ? Math.round(recentBio.reduce((sum, b) => sum + (b.recovery_pct || 0), 0) / recentBio.length)
        : 0;

      const avgHrv = recentBio.length > 0
        ? Math.round(recentBio.reduce((sum, b) => sum + (b.hrv || 0), 0) / recentBio.length)
        : 0;

      // Group sessions by category
      const categoryVolume = recentSessions.reduce((acc, s) => {
        const cat = s.category || "Other";
        acc[cat] = (acc[cat] || 0) + (s.duration_minutes || 0);
        return acc;
      }, {});

      const categoryData = Object.entries(categoryVolume).map(([name, minutes]) => ({
        name,
        minutes,
      }));

      // Build timeline chart
      const dailyData = {};
      recentSessions.forEach(s => {
        const d = s.date;
        dailyData[d] = (dailyData[d] || 0) + (s.duration_minutes || 0);
      });

      const timelineData = Object.entries(dailyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, minutes]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          volume: minutes,
        }));

      // Build recovery timeline
      const recoveryTimeline = recentBio
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(b => ({
          date: new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          recovery: b.recovery_pct || 0,
          hrv: Math.round((b.hrv || 0) / 10), // Scale down for visibility
        }));

      // Skill improvements
      const skillImprovements = skills
        .filter(s => s.mastery_level !== undefined)
        .sort((a, b) => (b.updated_date || "").localeCompare(a.updated_date || ""))
        .slice(0, 5)
        .map(s => ({
          name: s.skill_name || "Unknown",
          mastery: s.mastery_level || 0,
          updated: new Date(s.updated_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));

      const masteryByCategory = skills.reduce((acc, s) => {
        const cat = s.category || "Other";
        const mastery = s.mastery_level || 0;
        if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
        acc[cat].total += mastery;
        acc[cat].count += 1;
        return acc;
      }, {});

      const masteryRadarData = Object.entries(masteryByCategory).map(([cat, { total, count }]) => ({
        skill: cat.substring(0, 8),
        fullSkill: cat,
        value: count > 0 ? Math.round(total / count) : 0,
      }));

      setReportData({
        totalVolume,
        totalSessions,
        avgDuration,
        avgRecovery,
        avgHrv,
        categoryData,
        timelineData,
        recoveryTimeline,
        skillImprovements,
        masteryRadarData,
        dateRange: `${new Date(thirtyDaysAgo).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(today).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
    } catch (err) {
      console.error("Failed to load monthly data:", err);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-commander-dark p-4 flex flex-col items-center justify-center">
        <ArrowLeft className="w-8 h-8 text-commander-muted mb-4" onClick={() => navigate(-1)} />
        <p className="text-commander-muted">Unable to load report data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24 max-w-2xl mx-auto space-y-6 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-xl font-black">Monthly Report</h1>
          <p className="text-commander-muted text-xs">{reportData.dateRange}</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: Zap,
            label: "Total Volume",
            value: `${reportData.totalVolume} min`,
            subtext: `${reportData.totalSessions} sessions`,
            color: "text-orange-400",
            bg: "bg-orange-900/20",
            border: "border-orange-700/50",
          },
          {
            icon: Heart,
            label: "Avg Recovery",
            value: `${reportData.avgRecovery}%`,
            subtext: `HRV: ${reportData.avgHrv} ms`,
            color: "text-vellera-blue",
            bg: "bg-blue-900/20",
            border: "border-blue-700/50",
          },
          {
            icon: TrendingUp,
            label: "Avg Session",
            value: `${reportData.avgDuration} min`,
            subtext: "per workout",
            color: "text-vellera-green",
            bg: "bg-green-900/20",
            border: "border-green-700/50",
          },
          {
            icon: Award,
            label: "Skills Tracked",
            value: `${reportData.skillImprovements.length}`,
            subtext: "recent updates",
            color: "text-amber-400",
            bg: "bg-amber-900/20",
            border: "border-amber-700/50",
          },
        ].map(({ icon: Icon, label, value, subtext, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-commander-muted">{label}</p>
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtext}</p>
          </div>
        ))}
      </div>

      {/* Training Volume by Category */}
      {reportData.categoryData.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" /> Training by Category
          </h2>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.categoryData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v) => [`${v} min`, "Volume"]}
                />
                <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {reportData.categoryData.map(cat => (
              <div key={cat.name} className="bg-gray-800 rounded-lg p-2 text-center">
                <p className="text-orange-400 font-bold text-sm">{cat.minutes} min</p>
                <p className="text-commander-muted text-xs">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Training Volume Timeline */}
      {reportData.timelineData.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold">Training Volume Trend</h2>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v) => [`${v} min`, "Volume"]}
                />
                <Line type="monotone" dataKey="volume" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recovery Score Timeline */}
      {reportData.recoveryTimeline.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Heart className="w-4 h-4 text-vellera-blue" /> Recovery & HRV Trend
          </h2>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.recoveryTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="recovery" stroke="#00E5FF" strokeWidth={2} dot={false} name="Recovery %" />
                <Line type="monotone" dataKey="hrv" stroke="#CCFF00" strokeWidth={2} dot={false} name="HRV (scaled)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Skill Mastery Radar */}
      {reportData.masteryRadarData.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Skill Mastery Distribution
          </h2>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={reportData.masteryRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#888", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: 11 }}
                  formatter={(v, _, p) => [`${v}%`, p.payload.fullSkill]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Skill Improvements */}
      {reportData.skillImprovements.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <h2 className="text-white font-bold">Recent Skill Improvements</h2>

          <div className="space-y-2">
            {reportData.skillImprovements.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{skill.name}</p>
                  <p className="text-commander-muted text-xs">Updated {skill.updated}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-amber-400 font-bold text-sm">{skill.mastery}%</p>
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{ width: `${skill.mastery}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4">
        <p className="text-white text-sm font-bold mb-2">📊 Key Insights</p>
        <ul className="space-y-1 text-xs text-gray-300">
          <li>• You completed <strong>{reportData.totalSessions} training sessions</strong> this month.</li>
          <li>• Average recovery is <strong>{reportData.avgRecovery}%</strong> — {reportData.avgRecovery >= 70 ? "excellent recovery!" : reportData.avgRecovery >= 50 ? "moderate recovery—watch sleep" : "focus on rest and recovery"}.</li>
          {reportData.categoryData.length > 0 && (
            <li>
              • Top category:{" "}
              <strong>
                {reportData.categoryData.reduce((a, b) => (a.minutes > b.minutes ? a : b)).name}
              </strong>
            </li>
          )}
          {reportData.skillImprovements.length > 0 && (
            <li>• You improved <strong>{reportData.skillImprovements.length} skills</strong> this month.</li>
          )}
        </ul>
      </div>
    </div>
  );
}