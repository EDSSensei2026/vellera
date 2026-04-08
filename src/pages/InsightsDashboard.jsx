import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Brain, TrendingUp, TrendingDown, Minus, Zap, Moon, Heart, Activity,
  AlertTriangle, CheckCircle, Info, ArrowLeft, RefreshCw, Loader2,
  Target, BarChart3, Lightbulb, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const SEVERITY_CONFIG = {
  positive: { bg: "bg-vellera-green/10 border-vellera-green/30", icon: CheckCircle, iconColor: "text-vellera-green", badge: "bg-vellera-green/20 text-vellera-green border-vellera-green/30" },
  warning:  { bg: "bg-yellow-900/20 border-yellow-700/30",       icon: AlertTriangle, iconColor: "text-yellow-400", badge: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30" },
  critical: { bg: "bg-red-900/20 border-red-700/30",             icon: AlertTriangle, iconColor: "text-red-400",    badge: "bg-red-900/30 text-red-400 border-red-700/30" },
  neutral:  { bg: "bg-commander-surface border-commander-border", icon: Info,          iconColor: "text-vellera-blue", badge: "bg-vellera-blue/10 text-vellera-blue border-vellera-blue/20" },
};

const CATEGORY_ICONS = { sleep: Moon, recovery: Heart, hrv: Activity, strain: Zap, nutrition: Target, trend: TrendingUp };

const CORRELATION_STRENGTH = { strong: "bg-vellera-green", moderate: "bg-yellow-400", weak: "bg-gray-500" };

function ScoreRing({ score }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? "#CCFF00" : pct >= 40 ? "#facc15" : "#f87171";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1a2233" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="55" y="58" textAnchor="middle" fill={color} fontSize="22" fontWeight="900">{pct}</text>
      <text x="55" y="72" textAnchor="middle" fill="#666" fontSize="9">/ 100</text>
    </svg>
  );
}

