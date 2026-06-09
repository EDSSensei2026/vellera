import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle2, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ZuluWarriorv4() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [todaysFeedback, setTodaysFeedback] = useState(null);
  const [todaysLabSession, setTodaysLabSession] = useState(null);
  const [jointStatus, setJointStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadZuluData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        setUser(currentUser);

        const today = new Date().toISOString().split("T")[0];

        // Fetch today's coach feedback
        const feedbackList = await base44.entities.CoachFeedback.filter({
          athlete_email: currentUser.email,
          session_date: today,
        });

        if (feedbackList.length > 0) {
          setTodaysFeedback(feedbackList[0]);
        }

        // Fetch today's lab session
        const labList = await base44.entities.LabSession.filter({
          athlete_email: currentUser.email,
          session_date: today,
        });

        if (labList.length > 0) {
          setTodaysLabSession(labList[0]);
        }

        // Check joint integrity
        const jointCheck = await base44.functions.invoke("jointIntegrityCheck", {
          athlete_email: currentUser.email,
        });

        setJointStatus(jointCheck.data);
      } catch (err) {
        console.error("Failed to load Zulu v4 data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadZuluData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const dayOfWeek = new Date().getDay();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = dayNames[dayOfWeek];

  // Weekly split with Lab integration
  const weeklySchedule = {
    MON: { am: "The Shield (Weighted Pull/Press)", pm: "BJJ Fundamentals" },
    TUE: { am: "Lab Session w/ Colin", pm: "MMA Striking", isLab: true },
    WED: { am: "Recovery Flow", pm: "Technical BJJ" },
    THU: { am: "The Density (Deadlift/Rows)", pm: "Lab Session w/ Colin", isLab: true },
    FRI: { am: "The Impi (Dips/Landmine)", pm: "BJJ Live Rolling" },
    SAT: { am: "Sprints / Field Work", pm: "Open Mat" },
    SUN: { am: "Complete Reset", pm: "Rest" },
  };

  const todaySchedule = weeklySchedule[today] || {};
  const coachedToday = todaySchedule.isLab;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-2xl font-black">Zulu Warrior v4.0</h1>
        <span className="text-vellera-green text-xs font-bold">+ Colin Eaton</span>
      </div>

      {/* Coach Integration Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-300 font-bold text-sm">Coach Integrated</p>
            <p className="text-purple-200 text-xs mt-1">
              Colin Eaton has Editor access. Lab programming + live adjustments active.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold">Today ({today})</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold flex-1">AM:</span>
            <span className="text-gray-300">{todaySchedule.am || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold flex-1">PM:</span>
            <span className="text-gray-300">{todaySchedule.pm || "—"}</span>
          </div>
        </div>

        {coachedToday && todaysLabSession && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 mt-3">
            <p className="text-green-300 text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Lab Session Scheduled
            </p>
            <p className="text-green-200 text-xs mt-1">
              {todaysLabSession.primary_focus} | Colin will adjust PM based on performance
            </p>
          </div>
        )}
      </div>

      {/* Joint Integrity Alerts */}
      {jointStatus?.alerts && jointStatus.alerts.length > 0 && (
        <div className="space-y-2">
          {jointStatus.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 ${
                alert.startsWith("⚠️")
                  ? "bg-red-900/20 border-red-700"
                  : "bg-yellow-900/20 border-yellow-700"
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  alert.startsWith("⚠️") ? "text-red-300" : "text-yellow-300"
                }`}
              >
                {alert}
              </p>
            </div>
          ))}
        </div>
      )}

      {jointStatus?.cleared_for_heavy_lift && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-300 font-bold text-sm">Joint Clearance: FULL</p>
            <p className="text-green-200 text-xs mt-1">All systems go for AM heavy programming.</p>
          </div>
        </div>
      )}

      {/* Today's Coach Feedback (if available) */}
      {todaysFeedback && (
        <div className="bg-commander-surface border border-vellera-blue rounded-xl p-4 space-y-3">
          <p className="text-vellera-blue font-bold text-sm">Coach's Feedback</p>
          {todaysFeedback.coach_notes && (
            <p className="text-gray-300 text-sm">{todaysFeedback.coach_notes}</p>
          )}
          {todaysFeedback.recommended_adjustments &&
            todaysFeedback.recommended_adjustments.length > 0 && (
              <div className="space-y-2">
                <p className="text-commander-muted text-xs uppercase font-bold">Adjustments</p>
                {todaysFeedback.recommended_adjustments.map((adj, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-2 text-xs">
                    <span className="text-white font-semibold">{adj.exercise}:</span>
                    <span className="text-gray-300 ml-1">{adj.adjustment}</span>
                  </div>
                ))}
              </div>
            )}
          {todaysFeedback.next_session_override && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-2 text-xs">
              <p className="text-yellow-300 font-bold">Next AM Override: {todaysFeedback.next_session_override}</p>
            </div>
          )}
        </div>
      )}

      {/* Weekly Schedule Grid */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-commander-muted text-xs uppercase font-bold">This Week (Lab Integrated)</p>
        <div className="space-y-2 text-xs">
          {Object.entries(weeklySchedule).map(([day, schedule]) => (
            <div key={day} className={`rounded-lg p-2 ${day === today ? "bg-vellera-blue/20 border border-vellera-blue" : "bg-gray-800/50"}`}>
              <p className="text-white font-bold">{day}</p>
              <p className="text-gray-300 text-xs mt-0.5">AM: {schedule.am}</p>
              <p className="text-gray-300 text-xs">PM: {schedule.pm}</p>
              {schedule.isLab && <p className="text-vellera-green text-xs font-bold mt-1">🏋️ Lab Session (Colin Coaches)</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Shred Status */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
        <p className="text-vellera-green font-bold text-sm">Zulu Shred: 260 → 225 lbs</p>
        <p className="text-commander-muted text-xs">260g Protein/day. Coach-monitored deficit. 16:8 IF (12PM–8PM).</p>
        <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
          <div className="bg-vellera-green h-2 rounded-full" style={{ width: "35%" }} />
        </div>
        <p className="text-xs text-commander-muted mt-1">35% complete. ~9 weeks remaining @ 1.5 lbs/week loss.</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-3">
        <p className="text-blue-300 text-xs font-bold">HOW IT WORKS</p>
        <ul className="text-blue-200 text-xs mt-2 space-y-1 list-disc list-inside">
          <li>Lab days: Colin adjusts your PM intensity + next AM if needed</li>
          <li>High intensity sessions auto-trigger next AM recovery mode</li>
          <li>Weekly joint checks prevent injury before heavy lifts</li>
          <li>Protein tracked daily; Colin monitors fat loss without strength loss</li>
        </ul>
      </div>
    </div>
  );
}