import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import BackButton from "../components/BackButton";
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export default function StudentFeedbackCenter() {
  const [studentProfile, setStudentProfile] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  // Fetch student profile
  const { data: profile } = useQuery({
    queryKey: ["student_profile"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const sp = await base44.entities.StudentProfile.filter({ student_email: user.email });
      return sp[0] || null;
    },
  });

  useEffect(() => {
    if (profile) setStudentProfile(profile);
  }, [profile]);

  // Fetch feedback for this student
  const { data: feedbackData = [] } = useQuery({
    queryKey: ["student_feedback", studentProfile?.id],
    queryFn: () => {
      if (!studentProfile?.id) return [];
      return base44.entities.StudentFeedback.filter({
        student_id: studentProfile.id,
        is_visible_to_student: true,
      });
    },
    enabled: !!studentProfile?.id,
  });

  useEffect(() => {
    if (feedbackData) setFeedbacks(feedbackData);
  }, [feedbackData]);

  if (!studentProfile) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
        <div className="flex items-center gap-2 mb-4">
          <BackButton to="/" />
          <h1 className="text-white text-xl font-black">Feedback from Instructor</h1>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">You're not yet connected to an instructor. Ask your coach to add you as a student.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black">Coaching Feedback</h1>
      </div>

      {/* Instructor Info */}
      {studentProfile.instructor_name && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Your Instructor</p>
          <p className="text-white font-bold text-lg">{studentProfile.instructor_name}</p>
          <p className="text-commander-muted text-xs">{studentProfile.specialty}</p>
          {studentProfile.current_program_id && (
            <p className="text-blue-400 text-xs mt-2">📋 Active Program Assigned</p>
          )}
        </div>
      )}

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-bold text-lg">{studentProfile.current_belt}</p>
          <p className="text-commander-muted text-xs">Current Belt / Rank</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-white font-bold text-lg">{feedbacks.length}</p>
          <p className="text-commander-muted text-xs">Feedbacks Received</p>
        </div>
      </div>

      {/* Feedback Cards */}
      {feedbacks.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Recent Feedback from {studentProfile.instructor_name}</p>
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-commander-red font-bold text-xs uppercase">{fb.feedback_type}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(fb.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  fb.rating >= 4 ? "bg-green-900 text-green-300" :
                  fb.rating >= 3 ? "bg-yellow-900 text-yellow-300" :
                  "bg-red-900 text-red-300"
                }`}>
                  ⭐ {fb.rating}/5
                </div>
              </div>

              <p className="text-white text-sm leading-relaxed">{fb.content}</p>

              {fb.areas_of_strength?.length > 0 && (
                <div className="bg-green-950/30 border border-green-800 rounded-lg p-2">
                  <p className="text-green-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Areas of Strength
                  </p>
                  <ul className="text-green-300 text-xs mt-1 space-y-0.5">
                    {fb.areas_of_strength.map((area, i) => (
                      <li key={i}>• {area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {fb.areas_to_improve?.length > 0 && (
                <div className="bg-yellow-950/30 border border-yellow-800 rounded-lg p-2">
                  <p className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Areas to Improve
                  </p>
                  <ul className="text-yellow-300 text-xs mt-1 space-y-0.5">
                    {fb.areas_to_improve.map((area, i) => (
                      <li key={i}>• {area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {fb.action_items?.length > 0 && (
                <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-2">
                  <p className="text-blue-400 text-xs font-bold">📝 Action Items</p>
                  <ul className="text-blue-300 text-xs mt-1 space-y-0.5">
                    {fb.action_items.map((item, i) => (
                      <li key={i}>□ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <MessageSquare className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">No feedback yet. Keep training and your instructor will review your progress!</p>
        </div>
      )}
    </div>
  );
}