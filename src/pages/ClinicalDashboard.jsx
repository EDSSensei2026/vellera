import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { calculateBeighton, calculateLEFS, LEFS_ITEMS, LEFS_RATING_LABELS } from '../lib/clinicalScoring';
import { ClipboardList, Download, Plus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import BackButton from '../components/BackButton';
import { toast } from 'sonner';

const BEIGHTON_FIELDS = [
  { key: 'pinky_left',     label: 'Pinky >90° (Left)' },
  { key: 'pinky_right',    label: 'Pinky >90° (Right)' },
  { key: 'thumb_left',     label: 'Thumb to Forearm (Left)' },
  { key: 'thumb_right',    label: 'Thumb to Forearm (Right)' },
  { key: 'elbow_left',     label: 'Elbow Hyperextension (Left)' },
  { key: 'elbow_right',    label: 'Elbow Hyperextension (Right)' },
  { key: 'knee_left',      label: 'Knee Hyperextension (Left)' },
  { key: 'knee_right',     label: 'Knee Hyperextension (Right)' },
  { key: 'spinal_flexion', label: 'Forward Flexion — Palms Flat' },
];

function ScoreRing({ score, max, label, flagThreshold }) {
  const pct = (score / max) * 100;
  const flag = flagThreshold != null ? score >= flagThreshold : false;
  const color = flag ? 'text-red-400' : 'text-vellera-green';
  return (
    <div className="flex flex-col items-center gap-1">
      <p className={`text-4xl font-black ${color}`}>{score}<span className="text-lg text-commander-muted">/{max}</span></p>
      <p className="text-commander-muted text-xs uppercase tracking-widest">{label}</p>
      {flag && <span className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flag</span>}
    </div>
  );
}

export default function ClinicalDashboard() {
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  // Form state
  const [beightonInputs, setBeightonInputs] = useState({});
  const [lefsInputs, setLefsInputs] = useState(Array(20).fill(4));
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [assessmentType, setAssessmentType] = useState('combined');

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const data = await base44.entities.ClinicalAssessment.list('-assessment_date', 20);
      setAssessments(data);
      setLoading(false);
    };
    init();
  }, []);

  const beightonResult = calculateBeighton(beightonInputs);
  const lefsResult     = calculateLEFS(lefsInputs);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await base44.entities.ClinicalAssessment.create({
      patient_email:       user.email,
      assessment_type:     assessmentType,
      assessment_date:     new Date().toISOString().split('T')[0],
      beighton_inputs:     beightonInputs,
      beighton_score:      beightonResult.score,
      lefs_inputs:         lefsInputs,
      lefs_score:          lefsResult.score,
      clinical_notes:      clinicalNotes,
      data_sharing_enabled: sharingEnabled,
      status:              'complete',
    });
    const updated = await base44.entities.ClinicalAssessment.list('-assessment_date', 20);
    setAssessments(updated);
    setShowForm(false);
    setSaving(false);
    toast.success('Assessment saved');
  };

  const handleExport = async (id) => {
    setExportingId(id);
    const res = await base44.functions.invoke('generateClinicalReport', { assessment_id: id });
    if (res.data) {
      toast.success('Report generated — check the returned PDF URL');
    }
    setExportingId(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-commander-dark">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-vellera-blue" aria-hidden="true" />
            Clinical Assessments
          </h1>
          <p className="text-commander-muted text-xs mt-0.5">Beighton · LEFS · Role-Gated Reports</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 bg-vellera-blue text-black font-black text-sm px-4 py-2 rounded-xl hover:opacity-90 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellera-blue"
          aria-expanded={showForm}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Assessment
        </button>
      </div>

      {/* Disclaimer */}
      <div role="note" className="bg-yellow-950/30 border border-yellow-700/50 rounded-xl px-4 py-3">
        <p className="text-yellow-400 text-xs font-semibold">⚠ Informational use only — not a clinical diagnosis. Consult a licensed clinician.</p>
      </div>

      {/* New Assessment Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-2xl p-5 space-y-6">
          {/* Assessment type */}
          <div>
            <label htmlFor="assessment-type" className="text-xs text-commander-muted uppercase tracking-widest block mb-2 font-bold">Assessment Type</label>
            <select
              id="assessment-type"
              value={assessmentType}
              onChange={e => setAssessmentType(e.target.value)}
              className="w-full bg-commander-dark border border-commander-border rounded-xl px-3 py-2.5 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            >
              <option value="beighton">Beighton Only</option>
              <option value="lefs">LEFS Only</option>
              <option value="combined">Combined</option>
            </select>
          </div>

          {/* Beighton */}
          {(assessmentType === 'beighton' || assessmentType === 'combined') && (
            <fieldset className="space-y-3">
              <legend className="text-white font-black text-sm uppercase tracking-wider mb-3">Beighton Score — Live: {beightonResult.score}/9</legend>
              {BEIGHTON_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={Boolean(beightonInputs[key])}
                    onChange={e => setBeightonInputs(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-commander-border accent-vellera-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                    aria-label={label}
                  />
                  <span className="text-white text-sm group-hover:text-vellera-blue transition">{label}</span>
                </label>
              ))}
              <div className="mt-3 pt-3 border-t border-commander-border">
                <p className={`text-sm font-bold ${beightonResult.score >= 4 ? 'text-red-400' : 'text-vellera-green'}`}>
                  {beightonResult.interpretation}
                </p>
              </div>
            </fieldset>
          )}

          {/* LEFS */}
          {(assessmentType === 'lefs' || assessmentType === 'combined') && (
            <fieldset className="space-y-3">
              <legend className="text-white font-black text-sm uppercase tracking-wider mb-3">LEFS — Live: {lefsResult.score}/80</legend>
              {LEFS_ITEMS.map((item, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`lefs-${i}`} className="text-white text-sm">{i + 1}. {item}</label>
                  <select
                    id={`lefs-${i}`}
                    value={lefsInputs[i]}
                    onChange={e => {
                      const next = [...lefsInputs];
                      next[i] = Number(e.target.value);
                      setLefsInputs(next);
                    }}
                    className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  >
                    {[4, 3, 2, 1, 0].map(v => (
                      <option key={v} value={v}>{v} — {LEFS_RATING_LABELS[v]}</option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-sm font-bold text-vellera-blue pt-2">{lefsResult.interpretation}</p>
            </fieldset>
          )}

          {/* Clinical Notes */}
          <div>
            <label htmlFor="clinical-notes" className="text-xs text-commander-muted uppercase tracking-widest block mb-2 font-bold">Clinical Notes (Private)</label>
            <textarea
              id="clinical-notes"
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              rows={3}
              placeholder="Private notes — only visible to you unless data sharing is enabled"
              className="w-full bg-commander-dark border border-commander-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-commander-muted resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            />
          </div>

          {/* Data Sharing Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sharingEnabled}
              onChange={e => setSharingEnabled(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-vellera-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
              aria-describedby="sharing-desc"
            />
            <div>
              <p className="text-white text-sm font-bold">Share with Coach</p>
              <p id="sharing-desc" className="text-commander-muted text-xs mt-0.5">Your coach can read your clinical notes and scores when this is enabled</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-vellera-green text-black font-black rounded-xl hover:opacity-90 transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellera-green"
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-3 border border-commander-border text-white rounded-xl hover:border-commander-muted transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div className="space-y-3">
        <h2 className="text-white font-black text-sm uppercase tracking-wider">Assessment History</h2>
        {assessments.length === 0 && (
          <p className="text-commander-muted text-sm text-center py-8">No assessments yet. Create your first above.</p>
        )}
        {assessments.map(a => (
          <div key={a.id} className="bg-commander-surface border border-commander-border rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold capitalize">{a.assessment_type} Assessment</p>
                <p className="text-commander-muted text-xs">{a.assessment_date} · {a.patient_email}</p>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${
                a.status === 'complete' ? 'bg-vellera-green/20 text-vellera-green border-vellera-green/40'
                : a.status === 'exported' ? 'bg-vellera-blue/20 text-vellera-blue border-vellera-blue/40'
                : 'bg-gray-700 text-gray-400 border-gray-600'
              }`}>{a.status}</span>
            </div>

            <div className="flex gap-6">
              {a.beighton_score != null && (
                <ScoreRing score={a.beighton_score} max={9} label="Beighton" flagThreshold={4} />
              )}
              {a.lefs_score != null && (
                <ScoreRing score={a.lefs_score} max={80} label="LEFS" />
              )}
            </div>

            {a.data_sharing_enabled && (
              <p className="text-xs text-vellera-green flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                Coach data sharing enabled
              </p>
            )}

            <button
              onClick={() => handleExport(a.id)}
              disabled={exportingId === a.id}
              className="flex items-center gap-2 text-vellera-blue text-xs font-bold hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue rounded"
              aria-label={`Export PDF report for ${a.assessment_type} assessment on ${a.assessment_date}`}
            >
              {exportingId === a.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                : <Download className="w-3.5 h-3.5" aria-hidden="true" />}
              Export PDF Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}