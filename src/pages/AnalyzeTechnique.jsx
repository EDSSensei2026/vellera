import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle, AlertTriangle, Target, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import BackButton from "../components/BackButton";

const SESSION_TYPES = [
  "BJJ Rolling",
  "BJJ Drilling",
  "MMA Sparring",
  "CrossFit WOD",
  "Group Fitness",
  "Personal Training",
  "Weightlifting",
  "Mobility / Yoga",
  "Wrestling",
  "Striking / Boxing",
];

const SCORE_COLOR = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

const SCORE_BG = (score) => {
  if (score >= 80) return "border-green-700 bg-green-950/30";
  if (score >= 60) return "border-yellow-700 bg-yellow-950/30";
  return "border-red-700 bg-red-950/30";
};

function ScoreGauge({ score }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center z-10">
        <p className="font-black text-2xl" style={{ color }}>{score}</p>
        <p className="text-gray-500 text-xs">/ 100</p>
      </div>
    </div>
  );
}

function ErrorCard({ error, index }) {
  const [open, setOpen] = useState(false);
  const severityColor = {
    high: "border-red-700 bg-red-950/20 text-red-400",
    medium: "border-yellow-700 bg-yellow-950/20 text-yellow-400",
    low: "border-gray-700 bg-gray-900/30 text-gray-400",
  }[error.severity] || "border-gray-700 bg-gray-900/30 text-gray-400";

  return (
    <div className={`rounded-xl border ${severityColor} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        <span className="text-lg">{error.severity === "high" ? "🔴" : error.severity === "medium" ? "🟡" : "⚪"}</span>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">{error.error_name}</p>
          <p className="text-gray-400 text-xs">{error.body_area}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-3">
          <p className="text-gray-300 text-sm">{error.description}</p>
          {error.drill && (
            <div className="bg-[#00E5FF10] border border-[#00E5FF30] rounded-lg p-3">
              <p className="text-[#00E5FF] text-xs font-bold mb-1">🎯 Recommended Drill</p>
              <p className="text-white text-sm font-semibold">{error.drill.name}</p>
              <p className="text-gray-400 text-xs mt-1">{error.drill.instructions}</p>
              {error.drill.reps && <p className="text-[#CCFF00] text-xs mt-1 font-bold">{error.drill.reps}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyzeTechnique() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sessionType, setSessionType] = useState("BJJ Rolling");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const isVideo = file?.type?.startsWith("video/");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setSavedId(null);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) { toast.error("Please upload a file first"); return; }
    if (!title.trim()) { toast.error("Give this clip a title"); return; }
    setAnalyzing(true);
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const isBJJ = sessionType.toLowerCase().includes("bjj") || sessionType.toLowerCase().includes("wrestling") || sessionType.toLowerCase().includes("mma");

      const prompt = `You are an elite sports performance coach and movement analyst specializing in ${sessionType}.

Analyze this ${isVideo ? "video frame/clip" : "image"} of an athlete performing ${sessionType}.

Your job:
1. Identify the specific movements or techniques visible
2. Detect technical errors or form breakdowns (be specific — body position, base, posture, alignment, etc.)
3. Assess overall movement quality with a score from 0–100
4. For each error, prescribe a specific corrective drill

${isBJJ ? `Focus on BJJ-specific principles:
- Hip position and base (heavy hips, high hips)
- Frame quality (pushing vs collapsing)
- Head position (chin tucked, posture)
- Guard retention mechanics
- Pressure application and weight distribution
- Escape timing and direction
- Grip fighting efficiency
- Transitions and chain wrestling` : `Focus on sport-specific movement principles:
- Joint alignment and stacking
- Bracing and core engagement
- Range of motion and mobility
- Tempo and control
- Balance and stability
- Breathing mechanics`}

For each error, classify severity as: high / medium / low

Return ONLY valid JSON:
{
  "session_summary": "brief 1-2 sentence overview of what you see",
  "techniques_identified": ["technique 1", "technique 2"],
  "overall_score": <0-100>,
  "score_rationale": "why you gave this score",
  "errors": [
    {
      "error_name": "specific error name",
      "body_area": "e.g. 'Hip Position' or 'Left Knee'",
      "severity": "high|medium|low",
      "description": "detailed explanation of the error and why it's problematic",
      "drill": {
        "name": "drill name",
        "instructions": "step-by-step drill instructions",
        "reps": "e.g. '3 sets x 2 min' or '5 x 5 reps'"
      }
    }
  ],
  "coaching_cues": ["short actionable cue 1", "cue 2", "cue 3"],
  "priority_focus": "the single most important thing to fix this week"
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            session_summary: { type: "string" },
            techniques_identified: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            score_rationale: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  error_name: { type: "string" },
                  body_area: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  drill: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      instructions: { type: "string" },
                      reps: { type: "string" },
                    },
                  },
                },
              },
            },
            coaching_cues: { type: "array", items: { type: "string" } },
            priority_focus: { type: "string" },
          },
        },
      });

      // Save to VideoVault
      const saved = await base44.entities.VideoVault.create({
        title: title.trim(),
        date: new Date().toISOString().split("T")[0],
        video_url: file_url,
        session_type: sessionType,
        ai_techniques_tagged: analysis.techniques_identified || [],
        posture_score: analysis.overall_score,
        ai_analysis: analysis.session_summary + "\n\n" + analysis.score_rationale,
        ai_coaching_cues: analysis.coaching_cues || [],
        notes: notes.trim() || null,
        analyzed: true,
      });

      setResult(analysis);
      setSavedId(saved.id);
      toast.success("Analysis complete! Saved to Film Vault 🎬");
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setSavedId(null);
    setTitle("");
    setNotes("");
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">Analyze Technique</h1>
          <p className="text-gray-500 text-xs">AI-powered form breakdown & drill prescription</p>
        </div>
      </div>

      {!result ? (
        <>
          {/* Upload Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wider">Clip Title</label>
              <input
                type="text"
                placeholder="e.g. 'Guard pass attempt — sparring with Mike'"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wider">Session Type</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#00E5FF] min-h-[44px]"
              >
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* File Upload */}
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-700 hover:border-[#00E5FF] cursor-pointer transition-all rounded-xl bg-gray-900 overflow-hidden">
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {preview ? (
                <div className="relative w-full">
                  <img src={preview} alt="preview" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <p className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-lg">Tap to change</p>
                  </div>
                </div>
              ) : file ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">🎬</p>
                  <p className="text-[#00E5FF] text-sm font-semibold">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-1">Video selected — tap to change</p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">Upload Video or Photo</p>
                  <p className="text-gray-600 text-xs mt-1">BJJ, CrossFit, lifting, sparring — anything</p>
                  <p className="text-gray-700 text-xs mt-0.5">MP4, MOV, JPG, PNG supported</p>
                </div>
              )}
            </label>

            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-semibold uppercase tracking-wider">Context Notes (optional)</label>
              <textarea
                placeholder="What were you working on? Any specific areas of concern?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !file}
              className="w-full py-4 rounded-xl font-black text-base text-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              style={{ backgroundColor: analyzing || !file ? "#333" : "#00E5FF", color: analyzing || !file ? "#666" : "#000" }}
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin text-white" /><span className="text-white">Analyzing with Vision AI...</span></>
              ) : (
                <><Target className="w-5 h-5" /> Analyze My Technique</>
              )}
            </button>

            {analyzing && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center space-y-2">
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#00E5FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-gray-400 text-sm">Scanning movement patterns...</p>
                <p className="text-gray-600 text-xs">Identifying technical errors and prescribing drills</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-4">
            {/* Score Card */}
            <div className={`rounded-2xl border-2 p-5 ${SCORE_BG(result.overall_score)}`}>
              <div className="flex items-center gap-4">
                <ScoreGauge score={result.overall_score} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Form Score</p>
                  <p className="text-white font-bold text-sm leading-snug">{result.score_rationale}</p>
                </div>
              </div>
            </div>

            {/* Session Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Session Overview</p>
              <p className="text-white text-sm leading-relaxed">{result.session_summary}</p>
              {result.techniques_identified?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {result.techniques_identified.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#00E5FF15] border border-[#00E5FF30] text-[#00E5FF]">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Focus */}
            {result.priority_focus && (
              <div className="bg-[#CCFF0010] border border-[#CCFF0030] rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="text-[#CCFF00] text-xs font-bold uppercase tracking-wider mb-1">Priority Fix This Week</p>
                  <p className="text-white text-sm font-semibold">{result.priority_focus}</p>
                </div>
              </div>
            )}

            {/* Coaching Cues */}
            {result.coaching_cues?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Coaching Cues</p>
                <div className="space-y-2">
                  {result.coaching_cues.map((cue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#00E5FF] font-black text-sm mt-0.5">→</span>
                      <p className="text-white text-sm">{cue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Errors */}
            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  {result.errors.length} Technical Error{result.errors.length > 1 ? "s" : ""} Found
                </p>
                {result.errors.map((err, i) => <ErrorCard key={i} error={err} index={i} />)}
              </div>
            )}

            {/* Saved badge */}
            {savedId && (
              <div className="flex items-center gap-2 bg-green-950/40 border border-green-800 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">Analysis saved to your Film Vault</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={reset}
                className="py-3 rounded-xl border border-gray-700 text-white font-bold text-sm hover:border-gray-500 transition-all min-h-[44px]"
              >
                Analyze Another
              </button>
              <a
                href="/vault"
                className="py-3 rounded-xl bg-gray-800 border border-gray-700 text-[#00E5FF] font-bold text-sm text-center hover:bg-gray-700 transition-all flex items-center justify-center min-h-[44px]"
              >
                View Film Vault
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}