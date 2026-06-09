import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Users, MessageSquare, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrackBadge from "../components/TrackBadge";

export default function CoachHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const loadCoachData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        // Check if user is an instructor
        const instructors = await base44.entities.Instructor.filter({
          created_by: currentUser.email,
        });

        if (instructors.length === 0) {
          // Option to create instructor profile
          setInstructorProfile(null);
        } else {
          setInstructorProfile(instructors[0]);

          // Fetch students for this instructor
          const studentProfiles = await base44.entities.StudentProfile.filter({
            instructor_id: instructors[0].id,
          });
          setStudents(studentProfiles);
        }
      } catch (err) {
        console.error("Failed to load coach data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCoachData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!instructorProfile) {
    return (
      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="text-commander-muted hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-xl font-black">Coach Hub</h1>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Create Your Coach Profile</h2>
          <p className="text-commander-muted text-sm">Start managing your students, programs, and feedback in one place.</p>
          <button
            onClick={() => navigate("/instructor")}
            className="w-full bg-vellera-blue text-commander-dark font-bold py-3 rounded-lg hover:bg-vellera-green transition-all"
          >
            Set Up Coach Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="text-commander-muted hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white text-xl font-black">Coach Hub</h1>
        </div>
      </div>

      {/* Coach Profile */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          {instructorProfile.profile_photo_url && (
            <img src={instructorProfile.profile_photo_url} alt={instructorProfile.display_name} className="w-16 h-16 rounded-lg object-cover" />
          )}
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{instructorProfile.display_name}</h2>
            <TrackBadge track={instructorProfile.specialty?.toLowerCase() || "strength"} size="sm" />
            <p className="text-commander-muted text-xs mt-2">{instructorProfile.total_students || 0} Students</p>
          </div>
        </div>
        {instructorProfile.bio && <p className="text-gray-300 text-sm">{instructorProfile.bio}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-commander-border">
        {[
          { id: "students", label: "👥 Students", icon: Users },
          { id: "messages", label: "💬 Messages", icon: MessageSquare },
          { id: "feedback", label: "📝 Feedback", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? "text-vellera-blue border-b-2 border-vellera-blue"
                : "text-commander-muted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">Your Students</h3>
            <button className="bg-vellera-blue text-commander-dark rounded-lg p-2 hover:bg-vellera-green transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {students.length === 0 ? (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
              <p className="text-commander-muted">No students yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold">{student.student_name}</p>
                      <p className="text-commander-muted text-xs">{student.student_email}</p>
                    </div>
                    <TrackBadge track={student.fitness_path || "strength"} size="xs" />
                  </div>
                  <div className="flex gap-2 text-xs text-commander-muted">
                    <span>Belt: {student.current_belt || "N/A"}</span>
                    <span>•</span>
                    <span>Since {student.start_date}</span>
                  </div>
                  <button className="text-vellera-blue text-sm font-semibold hover:text-vellera-green transition-all">
                    View Profile →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-commander-muted mb-3 opacity-50" />
          <p className="text-commander-muted">Messaging coming soon. Send feedback now via Feedback tab.</p>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          <h3 className="text-white font-bold">Recent Feedback</h3>
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-commander-muted mb-3 opacity-50" />
            <p className="text-commander-muted text-sm">No feedback yet. Share progress updates with your students.</p>
            <button className="mt-4 bg-vellera-blue text-commander-dark font-bold py-2 px-4 rounded-lg hover:bg-vellera-green transition-all">
              Send Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}