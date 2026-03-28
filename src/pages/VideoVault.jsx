import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Play, Zap, Target, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const KNOWN_TECHNIQUES = [
  "Trap and Roll (Bridge)", "Shrimping to Guard", "Elbow Escape (Mount)",
  "Posturing in Closed Guard", "Knee-Shield (Z-Guard)", "Over-Under Pass",
  "Cross-Face Pressure", "Straight Armbar", "Kimura System",
  "Double Leg (Blast)", "Sprawl & Circle", "Wall Walk", "Takedown Defense (Sprawl)",
];

const POSTURE_COLORS = {
  excellent: { label: "Excellent", color: "text-green-400", bar: "bg-green-500" },
  good: { label: "Good", color: "text-blue-400", bar: "bg-blue-500" },
  fair: { label: "Fair", color: "text-yellow-400", bar: "bg-yellow-500" },
  poor: { label: "Needs Work", color: "text-red-400", bar: "bg-red-500" },
};

function getPostureCategory(score) {
  if (score >= 80) return POSTURE_COLORS.excellent;
  if (score >= 60) return POSTURE_COLORS.good;
  if (score >= 40) return POSTURE_COLORS.fair;
  return POSTURE_COLORS.poor;
}

function ClipCard({ clip, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = clip.posture_score != null ? getPostureCategory(clip.posture_score) : null;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{clip.title}</p>
            <p className="text-commander-muted text-xs mt-0.5">{clip.date} · {clip.session_type || "Sparring"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {clip.analyzed && cat && (
              <div className="text-center">
                <p className={`font-black text-xl ${cat.color}`}>{clip.posture_score}</p>
                <p className="text-xs text-commander-muted">Posture</p>
              </div>
            )}
            <button onClick={() => setExpanded(e => !e)} className="text-commander-muted hover:text-white transition-all p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Posture Bar */}
        {clip.analyzed && cat && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-commander-muted">Posture Alignment</span>
              <span className={cat.color}>{cat.label}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${cat.bar}`} style={{ width: `${clip.posture_score}%` }} />
            </div>
          </div>
        )}

        {/* Techniques */}
        {clip.ai_techniques_tagged?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {clip.ai_techniques_tagged.map(t => (
              <span key={t} className="text-xs bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Analysis */}
      {expanded && clip.analyzed && (
        <div className="border-t border-commander-border p-4 space-y-3">
          {clip.ai_analysis && (
            <div>
              <p className="text-xs text-commander-muted uppercase tracking-widest mb-1">AI Analysis</p>
              <p className="text-white text-sm leading-relaxed">{clip.ai_analysis}</p>
            </div>
          )}
          {clip.ai_coaching_cues?.length > 0 && (
            <div>
              <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Coaching Cues</p>
              <div className="space-y-1">
                {clip.ai_coaching_cues.map((cue, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-commander-red text-xs mt-0.5">→</span>
                    <p className="text-white text-sm">{cue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {clip.video_url && (
            <a href={clip.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-all">
              <Play className="w-4 h-4" /> Watch Clip
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoVault() {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    session_type: "BJJ Foundations",
    notes: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const load = () =>
    base44.entities.VideoVault.list("-date", 50).then(c => { setClips(c); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleUploadAndAnalyze = async () => {
    if (!form.title) { toast.error("Please add a clip title"); return; }
    if (!imageFile && !videoFile) { toast.error("Upload at least a screenshot/thumbnail for AI analysis"); return; }

    setUploading(true);
    try {
      // Upload the image/thumbnail for AI vision analysis
      let imageUrl = null;
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = file_url;
      }

      // Upload video if provided
      let videoUrl = null;
      if (videoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
        videoUrl = file_url;
      }

      // Save clip record first
      const clip = await base44.entities.VideoVault.create({
        ...form,
        video_url: videoUrl,
        thumbnail_url: imageUrl,
        analyzed: false,
      });

      setUploading(false);
      setAnalyzing(true);
      toast.info("Running AI analysis... this takes ~10 seconds");

      // Run AI analysis using vision
      const techniqueList = KNOWN_TECHNIQUES.join(", ");
      const prompt = `You are an expert BJJ coach analyzing a sparring clip screenshot/frame.

Known technique library: ${techniqueList}

Analyze this image and provide:
1. Which techniques from the library are visible or being attempted (max 5)
2. A Posture Alignment Score from 0-100 based on:
   - Base stability (feet width, weight distribution)
   - Spine position (straight vs hunched)
   - Head position (up = aware vs down = vulnerable)
   - Hip engagement (hips low and engaged vs high and passive)
   - Limb positioning (arms in, elbows protected)
   For a 250lb heavyweight white belt, prioritize base stability and spine protection.
3. A 2-3 sentence overall analysis of what you see
4. 3 specific coaching cues to improve their game

Respond in JSON with keys: techniques_tagged (array of strings matching exactly from the library), posture_score (number 0-100), analysis (string), coaching_cues (array of 3 strings).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: imageUrl ? [imageUrl] : [],
        response_json_schema: {
          type: "object",
          properties: {
            techniques_tagged: { type: "array", items: { type: "string" } },
            posture_score: { type: "number" },
            analysis: { type: "string" },
            coaching_cues: { type: "array", items: { type: "string" } },
          },
        },
      });

      await base44.entities.VideoVault.update(clip.id, {
        ai_techniques_tagged: result.techniques_tagged || [],
        posture_score: result.posture_score || 0,
        ai_analysis: result.analysis || "",
        ai_coaching_cues: result.coaching_cues || [],
        analyzed: true,
      });

      toast.success("AI analysis complete! 🥋");
      setForm({ title: "", date: new Date().toISOString().split("T")[0], session_type: "BJJ Foundations", notes: "" });
      setVideoFile(null);
      setImageFile(null);
      load();
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const avgPosture = clips.filter(c => c.posture_score != null).length
    ? Math.round(clips.filter(c => c.posture_score != null).reduce((s, c) => s + c.posture_score, 0) / clips.filter(c => c.posture_score != null).length)
    : null;

  const allTagged = clips.flatMap(c => c.ai_techniques_tagged || []);
  const techFreq = allTagged.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const topTechs = Object.entries(techFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-white text-xl font-black tracking-tight">Video Vault</h1>

      {/* Stats */}
      {clips.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
            <p className="text-white font-black text-xl">{clips.length}</p>
            <p className="text-commander-muted text-xs">Clips</p>
          </div>
          {avgPosture != null && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
              <p className={`font-black text-xl ${getPostureCategory(avgPosture).color}`}>{avgPosture}</p>
              <p className="text-commander-muted text-xs">Avg Posture</p>
            </div>
          )}
          {topTechs.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
              <p className="text-commander-red font-black text-xs leading-tight">{topTechs[0]?.[0]?.split(" ")[0]}</p>
              <p className="text-commander-muted text-xs">Top Technique</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest">Upload & Analyze Clip</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-commander-muted block mb-1">Clip Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Monday sparring - mount escapes"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-commander-muted block mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-commander-muted block mb-1">Session Type</label>
            <select value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
              {["BJJ Foundations", "MMA Wrestling", "No-Gi", "Masters Class", "Open Mat"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Image upload for AI */}
        <div>
          <label className="text-xs text-commander-muted block mb-1">Screenshot / Frame for AI Analysis <span className="text-commander-red">*</span></label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-commander-border rounded-xl cursor-pointer hover:border-commander-red transition-all bg-gray-900">
            <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
            {imageFile ? (
              <div className="text-center px-3">
                <p className="text-green-400 text-sm font-semibold">✓ {imageFile.name}</p>
                <p className="text-commander-muted text-xs mt-0.5">Image ready for AI analysis</p>
              </div>
            ) : (
              <div className="text-center">
                <Target className="w-6 h-6 text-commander-muted mx-auto mb-1" />
                <p className="text-commander-muted text-xs">Upload a screenshot for AI posture analysis</p>
              </div>
            )}
          </label>
        </div>

        {/* Optional video upload */}
        <div>
          <label className="text-xs text-commander-muted block mb-1">Full Video Clip (optional)</label>
          <label className="flex items-center gap-3 w-full border border-commander-border rounded-xl px-3 py-3 cursor-pointer hover:border-blue-600 transition-all bg-gray-900">
            <input type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
            <Upload className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm text-commander-muted truncate">{videoFile ? videoFile.name : "Attach video file..."}</span>
          </label>
        </div>

        <button
          onClick={handleUploadAndAnalyze}
          disabled={uploading || analyzing}
          className="w-full bg-commander-red text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-60"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing...</>
          ) : (
            <><Zap className="w-4 h-4" /> Upload & Run AI Analysis</>
          )}
        </button>
        <p className="text-commander-muted text-xs text-center">AI will tag techniques & score your posture alignment</p>
      </div>

      {/* Clips List */}
      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-24 bg-commander-surface rounded-xl animate-pulse border border-commander-border" />)}</div>
      ) : clips.length === 0 ? (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <Play className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">No clips yet. Upload your first sparring clip to get AI coaching insights.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Your Film Library</p>
          {clips.map(clip => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
    </div>
  );
}