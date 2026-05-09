import { useState } from "react";
import { base44 } from "@/api/base44Client";

const C = {
  card: "#111827", border: "#1f2937", accent: "#a855f7",
  green: "#22c55e", yellow: "#eab308", red: "#ef4444",
  sec: "#9ca3af", text: "#f9fafb", muted: "#6b7280",
};

const SECTIONS = [
  { key: "TREND ASSESSMENT", icon: "📈", color: C.accent },
  { key: "KEY INSIGHT", icon: "💡", color: "#eab308" },
  { key: "RECOVERY STATUS", icon: "🔋", color: "#22c55e" },
  { key: "ACTION ITEMS", icon: "✅", color: "#14b8a6" },
  { key: "RISK FLAGS", icon: "⚠️", color: "#ef4444" },
];

function parseAnalysis(text) {
  const result = {};
  SECTIONS.forEach(({ key }) => {
    const regex = new RegExp(`${key}[:\\s*]*([\\s\\S]*?)(?=${SECTIONS.map(s => s.key).join('|')}|$)`, 'i');
    const match = text.match(regex);
    if (match) result[key] = match[1].replace(/^\d+\.\s*/, '').trim();
  });
  // fallback: just show raw text
  if (Object.keys(result).length === 0) result['FULL ANALYSIS'] = text;
  return result;
}

export default function HFPerformanceAnalysis({ logs }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!logs || logs.length === 0) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke('analyzePerformanceHF', { logs });
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.analysis ? parseAnalysis(result.analysis) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.sec, textTransform: "uppercase", letterSpacing: 1.2 }}>
          🤖 AI Performance Analysis <span style={{ color: C.accent, fontSize: 9 }}>· Hugging Face</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading || !logs?.length}
          style={{
            background: loading ? "#1f2937" : "linear-gradient(135deg,#7c3aed,#a855f7)",
            border: "none", borderRadius: 8, padding: "8px 16px",
            color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: loading || !logs?.length ? "not-allowed" : "pointer",
            opacity: !logs?.length ? 0.4 : 1,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Analyzing…
            </>
          ) : "⚡ Analyze with AI"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#1c0000", border: "1px solid #b91c1c", borderRadius: 12, padding: "12px 16px", color: "#f87171", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {result && parsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Stats bar */}
          <div style={{ background: "#0f0a1e", border: "1px solid #2d1b69", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              ["HRV", `${result.stats.avgHrv}ms`],
              ["Recovery", `${result.stats.avgRecovery}%`],
              ["Sleep", `${result.stats.avgSleep}%`],
              ["RHR", `${result.stats.avgRhr}bpm`],
              ["Days", result.stats.daysAnalyzed],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{val}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 9, color: C.muted, alignSelf: "flex-end" }}>
              via {result.model?.split('/').pop()}
            </div>
          </div>

          {/* Parsed sections */}
          {Object.entries(parsed).map(([key, content]) => {
            const sec = SECTIONS.find(s => s.key === key) || { icon: "📊", color: C.accent };
            return (
              <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sec.color}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sec.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {sec.icon} {key}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{content}</div>
              </div>
            );
          })}
        </div>
      )}

      {!result && !loading && !error && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>
          Click "Analyze with AI" to get a Hugging Face ML-powered performance report on your last {logs?.length || 0} biometric entries.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}