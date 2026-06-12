import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Award, TrendingUp, BookOpen } from "lucide-react";
import BackButton from "../components/BackButton";

export default function StudentProgressTracking() {
  const [studentProfile, setStudentProfile] = useState(null);

  // Fetch user's student profile
  useEffect(() => {
    base44.entities.StudentProfile.filter({}).then(res => {
      if (res.length > 0) setStudentProfile(res[0]);
    });
  }, []);

  // Fetch feedback from instructors
  const { data: feedback = [] } = useQuery({
    queryKey: ["feedback", studentProfile?.id],
    queryFn: () => base44.entities.StudentFeedback.filter({ student_id: studentProfile?.id }),
    enabled: !!studentProfile?.id,
  });

  // Fetch assigned program
  const { data: currentProgram } = useQuery({
    queryKey: ["program", studentProfile?.current_program_id],
    queryFn: () => base44.entities.TrainingProgram.get(studentProfile?.current_program_id),
    enabled: !!studentProfile?.current_program_id,
  });

  if (!studentProfile) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-24 space-y-4">
        <BackButton to="/" />
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <TrendingUp className="w-8 h-8 text-commander-muted mx-auto mb-3" />
          <p className="text-white font-bold mb-2">No Student Profile Found</p>
          <p className="text-commander-muted text-sm">Join a training program or connect with an instructor.</p>
        </div>
      </div>
    );
  }

  const beltProgression = ["White", "Blue", "Purple", "Brown", "Black"];
  const currentBeltIndex = beltProgression.indexOf(studentProfile.current_belt);

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-4 safe-area-top">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black">My Progress</h1>
      </div>

      {/* Student Info Card */}
      <div className="bg-gradient-to-br from-commander-surface to-gray-800 border border-commander-border rounded-xl p-4">
        <p className="text-commander-muted text-xs uppercase tracking-widest mb-2">Training Under</p>
        <p className="text-white font-bold text-lg">{studentProfile.instructor_name || "Unassigned"}</p>
        <p className="text-yellow-400 text-sm font-bold mt-2">{studentProfile.specialty}</p>
      </div>

      {/* Belt Progression (for martial arts) */}
      {beltProgression.includes(studentProfile.current_belt) && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-commander-red" />
            <p className="text-xs text-commander-muted uppercase tracking-widest">Belt Progression</p>
          </div>
          <div className="flex gap-2 items-center">
            {beltProgression.map((belt, idx) => (
              <div key={belt} className="flex-1">
                <div className={`h-3 rounded-full transition-all ${
                  idx <= currentBeltIndex ? "bg-commander-red" : "bg-gray-700"
                }`} />
                <p className={`text-xs text-center mt-1 ${
                  idx <= currentBeltIndex ? "text-white font-bold" : "text-commander-muted"
                }`}>{belt}</p>
              </div>
            ))}
          </div>
          {studentProfile.belt_promotion_date && (
            <p className="text-commander-muted text-xs mt-3">Last promotion: {studentProfile.belt_promotion_date}</p>
          )}
        </div>
      )}

      {/* Current Program */}
      {currentProgram && (
        <div className="bg-commander-surface border border-blue-800 rounded-xl p-4 bg-blue-950/20">
          <div className="flex items-start gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-commander-muted uppercase tracking-widest">Current Program</p>
              <p className="text-white font-bold">{currentProgram.program_name}</p>
            </div>
          </div>
          <p className="text-commander-muted text-xs mb-2">{currentProgram.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800 rounded px-2 py-1">
              <p className="text-commander-muted">Sessions/Week</p>
              <p className="text-white font-bold">{currentProgram.weekly_sessions}</p>
            </div>
            <div className="bg-gray-800 rounded px-2 py-1">
              <p className="text-commander-muted">Duration</p>
              <p className="text-white font-bold">{currentProgram.duration_weeks}w</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback & Guidance */}
      {feedback.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-commander-muted uppercase tracking-widest">Feedback from Coach</p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {feedback.slice(0, 5).map(fb => (
              <div key={fb.id} className="border-l-2 border-yellow-600 pl-3 py-2">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-yellow-400 text-xs font-bold">{fb.feedback_type}</p>
                  {fb.rating && (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < fb.rating ? "text-yellow-400" : "text-gray-600"}>⭐</span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-white text-sm mb-2">{fb.content}</p>

                {fb.areas_of_strength?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-green-400 text-xs font-bold">✓ Strengths:</p>
                    <p className="text-commander-muted text-xs">{fb.areas_of_strength.join(", ")}</p>
                  </div>
                )}

                {fb.areas_to_improve?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-orange-400 text-xs font-bold">→ Work On:</p>
                    <p className="text-commander-muted text-xs">{fb.areas_to_improve.join(", ")}</p>
                  </div>
                )}

                {fb.action_items?.length > 0 && (
                  <div className="bg-gray-800 rounded px-2 py-2 mt-2">
                    <p className="text-blue-400 text-xs font-bold mb-1">Action Items:</p>
                    <ul className="text-commander-muted text-xs space-y-1">
                      {fb.action_items.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span>•</span><span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-gray-600 text-xs mt-2">{new Date(fb.created_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {studentProfile.goals && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Your Goals</p>
          <p className="text-white text-sm">{studentProfile.goals}</p>
          <p className="text-gray-600 text-xs mt-2">Started: {studentProfile.start_date}</p>
        </div>
      )}

      {feedback.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <MessageSquare className="w-8 h-8 text-commander-muted mx-auto mb-3" />
          <p className="text-commander-muted text-sm">No feedback yet. Keep training! Your coach will provide guidance soon.</p>
        </div>
      )}
    </div>
  );
}