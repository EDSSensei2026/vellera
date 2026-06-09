import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "../components/BackButton";


import { CheckCircle, Play } from "lucide-react";
import { toast } from "sonner";

export default function TrainingHub() {
  const [curricula, setCurricula] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
    base44.entities.Training_Curriculum.list("order", 100).then(setCurricula);
  }, []);

  useEffect(() => {
    if (!user || !curricula.length) return;
    Promise.all(
      curricula.map(c =>
        base44.entities.Curriculum_Progress.filter({
          curriculum_id: c.id,
          user_email: user.email,
        })
      )
    ).then(results => {
      const merged = [];
      results.forEach((r, i) => {
        merged.push({ curriculum_id: curricula[i].id, ...r[0] });
      });
      setProgress(merged);
      setLoading(false);
    });
  }, [user, curricula]);

  const selectCurriculum = (c) => {
    setSelected(c);
  };

  const submitAssessment = async () => {
    if (!selected || !user || assessmentScore === "") return;
    const numScore = parseInt(assessmentScore);
    if (numScore < 0 || numScore > 100) {
      toast.error("Score must be between 0-100");
      return;
    }

    const existing = progress.find(p => p.curriculum_id === selected.id);
    if (existing && existing.id) {
      await base44.entities.Curriculum_Progress.update(existing.id, {
        completion_status: "Finished",
        assessment_score: numScore,
        completed_date: new Date().toISOString().split("T")[0],
      });
    } else {
      await base44.entities.Curriculum_Progress.create({
        curriculum_id: selected.id,
        user_email: user.email,
        completion_status: "Finished",
        assessment_score: numScore,
        started_date: new Date().toISOString().split("T")[0],
        completed_date: new Date().toISOString().split("T")[0],
      });
    }
    setProgress(prev => {
      const idx = prev.findIndex(p => p.curriculum_id === selected.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], completion_status: "Finished", assessment_score: numScore };
        return updated;
      }
      return prev;
    });
    toast.success("Assessment recorded!");
    setAssessmentOpen(false);
    setAssessmentScore("");
  };

  const p = selected ? progress[selected.id] : null;
  const isFinished = p?.completion_status === "Finished";

  return (
    <div className="p-4 max-w-7xl mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2 mb-6">
        <BackButton to="/" />
        <h1 className="text-white text-2xl font-black tracking-tight">Training Hub</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen max-h-[600px]">
        {/* Left: Curriculum List */}
        <div className="lg:col-span-1 bg-commander-surface border border-commander-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-commander-border">
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Available Modules</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : curricula.length === 0 ? (
              <p className="text-commander-muted text-sm p-4">No modules available yet.</p>
            ) : (
              curricula.map(c => {
                const prog = progress.find(p => p.curriculum_id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCurriculum(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-all transform hover:scale-105 ${
                      selected?.id === c.id
                        ? "border-commander-red bg-red-950 shadow-lg"
                        : "border-commander-border bg-gray-800 hover:border-commander-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-white text-sm font-semibold flex-1">{c.title}</p>
                      {prog?.completion_status === "Finished" && (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {prog && (
                      <div className="text-xs text-commander-muted">
                        {prog.completion_status === "Finished"
                          ? `Score: ${prog.assessment_score}%`
                          : "Not started"}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Module Details */}
        <div className="lg:col-span-2 bg-commander-surface border border-commander-border rounded-xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-commander-muted text-center">Select a module to begin</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-commander-border">
                <h2 className="text-white font-bold">{selected.title}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Video */}
                {selected.video_url && (
                  <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
                    <iframe
                      src={selected.video_url.includes("youtube.com") || selected.video_url.includes("youtu.be")
                        ? `https://www.youtube.com/embed/${selected.video_url.split("v=")[1] || selected.video_url.split("/").pop()}`
                        : selected.video_url}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selected.title}
                    />
                  </div>
                )}

                {/* Syllabus */}
                {selected.syllabus && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-commander-border">
                    <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Syllabus</p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selected.syllabus}</p>
                  </div>
                )}

                {/* Description */}
                {selected.description && (
                  <div>
                    <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Overview</p>
                    <p className="text-white text-sm">{selected.description}</p>
                  </div>
                )}

                {/* Assessment Button */}
                {!isFinished ? (
                  <button
                    onClick={() => {
                      setAssessmentOpen(true);
                      setAssessmentScore("");
                    }}
                    className="w-full bg-commander-red text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all mt-4 min-h-[44px]"
                  >
                    <Play className="w-4 h-4" />
                    Take Assessment
                  </button>
                ) : (
                  <div className="w-full bg-green-950/30 border border-green-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-bold">Module Complete</span>
                    </div>
                    <span className="text-green-400 font-bold text-lg">{p.assessment_score}%</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}