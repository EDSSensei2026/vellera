import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { calculateLSI, batchLSI } from '../lib/lsiScoring';
import WellnessTrendChart from '../components/WellnessTrendChart';
import BackButton from '../components/BackButton';
import { Heart, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SYMPTOM_OPTIONS = ['Swelling', 'Stiffness', 'Instability', 'Fatigue', 'Headache', 'Soreness', 'Tenderness'];

function VASSlider({ id, value, onChange, label, min = 0, max = 10 }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-white text-sm font-bold">{label}</label>
        <span className="text-vellera-blue font-black text-lg">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full accent-vellera-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="flex justify-between text-xs text-commander-muted">
        <span>{min === 0 ? 'None' : 'Poor'}</span>
        <span>{max === 10 ? 'Worst' : 'Excellent'}</span>
      </div>
    </div>
  );
}

export default function WellnessCheckIn() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLSI, setShowLSI] = useState(false);

  // Daily check-in state
  const [painVAS, setPainVAS]         = useState(0);
  const [painLocation, setPainLocation] = useState('');
  const [moodScore, setMoodScore]     = useState(3);
  const [sleepHours, setSleepHours]   = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [fatigue, setFatigue]         = useState(3);
  const [symptoms, setSymptoms]       = useState([]);
  const [notes, setNotes]             = useState('');

  // LSI state
  const [lsiTests, setLsiTests] = useState([
    { name: 'Quadriceps Strength', injured: '', uninjured: '' },
    { name: 'Single-Leg Hop', injured: '', uninjured: '' },
  ]);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const data = await base44.entities.WellnessLog.list('-log_date', 30);
      setLogs(data);
      setLoading(false);
    };
    init();
  }, []);

  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = logs.find(l => l.log_date === today);
    if (existing) { toast.error('Already logged today — edit your existing entry'); return; }

    setSaving(true);
    const readiness = Math.round(((moodScore / 5) * 30) + ((sleepQuality / 5) * 30) + (((10 - painVAS) / 10) * 25) + ((fatigue / 5) * 15));
    await base44.entities.WellnessLog.create({
      user_email:    user.email,
      log_date:      today,
      pain_vas:      painVAS,
      pain_location: painLocation || null,
      mood_score:    moodScore,
      sleep_hours:   sleepHours,
      sleep_quality: sleepQuality,
      fatigue_score: fatigue,
      readiness_score: readiness,
      symptoms,
      notes:         notes || null,
      flagged:       painVAS >= 7,
    });
    const updated = await base44.entities.WellnessLog.list('-log_date', 30);
    setLogs(updated);
    setSaving(false);
    toast.success(`Readiness: ${readiness}% — logged ✓${painVAS >= 7 ? ' ⚠ High pain flagged for clinician review' : ''}`);
  };

  const lsiResult = useMemo_lsi(lsiTests);

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-commander-dark"><Loader2 className="w-8 h-8 animate-spin text-vellera-blue" /></div>;
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-28 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-white text-2xl font-black flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" aria-hidden="true" />
            Daily Wellness Check-In
          </h1>
          <p className="text-commander-muted text-xs mt-0.5">Pain · Mood · Sleep · Readiness</p>
        </div>
      </div>

      {/* Trend Chart */}
      {logs.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
          <p className="text-white font-black text-sm uppercase tracking-wider mb-3">30-Day Wellness Trends</p>
          <WellnessTrendChart logs={logs} metrics={['pain_vas', 'mood_score', 'sleep_quality', 'fatigue_score']} />
        </div>
      )}

      {/* Daily Check-in Form */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-5 space-y-5">
        <p className="text-white font-black text-sm uppercase tracking-wider">Today's Check-In</p>

        <VASSlider id="pain" value={painVAS} onChange={setPainVAS} label={`Pain Level (VAS)`} min={0} max={10} />
        {painVAS > 0 && (
          <div>
            <label htmlFor="pain-location" className="text-xs text-commander-muted uppercase tracking-widest block mb-1.5 font-bold">Pain Location</label>
            <input
              id="pain-location"
              value={painLocation}
              onChange={e => setPainLocation(e.target.value)}
              placeholder="e.g. Left knee, lower back"
              className="w-full bg-commander-dark border border-commander-border rounded-xl px-3 py-2.5 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            />
          </div>
        )}

        <VASSlider id="mood" value={moodScore} onChange={setMoodScore} label="Mood" min={1} max={5} />
        <VASSlider id="sleep-quality" value={sleepQuality} onChange={setSleepQuality} label="Sleep Quality" min={1} max={5} />
        <VASSlider id="fatigue" value={fatigue} onChange={setFatigue} label="Energy Level" min={1} max={5} />

        <div>
          <label htmlFor="sleep-hours" className="text-xs text-commander-muted uppercase tracking-widest block mb-1.5 font-bold">
            Sleep Hours: <span className="text-vellera-blue font-black">{sleepHours}h</span>
          </label>
          <input id="sleep-hours" type="range" min={3} max={12} step={0.5} value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-vellera-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue" />
        </div>

        {/* Symptoms */}
        <div>
          <p className="text-xs text-commander-muted uppercase tracking-widest mb-2 font-bold">Active Symptoms</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Symptom selection">
            {SYMPTOM_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                aria-pressed={symptoms.includes(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue ${
                  symptoms.includes(s) ? 'bg-red-500/30 border-red-500/60 text-red-300' : 'bg-commander-dark border-commander-border text-commander-muted hover:border-gray-500'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="wellness-notes" className="text-xs text-commander-muted uppercase tracking-widest block mb-1.5 font-bold">Notes</label>
          <textarea id="wellness-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full bg-commander-dark border border-commander-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-commander-muted resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            placeholder="Anything else to note today?" />
        </div>

        {painVAS >= 7 && (
          <div role="alert" className="bg-red-950/30 border border-red-700/50 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
            <p className="text-red-400 text-xs font-semibold">High pain score — this entry will be flagged for clinician review.</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-vellera-green text-black font-black rounded-xl hover:opacity-90 transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellera-green"
        >
          {saving ? 'Saving...' : 'Submit Check-In'}
        </button>
      </div>

      {/* LSI Calculator */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowLSI(f => !f)}
          className="w-full flex items-center justify-between p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
          aria-expanded={showLSI}
        >
          <div>
            <p className="text-white font-black text-sm uppercase tracking-wider">LSI Calculator</p>
            <p className="text-commander-muted text-xs">Limb Symmetry Index — Return-to-Play</p>
          </div>
          <span className="text-commander-muted text-xs">{showLSI ? '▲' : '▼'}</span>
        </button>

        {showLSI && (
          <div className="px-4 pb-4 space-y-4 border-t border-commander-border pt-4">
            {lsiTests.map((test, i) => (
              <div key={i} className="space-y-2">
                <p className="text-white text-sm font-bold">{test.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  {['injured', 'uninjured'].map(side => (
                    <div key={side}>
                      <label htmlFor={`lsi-${i}-${side}`} className="text-xs text-commander-muted capitalize block mb-1">{side} limb</label>
                      <input
                        id={`lsi-${i}-${side}`}
                        type="number"
                        min="0"
                        value={test[side]}
                        onChange={e => {
                          const next = [...lsiTests];
                          next[i] = { ...next[i], [side]: e.target.value };
                          setLsiTests(next);
                        }}
                        className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                {test.injured && test.uninjured && Number(test.uninjured) > 0 && (() => {
                  const r = calculateLSI(Number(test.injured), Number(test.uninjured));
                  return (
                    <div className={`rounded-xl border px-3 py-2 flex items-center justify-between ${r.bg}`}>
                      <p className={`text-sm font-bold ${r.color}`}>{r.percentage}</p>
                      <p className={`text-xs font-bold ${r.color}`}>{r.label}</p>
                    </div>
                  );
                })()}
              </div>
            ))}
            {lsiResult && (
              <div className={`rounded-xl border px-4 py-3 ${lsiResult.overall_risk === 'CLEARED' ? 'bg-vellera-green/20 border-vellera-green/40' : lsiResult.overall_risk === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-red-500/20 border-red-500/40'}`}>
                <p className="text-commander-muted text-xs uppercase tracking-wider">Composite LSI</p>
                <p className={`text-2xl font-black ${lsiResult.overall_risk === 'CLEARED' ? 'text-vellera-green' : lsiResult.overall_risk === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {lsiResult.composite_percentage}
                </p>
                <p className="text-white text-xs font-bold mt-0.5">{lsiResult.rtp_cleared ? '✓ Cleared for Return-to-Play' : '⚠ Not yet cleared for Return-to-Play'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Local memoization helper to avoid useState for derived values
function useMemo_lsi(tests) {
  try {
    const ready = tests.filter(t => t.injured && t.uninjured && Number(t.uninjured) > 0);
    if (ready.length === 0) return null;
    return batchLSI(ready.map(t => ({ name: t.name, injured: Number(t.injured), uninjured: Number(t.uninjured) })));
  } catch {
    return null;
  }
}