function InsightCard({ insight }) {
  const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.neutral;
  const SevIcon = cfg.icon;
  const CatIcon = CATEGORY_ICONS[insight.category] || Lightbulb;
  return (
    <div className={`border rounded-xl p-4 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
          <CatIcon className={`w-4 h-4 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-white font-bold text-sm">{insight.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold capitalize ${cfg.badge}`}>
              {insight.severity}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 capitalize">
              {insight.category}
            </span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed mb-2">{insight.finding}</p>
          <p className="text-gray-500 text-xs mb-2 italic">{insight.impact}</p>
          <div className="flex items-start gap-1.5 bg-gray-900/60 rounded-lg px-3 py-2">
            <Zap className="w-3 h-3 text-vellera-blue shrink-0 mt-0.5" />
            <p className="text-vellera-blue text-xs font-bold">{insight.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelationCard({ corr }) {
  const isPos = corr.direction === "positive";
  const Arrow = isPos ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-bold text-sm">{corr.title}</p>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${CORRELATION_STRENGTH[corr.strength] || "bg-gray-500"}`} />
          <span className="text-xs text-gray-500 capitalize">{corr.strength}</span>
          <Arrow className={`w-3 h-3 ${isPos ? "text-vellera-green" : "text-red-400"}`} />
        </div>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed mb-3">{corr.description}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 bg-vellera-blue/10 text-vellera-blue border border-vellera-blue/20 rounded-lg font-bold">{corr.metric_a}</span>
        <span className="text-gray-600 text-xs">{isPos ? "↑ with" : "↓ when"}</span>
        <span className="text-xs px-2 py-1 bg-purple-900/20 text-purple-400 border border-purple-700/30 rounded-lg font-bold">{corr.metric_b}</span>
      </div>
    </div>
  );
}

export default function InsightsDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [daysAnalyzed, setDaysAnalyzed] = useState(0);
  const [cachedReport, setCachedReport] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vellera_insights_report") || "null"); } catch { return null; }
  });

  useEffect(() => {
    if (cachedReport) {
      setReport(cachedReport.report);
      setGeneratedAt(cachedReport.generated_at);
      setDaysAnalyzed(cachedReport.days_analyzed || 0);
    }
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("generateInsightsReport", {});
    const data = res.data;
    if (data.error) {
      setError(data.message || "Failed to generate insights.");
    } else {
      setReport(data.report);
      setGeneratedAt(data.generated_at);
      setDaysAnalyzed(data.days_analyzed || 0);
      localStorage.setItem("vellera_insights_report", JSON.stringify(data));
    }
    setLoading(false);
  };

  const trend = report?.trend_direction;
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;
  const trendColor = trend === "improving" ? "text-vellera-green" : trend === "declining" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-500 hover:text-white transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-vellera-blue" /> AI Insights
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {generatedAt ? `Generated ${new Date(generatedAt).toLocaleString()} · ${daysAnalyzed} days analyzed` : "AI-powered weekly biometric report"}
              </p>
            </div>
          </div>
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black text-sm rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "Analyzing…" : report ? "Regenerate" : "Generate Report"}
          </button>
        </div>

        {/* Note about model */}
        {!report && !loading && (
          <div className="bg-vellera-blue/10 border border-vellera-blue/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-vellera-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-vellera-blue font-bold text-sm">Powered by Claude Sonnet</p>
              <p className="text-gray-400 text-xs mt-0.5">This report uses a high-quality AI model to analyze your biometric trends. It uses more integration credits than standard features. Click "Generate Report" to begin.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white font-black text-lg">Analyzing your biometrics…</p>
            <p className="text-gray-500 text-sm">Finding correlations between sleep, recovery, HRV, and training load</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-bold">{error}</p>
              <p className="text-gray-500 text-xs mt-1">Sync your wearables and check back after a few more days of data.</p>
              <Link to="/wearables" className="text-vellera-blue text-xs hover:underline mt-1 inline-block">Go to Wearables Hub →</Link>
            </div>
          </div>
        )}

        {report && !loading && (
          <>
            {/* Red Flags */}
            {report.red_flags?.length > 0 && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 space-y-2">
                <p className="text-red-300 font-black text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Critical Alerts</p>
                {report.red_flags.map((f, i) => <p key={i} className="text-red-400 text-xs pl-6">• {f}</p>)}
              </div>
            )}

            {/* Hero: Score + Summary */}
            <div className="bg-commander-surface border border-commander-border rounded-2xl p-6">
              <div className="flex items-center gap-6 flex-wrap">
                <ScoreRing score={report.performance_score} />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-white font-black text-lg">This Week</p>
                    <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                    <span className={`text-sm font-bold capitalize ${trendColor}`}>{trend}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{report.weekly_summary}</p>
                  {report.highlight_day && (
                    <div className="mt-3 bg-gray-800 rounded-lg px-3 py-2 inline-block">
                      <p className="text-xs text-gray-500">Highlight Day</p>
                      <p className="text-white text-xs font-bold">{report.highlight_day.date} — {report.highlight_day.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Action Plan */}
            {report.weekly_actions?.length > 0 && (
              <div className="bg-vellera-green/5 border border-vellera-green/20 rounded-xl p-5">
                <p className="text-vellera-green font-black text-sm flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" /> This Week's Action Plan
                </p>
                <ol className="space-y-2">
                  {report.weekly_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 bg-vellera-green/20 text-vellera-green text-xs font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-gray-200">{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Insights */}
            {report.insights?.length > 0 && (
              <div>
                <h2 className="text-white font-black text-base mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" /> Key Findings ({report.insights.length})
                </h2>
                <div className="space-y-3">
                  {report.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                </div>
              </div>
            )}

            {/* Correlations */}
            {report.correlations?.length > 0 && (
              <div>
                <h2 className="text-white font-black text-base mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-vellera-blue" /> Metric Correlations
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {report.correlations.map((c, i) => <CorrelationCard key={i} corr={c} />)}
                </div>
                <p className="text-xs text-gray-600 mt-2">Correlations are derived from your personal data. Strength: <span className="text-vellera-green">●</span> Strong &nbsp;<span className="text-yellow-400">●</span> Moderate &nbsp;<span className="text-gray-500">●</span> Weak</p>
              </div>
            )}

            {/* Footer links */}
            <div className="flex gap-3 flex-wrap">
              <Link to="/wearable-analytics" className="flex items-center gap-2 px-4 py-2 bg-commander-surface border border-commander-border text-gray-300 text-sm font-bold rounded-xl hover:border-vellera-blue transition">
                <BarChart3 className="w-4 h-4" /> Deep Analytics
              </Link>
              <Link to="/wearables" className="flex items-center gap-2 px-4 py-2 bg-commander-surface border border-commander-border text-gray-300 text-sm font-bold rounded-xl hover:border-vellera-blue transition">
                <Activity className="w-4 h-4" /> Sync Wearables
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}