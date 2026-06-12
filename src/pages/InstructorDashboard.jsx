import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, MessageSquare, ChevronRight } from "lucide-react";
import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";

export default function InstructorDashboard() {
  const [instructor, setInstructor] = useState(null);

  // Fetch user's instructor profile
  useEffect(() => {
    base44.entities.Instructor.filter({}).then(res => {
      if (res.length > 0) setInstructor(res[0]);
    });
  }, []);

  // Fetch all students for this instructor
  const { data: students = [] } = useQuery({
    queryKey: ["students", instructor?.id],
    queryFn: () => base44.entities.StudentProfile.filter({ instructor_id: instructor?.id }),
    enabled: !!instructor?.id,
  });

  // Fetch all programs for this instructor
  const { data: programs = [] } = useQuery({
    queryKey: ["programs", instructor?.id],
    queryFn: () => base44.entities.TrainingProgram.filter({ instructor_id: instructor?.id }),
    enabled: !!instructor?.id,
  });

  // Fetch recent feedback given
  const { data: recentFeedback = [] } = useQuery({
    queryKey: ["feedback", instructor?.id],
    queryFn: () => base44.entities.StudentFeedback.filter({ instructor_id: instructor?.id }),
    enabled: !!instructor?.id,
  });

  if (!instructor) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-24 space-y-4">
        <BackButton to="/" />
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-commander-muted mx-auto mb-3" />
          <p className="text-white font-bold mb-2">No Instructor Profile Found</p>
          <p className="text-commander-muted text-sm mb-4">Create your instructor account to start managing students.</p>
          <Link to="/settings" className="inline-block bg-commander-red text-white px-4 py-2 rounded-lg font-medium text-sm">
            Setup Instructor Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-4 safe-area-top">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black">Instructor Hub</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-commander-surface to-gray-800 border border-commander-border rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-commander-red rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎓</span>
          </div>
          <div>
            <p className="text-white font-bold">{instructor.display_name}</p>
            <p className="text-commander-muted text-xs">{instructor.specialty}</p>
            {instructor.hourly_rate_usd && (
              <p className="text-green-400 text-xs font-bold mt-1">${instructor.hourly_rate_usd}/hr</p>
            )}
          </div>
        </div>
        {instructor.bio && <p className="text-white text-xs">{instructor.bio}</p>}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center min-h-[80px] flex flex-col items-center justify-center">
          <p className="text-white font-black text-2xl">{students.length}</p>
          <p className="text-commander-muted text-xs">Students</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center min-h-[80px] flex flex-col items-center justify-center">
          <p className="text-commander-red font-black text-2xl">{programs.length}</p>
          <p className="text-commander-muted text-xs">Programs</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center min-h-[80px] flex flex-col items-center justify-center">
          <p className="text-yellow-400 font-black text-2xl">{recentFeedback.slice(0, 7).length}</p>
          <p className="text-commander-muted text-xs">This Week</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Link to="/instructor/students" className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center justify-between hover:border-commander-red transition-all">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-commander-muted" />
            <div>
              <p className="text-white font-semibold text-sm">Manage Students</p>
              <p className="text-commander-muted text-xs">Roster, assignments, feedback</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>

        <Link to="/instructor/programs" className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center justify-between hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-semibold text-sm">Training Programs</p>
              <p className="text-commander-muted text-xs">Create & assign regimens</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>

        <Link to="/instructor/feedback" className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center justify-between hover:border-yellow-500 transition-all">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white font-semibold text-sm">Give Feedback</p>
              <p className="text-commander-muted text-xs">Technique, progress, guidance</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </Link>
      </div>

      {/* Recent Feedback Activity */}
      {recentFeedback.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Recent Feedback</p>
          <div className="space-y-2">
            {recentFeedback.slice(0, 3).map(fb => (
              <div key={fb.id} className="flex items-start gap-2 pb-2 border-b border-gray-700 last:border-0">
                <span className="text-lg flex-shrink-0">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">{fb.feedback_type}</p>
                  <p className="text-commander-muted text-xs truncate">{fb.content}</p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(fb.created_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Roster Preview */}
      {students.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Your Students</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {students.slice(0, 5).map(student => (
              <Link key={student.id} to={`/instructor/student/${student.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-all">
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{student.student_name}</p>
                  <p className="text-commander-muted text-xs">{student.specialty} • {student.current_belt}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-commander-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}