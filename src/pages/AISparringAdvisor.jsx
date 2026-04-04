import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Brain, RefreshCw, Target, Zap, Shield, AlertTriangle, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AISparringAdvisor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [error, setError] = useState(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await base44.functions.invoke("aiSparringAdvisor", {});
      if (res.data?.error) throw new Error(res.data.error);
      setAdvice(res.data.advice);
      setSessionCount(res.data.sessions_analyzed || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-xl font-black">AI Sparring Advisor</h1>
          <p className="text-commander-muted text-xs">Analyzes your last 5 BJJ journal entries</p>
        </div>
      </div>

      {/* Trigger Card */}
      <div className="bg-gradient-to-br from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/30 rounded-xl p-5 space-y-3 text-center">
        <Brain className="w-10 h-10 mx-auto text-vellera-blue" />
        <p className="text-white font-black text-lg">Get Your Personalized Game Plan</p>
        <p className="text-commander-muted text-sm">
          Your coach AI reads your last 5 BJJ sessions, identifies recurring gaps, and prescribes a targeted Drill of the Day.
        </p>
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full bg-vellera-green text-commander-dark font-black py-3 rounded-xl hover:bg-vellera-blue transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Sessions…</>
          ) : (
            <><Zap className="w-4 h-4" /> Analyze My Last 5 Sessions</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {advice && (
        <div className="space-y-4">
          {/* Sessions analyzed badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-commander-muted">Analyzed</span>
            <span className="bg-vellera-blue/20 text-vellera-blue font-bold text-xs px-2 py-0.5 rounded-full">{sessionCount} sessions</span>
          </div>

          {/* Warrior Cue */}
          {advice.warrior_cue && (
            <div className="bg-vellera-green/10 border border-vellera-green/40 rounded-xl p-4">
              <p className="text-vellera-green font-black text-xs uppercase tracking-widest mb-1">⚔️ Warrior Cue</p>
              <p className="text-white font-bold text-sm italic">"{advice.warrior_cue}"</p>
            </div>
          )}

          {/* Focus Area */}
          {advice.focus_area_next_class && (
            <div className="bg-commander-surface border border-vellera-blue/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-vellera-blue" />
                <p className="text-vellera-blue font-black text-sm uppercase tracking-widest">Next Class Focus</p>
              </div>
              <p className="text-white text-sm leading-relaxed">{advice.focus_area_next_class}</p>
            </div>
          )}

          {/* Drill of the Day */}
          {advice.drill_of_the_day && (
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border border-yellow-600/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-black text-sm uppercase tracking-widest">Drill of the Day</p>
              </div>
              <p className="text-white font-black text-lg">{advice.drill_of_the_day.name}</p>
              <div className="flex gap-3 text-xs">
                {advice.drill_of_the_day.duration && (
                  <span className="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded-full font-bold">⏱ {advice.drill_of_the_day.duration}</span>
                )}
                {advice.drill_of_the_day.reps && (
                  <span className="bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded-full font-bold">🔁 {advice.drill_of_the_day.reps}</span>
                )}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{advice.drill_of_the_day.description}</p>
              {advice.drill_of_the_day.why_this_drill && (
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-vellera-blue text-xs font-bold mb-1">Why this drill?</p>
                  <p className="text-gray-300 text-xs">{advice.drill_of_the_day.why_this_drill}</p>
                </div>
              )}
            </div>
          )}

          {/* 60s Warm-Up Drill */}
          {advice.warmup_drill && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-vellera-green" />
                <p className="text-vellera-green font-bold text-xs uppercase tracking-widest">60-Second Warm-Up</p>
                {advice.warmup_drill.duration && (
                  <span className="text-commander-muted text-xs ml-auto">{advice.warmup_drill.duration}</span>
                )}
              </div>
              <p className="text-white font-bold text-sm">{advice.warmup_drill.name}</p>
              <p className="text-gray-400 text-sm">{advice.warmup_drill.instructions}</p>
            </div>
          )}

          {/* Recurring Weaknesses */}
          {advice.recurring_weaknesses?.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Recurring Defensive Gaps</p>
              </div>
              <ul className="space-y-2">
                {advice.recurring_weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-red-500 font-black mt-0.5 flex-shrink-0">▸</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missed Opportunities */}
          {advice.missed_opportunities?.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest">Missed Opportunities</p>
              </div>
              <ul className="space-y-2">
                {advice.missed_opportunities.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-orange-500 font-black mt-0.5 flex-shrink-0">▸</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-analyze */}
          <button
            onClick={analyze}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Re-Analyze
          </button>
        </div>
      )}
    </div>
  );
}