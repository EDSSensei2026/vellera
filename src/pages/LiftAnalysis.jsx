import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import BackButton from "../components/BackButton";
import { Upload, Loader, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

const EXERCISES = [
  "Squat", "Bench Press", "Deadlift", "Overhead Press", "Barbell Row",
  "Barbell Curl", "Tricep Extension", "Leg Press", "Hack Squat", "Machine Leg Press"
];

import { useEffect } from "react";

export default function LiftAnalysis() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const [exercise, setExercise] = useState("Squat");
  const [fileInput, setFileInput] = useState(null);

  const seedDemoData = async () => {
    try {
      const result = await base44.functions.invoke('seedExampleVideos', {});
      if (result.data.success) {
        toast.success("Demo videos loaded!");
        loadVideos();
      }
    } catch (err) {
      console.log("Demo data already seeded or error:", err.message);
      loadVideos();
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    setLoading(true);
    try {
      // Upload video file to get URL
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      
      // Create thumbnail by uploading a placeholder (in real app, would extract frame)
      const thumbnailRes = uploadRes;

      // Create LiftVideo record
      const video = await base44.entities.LiftVideo.create({
        exercise_name: exercise,
        video_url: uploadRes.file_url,
        thumbnail_url: thumbnailRes.file_url,
      });

      // Trigger analysis
      setAnalyzing(video.id);
      const analysisRes = await base44.functions.invoke('analyzeLiftForm', {
        video_id: video.id,
        thumbnail_url: thumbnailRes.file_url,
        exercise_name: exercise,
      });

      if (analysisRes.data.success) {
        toast.success(`Analysis complete! Form score: ${analysisRes.data.analysis.form_score}/100`);
        loadVideos();
      }
    } catch (err) {
      toast.error("Upload or analysis failed: " + err.message);
    } finally {
      setLoading(false);
      setAnalyzing(null);
      setFileInput(null);
    }
  };

  const loadVideos = async () => {
    const data = await base44.entities.LiftVideo.list("-created_date", 20);
    setVideos(data);
    setLoading(false);
  };

  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black tracking-tight">Lift Form Analysis</h1>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-yellow-950/20 border border-yellow-800 rounded-lg px-3 py-2">
        <p className="text-xs text-yellow-400 font-medium">⚠️ This AI analysis is informational only and not a substitute for professional coaching. Always consult a certified strength coach for personalized form corrections.</p>
      </div>

      {/* Upload Form */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-white font-bold text-sm">Upload Lift Video</p>

        <div>
          <label className="text-xs text-commander-muted block mb-2">Exercise</label>
          <select value={exercise} onChange={e => setExercise(e.target.value)}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]">
            {EXERCISES.map(ex => <option key={ex}>{ex}</option>)}
          </select>
        </div>

        <label className="block cursor-pointer">
          <input
            type="file"
            accept="video/*"
            onChange={e => handleUpload(e.target.files[0])}
            disabled={loading}
            className="hidden"
            ref={input => setFileInput(input)}
          />
          <div className="border-2 border-dashed border-commander-border rounded-lg p-6 text-center hover:border-commander-red transition-all">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-6 h-6 text-commander-red animate-spin" />
                <p className="text-sm text-commander-muted">Uploading & analyzing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-commander-muted" />
                <p className="text-sm text-white font-medium">Click to upload video</p>
                <p className="text-xs text-commander-muted">MP4, MOV, WebM</p>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Video Analysis Results */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Recent Analyses</p>
          {videos.map(video => (
            <div key={video.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{video.exercise_name}</p>
                  <p className="text-commander-muted text-xs">{new Date(video.created_date).toLocaleDateString()}</p>
                </div>
                {video.analyzed && (
                  <div className={`text-center px-3 py-2 rounded-lg ${video.form_score >= 80 ? "bg-green-900/40 border border-green-700" : video.form_score >= 60 ? "bg-yellow-900/40 border border-yellow-700" : "bg-red-900/40 border border-red-700"}`}>
                    <p className={`text-lg font-black ${video.form_score >= 80 ? "text-green-400" : video.form_score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{video.form_score}</p>
                    <p className="text-xs text-gray-400">Form Score</p>
                  </div>
                )}
              </div>

              {!video.analyzed ? (
                <div className="text-center py-4">
                  <Loader className="w-5 h-5 text-commander-red animate-spin mx-auto mb-2" />
                  <p className="text-xs text-commander-muted">Analyzing form...</p>
                </div>
              ) : (
                <>
                  {/* Technique Errors */}
                  {video.technique_errors && video.technique_errors.length > 0 && (
                    <div>
                      <p className="text-xs text-commander-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-400" /> Technique Issues
                      </p>
                      <div className="space-y-1">
                        {video.technique_errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-300 flex gap-2">
                            <span>•</span> {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Alerts */}
                  {video.safety_alerts && video.safety_alerts.length > 0 && (
                    <div className="bg-red-950/20 border border-red-800 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-400 mb-2">⚠️ Safety Concerns</p>
                      <div className="space-y-1">
                        {video.safety_alerts.map((alert, i) => (
                          <p key={i} className="text-xs text-red-300">{alert}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Tips */}
                  {video.form_tips && video.form_tips.length > 0 && (
                    <div>
                      <p className="text-xs text-commander-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" /> Form Tips
                      </p>
                      <div className="space-y-1">
                        {video.form_tips.map((tip, i) => (
                          <p key={i} className="text-xs text-green-300 flex gap-2">
                            <span>✓</span> {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {video.ai_feedback && (
                    <div className="bg-commander-surface border border-commander-border rounded-lg p-3">
                      <p className="text-xs text-commander-muted mb-1">Summary</p>
                      <p className="text-xs text-white italic">{video.ai_feedback}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">Upload a lift video to get started</p>
        </div>
      )}
    </div>
  );
}