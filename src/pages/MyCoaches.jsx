import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrackBadge from "../components/TrackBadge";

export default function MyCoaches() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoaches = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        // Fetch student profiles for this user to find their coaches
        const studentProfiles = await base44.entities.StudentProfile.filter({
          student_email: currentUser.email,
        });

        if (studentProfiles.length > 0) {
          // Get instructor details for each student profile
          const instructorIds = [...new Set(studentProfiles.map(s => s.instructor_id))];
          const instructorList = await Promise.all(
            instructorIds.map(id => base44.entities.Instructor.filter({ id }))
          );
          setCoaches(instructorList.flat());
        }
      } catch (err) {
        console.error("Failed to load coaches:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCoaches();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-xl font-black">My Coaches</h1>
      </div>

      {coaches.length === 0 ? (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center space-y-4">
          <p className="text-commander-muted">You don't have any coaches yet.</p>
          <button
            onClick={() => navigate("/instructor")}
            className="w-full bg-vellera-blue text-commander-dark font-bold py-2 rounded-lg hover:bg-vellera-green transition-all text-sm"
          >
            Find a Coach
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {coaches.map((coach) => (
            <div key={coach.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                {coach.profile_photo_url && (
                  <img src={coach.profile_photo_url} alt={coach.display_name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="text-white font-bold">{coach.display_name}</p>
                  <TrackBadge track={coach.specialty?.toLowerCase() || "strength"} size="xs" />
                  {coach.bio && <p className="text-commander-muted text-xs mt-1">{coach.bio.substring(0, 60)}...</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-vellera-blue/20 border border-vellera-blue text-vellera-blue rounded-lg py-2 px-3 font-semibold text-sm hover:bg-vellera-blue/40 transition-all flex items-center justify-center gap-2 min-h-[40px]">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
                <button className="flex-1 bg-vellera-green/20 border border-vellera-green text-vellera-green rounded-lg py-2 px-3 font-semibold text-sm hover:bg-vellera-green/40 transition-all flex items-center justify-center gap-2 min-h-[40px]">
                  <FileText className="w-4 h-4" /> Feedback
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}