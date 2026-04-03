import { useState } from "react";
import { X, Play, AlertCircle } from "lucide-react";

export default function MovementGuide({ exercise, onClose }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-commander-dark border border-commander-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-commander-surface border-b border-commander-border p-4 flex items-center justify-between">
          <h2 className="text-white font-black text-lg">{exercise.exercise_name}</h2>
          <button onClick={onClose} className="text-commander-muted hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Category Badge */}
          <div className="inline-block">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              exercise.category === "Forge" ? "bg-blue-900/50 text-blue-300" :
              exercise.category === "Charge" ? "bg-green-900/50 text-green-300" :
              exercise.category === "Combat" ? "bg-red-900/50 text-red-300" :
              "bg-purple-900/50 text-purple-300"
            }`}>
              {exercise.category}
            </span>
          </div>

          {/* Image */}
          {exercise.image_url && (
            <div className="rounded-xl overflow-hidden bg-gray-900 h-64 flex items-center justify-center">
              <img src={exercise.image_url} alt={exercise.exercise_name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* App Prompt (Primary Cue) */}
          <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-lg p-3">
            <p className="text-vellera-blue text-sm font-bold">💡 Form Cue</p>
            <p className="text-gray-300 text-sm mt-1">{exercise.app_prompt}</p>
          </div>

          {/* Video Button */}
          {exercise.video_url && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="w-full bg-vellera-green/20 border border-vellera-green text-vellera-green py-2 px-3 rounded-lg font-semibold text-sm hover:bg-vellera-green/30 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Watch Form Video ({exercise.video_duration_seconds || 30}s)
            </button>
          )}

          {/* Video Embed */}
          {showVideo && exercise.video_url && (
            <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={exercise.video_url}
                title={exercise.exercise_name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Form Checkpoints */}
          {exercise.form_cues && exercise.form_cues.length > 0 && (
            <div className="space-y-2">
              <p className="text-white text-sm font-bold">✓ Form Checkpoints</p>
              <ul className="space-y-1">
                {exercise.form_cues.map((cue, idx) => (
                  <li key={idx} className="text-gray-300 text-xs flex items-start gap-2">
                    <span className="text-vellera-green font-bold mt-0.5">•</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breathing */}
          {exercise.breathing_cue && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-300 text-sm"><strong>🫁 Breathing:</strong> {exercise.breathing_cue}</p>
            </div>
          )}

          {/* Safety Notes */}
          {exercise.safety_notes && exercise.safety_notes.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3">
              <p className="text-orange-300 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Safety & Injury Prevention
              </p>
              <ul className="space-y-1 mt-2">
                {exercise.safety_notes.map((note, idx) => (
                  <li key={idx} className="text-orange-200 text-xs flex items-start gap-2">
                    <span className="font-bold mt-0.5">⚠️</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BJJ Carryover */}
          {exercise.bjj_carryover && (
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
              <p className="text-purple-300 text-sm font-bold">🥋 BJJ Carry-Over</p>
              <p className="text-purple-200 text-xs mt-1">{exercise.bjj_carryover}</p>
            </div>
          )}

          {/* Progression */}
          {exercise.progression_notes && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <p className="text-blue-300 text-sm font-bold">📈 Progression</p>
              <p className="text-blue-200 text-xs mt-1">{exercise.progression_notes}</p>
            </div>
          )}

          {/* Muscle Groups */}
          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {exercise.muscle_groups.map((muscle, idx) => (
                <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {muscle}
                </span>
              ))}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-all mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}