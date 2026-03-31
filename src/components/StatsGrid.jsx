import { Flame, Clock, CheckCircle, Zap } from "lucide-react";

export default function StatsGrid({ streak = 0, totalTime = 0, workoutsCompleted = 0, combatRounds = 0 }) {
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const stats = [
    { label: "Current Streak", value: `${streak}`, unit: "days", icon: Flame, color: "text-orange-400" },
    { label: "Total Time", value: formatTime(totalTime), unit: "", icon: Clock, color: "text-cyan-400" },
    { label: "Workouts", value: workoutsCompleted, unit: "completed", icon: CheckCircle, color: "text-green-400" },
    { label: "Combat Rounds", value: combatRounds, unit: "rounds", icon: Zap, color: "text-vellera-blue" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-commander-surface border border-commander-border rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px]"
          >
            <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <p className="text-white font-black text-2xl">{stat.value}</p>
            <p className="text-commander-muted text-xs mt-1">{stat.label}</p>
            {stat.unit && <p className="text-commander-muted text-xs">{stat.unit}</p>}
          </div>
        );
      })}
    </div>
  );
}