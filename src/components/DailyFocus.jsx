import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Target, Flame } from "lucide-react";

export default function DailyFocus() {
  const [technique, setTechnique] = useState(null);

  useEffect(() => {
    base44.entities.Technique.list("-last_drilled", 50).then(techs => {
      if (!techs.length) return;
      // Find technique with oldest (or missing) last_drilled date
      const sorted = [...techs].sort((a, b) => {
        if (!a.last_drilled) return -1;
        if (!b.last_drilled) return 1;
        return a.last_drilled.localeCompare(b.last_drilled);
      });
      setTechnique(sorted[0]);
    });
  }, []);

  if (!technique) return null;

  const daysSince = technique.last_drilled
    ? Math.floor((Date.now() - new Date(technique.last_drilled)) / 86400000)
    : null;

  return (
    <div className="bg-gradient-to-r from-red-950/60 to-commander-surface border border-commander-red rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 bg-commander-red rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Target className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs text-commander-red uppercase tracking-widest font-bold">Daily Focus</p>
          {daysSince !== null && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
              {daysSince === 0 ? "drilled today" : `${daysSince}d ago`}
            </span>
          )}
          {daysSince === null && (
            <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">never drilled</span>
          )}
        </div>
        <p className="text-white font-bold text-sm">{technique.name}</p>
        <p className="text-commander-muted text-xs mt-0.5">{technique.category}</p>
        {technique.description && (
          <p className="text-white/60 text-xs mt-1 leading-relaxed line-clamp-2">{technique.description}</p>
        )}
      </div>
      <Flame className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
    </div>
  );
}