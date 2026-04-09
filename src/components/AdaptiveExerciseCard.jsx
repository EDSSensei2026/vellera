import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Accessibility, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const ABILITY_MODIFICATION_MAP = {
  seated_only:      ['seated'],
  limited_mobility: ['seated', 'low_impact', 'wall_supported'],
  post_surgery:     ['low_impact', 'resistance_band', 'seated'],
  chronic_pain:     ['low_impact', 'seated'],
  elderly:          ['low_impact', 'seated', 'wall_supported'],
  pregnancy:        ['low_impact', 'upper_body_only'],
  cardiac:          ['low_impact'],
  full_mobility:    [],
};

/**
 * AdaptiveExerciseCard
 * Wraps any exercise display. Auto-fetches and shows modifications based on
 * the user's user_physical_ability tag. Falls back gracefully if no mods found.
 *
 * Props: { exerciseName, exerciseId, children }
 */
export default function AdaptiveExerciseCard({ exerciseName, exerciseId, children }) {
  const [modifications, setModifications] = useState([]);
  const [showMods, setShowMods] = useState(false);
  const [userAbility, setUserAbility] = useState('full_mobility');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated().catch(() => false);
      if (!authed) { setLoading(false); return; }

      const me = await base44.auth.me().catch(() => null);
      if (!me) { setLoading(false); return; }

      const ability = me.user_physical_ability || 'full_mobility';
      setUserAbility(ability);

      if (ability === 'full_mobility') { setLoading(false); return; }

      const modTypes = ABILITY_MODIFICATION_MAP[ability] || [];
      if (modTypes.length === 0) { setLoading(false); return; }

      // Fetch modifications matching this exercise and ability
      const allMods = await base44.entities.ExerciseModification.filter({
        exercise_name: exerciseName,
      }).catch(() => []);

      const filtered = allMods.filter(m =>
        modTypes.includes(m.modification_type) ||
        (m.ability_tags || []).includes(ability)
      );

      setModifications(filtered);
      if (filtered.length > 0) setShowMods(true); // auto-expand for non-full-mobility
      setLoading(false);
    };
    init();
  }, [exerciseName, exerciseId]);

  const needsMods = userAbility !== 'full_mobility';
  const hasMods   = modifications.length > 0;

  return (
    <div className={`relative ${needsMods && hasMods ? 'border-2 border-vellera-blue/60 rounded-xl' : ''}`}>
      {/* Accessibility indicator badge */}
      {needsMods && (
        <div className="absolute -top-2 -right-2 z-10">
          {hasMods ? (
            <span className="bg-vellera-blue text-black text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <Accessibility className="w-3 h-3" />
              Modified
            </span>
          ) : (
            <span className="bg-yellow-600 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              No Mod
            </span>
          )}
        </div>
      )}

      {/* Original exercise content */}
      {children}

      {/* Modifications panel */}
      {needsMods && hasMods && (
        <div className="mt-2 border-t border-vellera-blue/30">
          <button
            onClick={() => setShowMods(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-vellera-blue hover:bg-vellera-blue/10 transition rounded-b-xl focus-visible:outline-2 focus-visible:outline-vellera-blue"
            aria-expanded={showMods}
            aria-controls={`mods-${exerciseName}`}
          >
            <span className="flex items-center gap-1">
              <Accessibility className="w-3 h-3" />
              {modifications.length} Adaptive Modification{modifications.length > 1 ? 's' : ''} Available
            </span>
            {showMods ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showMods && (
            <div
              id={`mods-${exerciseName}`}
              className="px-3 pb-3 space-y-2"
              role="region"
              aria-label={`Modifications for ${exerciseName}`}
            >
              {modifications.map(mod => (
                <div key={mod.id} className="bg-vellera-blue/10 border border-vellera-blue/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-bold text-xs">{mod.modified_name || mod.exercise_name}</p>
                    <span className="text-xs text-vellera-blue bg-vellera-blue/20 px-2 py-0.5 rounded capitalize">
                      {mod.modification_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{mod.description}</p>
                  {mod.safety_notes?.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {mod.safety_notes.map((note, i) => (
                        <p key={i} className="text-yellow-400 text-xs flex gap-1">
                          <span>⚠</span> {note}
                        </p>
                      ))}
                    </div>
                  )}
                  {mod.intensity_reduction_pct > 0 && (
                    <p className="text-commander-muted text-xs mt-1">
                      Intensity reduced by ~{mod.intensity_reduction_pct}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}