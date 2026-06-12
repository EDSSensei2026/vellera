import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Calendar, Clock } from "lucide-react";

export default function ActivityFeed({ sessions }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkoutTitles = async () => {
      try {
        const workoutIds = [...new Set(sessions.map((s) => s.workout_id))];
        const catalogItems = await Promise.all(
          workoutIds.map((id) => base44.entities.Workout_Catalog.filter({ id }))
        );
        const idToTitle = {};
        catalogItems.forEach((items) => {
          if (items.length > 0) {
            idToTitle[items[0].id] = items[0].title;
          }
        });
        setWorkouts(idToTitle);
      } catch (err) {
        console.error("Failed to load workout titles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutTitles();
  }, [sessions]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
      <p className="text-xs text-commander-muted uppercase tracking-widest mb-4 font-bold">Recent Activity</p>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-commander-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vellera-blue/20 flex items-center justify-center">
              <span className="text-vellera-blue text-sm font-bold">✓</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {workouts[session.workout_id] || "Workout"}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-commander-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(session.date_completed)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(session.total_time_spent)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}