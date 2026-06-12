import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { calculateLSI } from '../lib/lsiScoring';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Calendar, MessageSquare, Activity, AlertTriangle,
  Plus, Send, Loader2
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { toast } from 'sonner';
import { subDays, format, parseISO } from 'date-fns';

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color = 'text-vellera-blue' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
      <h2 className="text-white font-black text-sm uppercase tracking-wider">{title}</h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    scheduled:  'bg-vellera-blue/20 text-vellera-blue border-vellera-blue/40',
    confirmed:  'bg-vellera-green/20 text-vellera-green border-vellera-green/40',
    cancelled:  'bg-red-500/20 text-red-400 border-red-500/40',
    completed:  'bg-gray-700 text-gray-400 border-gray-600',
    conflict:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  };
  return (
    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded border ${map[status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClinicalLogisticsHub() {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedForm, setSchedForm] = useState({ title: '', event_type: 'clinic_appointment', patient_email: '', start_datetime: '', end_datetime: '', location: '' });
  const [checking, setChecking] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);

  // Wellness form
  const [showWellnessForm, setShowWellnessForm] = useState(false);
  const [wellnessForm, setWellnessForm] = useState({ pain_vas: 0, mood_score: 3, sleep_hours: 7, sleep_quality: 3, energy_level: 3, notes: '' });

  // Message
  const [msgContent, setMsgContent] = useState('');
  const [msgTo, setMsgTo] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // LSI
  const [lsiInjured, setLsiInjured] = useState('');
  const [lsiUninjured, setLsiUninjured] = useState('');
  const [lsiResult, setLsiResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [scheds, wellness, msgs] = await Promise.all([
        base44.entities.Schedule.list('-start_datetime', 20),
        base44.entities.WellnessLog.list('-log_date', 30),
        base44.entities.ClinicalMessage.list('-sent_at', 30),
      ]);
      setSchedules(scheds);
      setWellnessLogs(wellness);
      setMessages(msgs);
      setLoading(false);
    };
    init();
  }, []);

  // ── Trend chart data (last 30 days) ─────────────────────────────────────
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'MM/dd');
    const isoDate = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const log = wellnessLogs.find(w => w.log_date === isoDate);
    return {
      date,
      pain: log?.pain_vas ?? null,
      mood: log?.mood_score ?? null,
      sleep: log?.sleep_quality ?? null,
      energy: log?.energy_level ?? null,
    };
  }).filter(d => d.pain !== null || d.mood !== null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCheckConflict = async () => {
    setChecking(true);
    setConflictResult(null);
    const res = await base44.functions.invoke('autoSchedule', {
      mode: 'check_conflict',
      event: { ...schedForm, practitioner_email: user.email },
    });
    setConflictResult(res.data);
    setChecking(false);
  };

  const handleSaveSchedule = async () => {
    await base44.entities.Schedule.create({
      ...schedForm,
      practitioner_email: user.email,
      status: conflictResult?.conflict ? 'conflict' : 'scheduled',
      conflict_reason: conflictResult?.conflict ? conflictResult.message : null,
    });
    const updated = await base44.entities.Schedule.list('-start_datetime', 20);
    setSchedules(updated);
    setShowScheduleForm(false);
    setConflictResult(null);
    setSchedForm({ title: '', event_type: 'clinic_appointment', patient_email: '', start_datetime: '', end_datetime: '', location: '' });
    toast.success('Schedule saved');
  };

  const handleSaveWellness = async () => {
    const flagged = wellnessForm.pain_vas >= 7;
    await base44.entities.WellnessLog.create({
      ...wellnessForm,
      user_email: user.email,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      flagged,
    });
    const updated = await base44.entities.WellnessLog.list('-log_date', 30);
    setWellnessLogs(updated);
    setShowWellnessForm(false);
    toast.success(flagged ? '⚠ Log saved — high pain flagged for clinician review' : 'Wellness log saved');
  };

  const handleSendMessage = async () => {
    if (!msgContent.trim() || !msgTo.trim()) return;
    setSendingMsg(true);
    const threadId = [user.email, msgTo].sort().join('::');
    await base44.entities.ClinicalMessage.create({
      from_email: user.email,
      to_email: msgTo,
      thread_id: threadId,
      content: msgContent,
      sent_at: new Date().toISOString(),
      is_private_clinical: true,
    });
    const updated = await base44.entities.ClinicalMessage.list('-sent_at', 30);
    setMessages(updated);
    setMsgContent('');
    setSendingMsg(false);
    toast.success('Message sent');
  };

  const handleLSI = () => {
    const inj = parseFloat(lsiInjured);
    const uninj = parseFloat(lsiUninjured);
    if (isNaN(inj) || isNaN(uninj) || uninj <= 0) {
      toast.error('Enter valid numeric scores');
      return;
    }
    setLsiResult(calculateLSI(inj, uninj));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-commander-dark">
        <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
      </div>
    );
  }

  const todayLog = wellnessLogs.find(w => w.log_date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h1 className="text-white text-2xl font-black tracking-tight">Clinical Logistics Hub</h1>
          <p className="text-commander-muted text-xs mt-0.5 uppercase tracking-widest">Schedule · Wellness · LSI · Messaging</p>
        </div>
      </div>

      {/* Split-Screen Layout */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* ── LEFT COLUMN: Schedule + LSI ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Schedule Panel */}
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon={Calendar} title="Appointments & Practices" />
              <button
                onClick={() => setShowScheduleForm(f => !f)}
                className="flex items-center gap-1 text-xs text-vellera-blue font-bold hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue rounded"
                aria-expanded={showScheduleForm}
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {showScheduleForm && (
              <div className="space-y-3 mb-4 p-3 bg-commander-dark rounded-xl border border-commander-border">
                {[
                  { id: 'sched-title', label: 'Title', key: 'title', type: 'text' },
                  { id: 'sched-patient', label: 'Patient / Athlete Email', key: 'patient_email', type: 'email' },
                  { id: 'sched-location', label: 'Location', key: 'location', type: 'text' },
                  { id: 'sched-start', label: 'Start', key: 'start_datetime', type: 'datetime-local' },
                  { id: 'sched-end', label: 'End', key: 'end_datetime', type: 'datetime-local' },
                ].map(({ id, label, key, type }) => (
                  <div key={key}>
                    <label htmlFor={id} className="text-xs text-commander-muted block mb-1">{label}</label>
                    <input id={id} type={type} value={schedForm[key]}
                      onChange={e => setSchedForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                    />
                  </div>
                ))}

                <div>
                  <label htmlFor="sched-type" className="text-xs text-commander-muted block mb-1">Type</label>
                  <select id="sched-type" value={schedForm.event_type}
                    onChange={e => setSchedForm(p => ({ ...p, event_type: e.target.value }))}
                    className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  >
                    {['clinic_appointment','team_practice','rehab_session','assessment','other'].map(v => (
                      <option key={v} value={v}>{v.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </div>

                {conflictResult && (
                  <div className={`p-3 rounded-lg border text-sm ${conflictResult.conflict ? 'bg-yellow-950/30 border-yellow-700 text-yellow-400' : 'bg-vellera-green/10 border-vellera-green/40 text-vellera-green'}`}>
                    <p className="font-bold">{conflictResult.conflict ? '⚠ Conflict Detected' : '✓ No Conflicts'}</p>
                    <p className="text-xs mt-1">{conflictResult.message}</p>
                    {conflictResult.alt_slots?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-bold mb-1">Suggested Alternatives:</p>
                        {conflictResult.alt_slots.map((slot, i) => (
                          <button key={i} onClick={() => {
                            const d = new Date(slot);
                            const end = new Date(d.getTime() + 60*60000);
                            setSchedForm(p => ({
                              ...p,
                              start_datetime: d.toISOString().slice(0,16),
                              end_datetime: end.toISOString().slice(0,16),
                            }));
                            setConflictResult(null);
                          }}
                            className="block text-xs text-vellera-blue underline hover:text-white transition mt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                          >
                            {format(new Date(slot), 'MMM d, h:mm a')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={handleCheckConflict} disabled={checking || !schedForm.start_datetime}
                    className="flex-1 py-2 border border-vellera-blue text-vellera-blue text-sm font-bold rounded-xl hover:bg-vellera-blue/10 transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  >
                    {checking ? 'Checking...' : 'Check Conflicts'}
                  </button>
                  <button onClick={handleSaveSchedule}
                    className="flex-1 py-2 bg-vellera-green text-black text-sm font-black rounded-xl hover:opacity-90 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-green"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {schedules.length === 0 && <p className="text-commander-muted text-sm text-center py-4">No events scheduled.</p>}
              {schedules.map(s => (
                <div key={s.id} className="flex items-start justify-between p-2 rounded-lg bg-commander-dark border border-commander-border">
                  <div>
                    <p className="text-white text-sm font-bold">{s.title}</p>
                    <p className="text-commander-muted text-xs">{s.patient_email || '—'} · {s.start_datetime ? format(parseISO(s.start_datetime), 'MMM d, h:mm a') : '—'}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>

          {/* LSI Calculator */}
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
            <SectionHeader icon={Activity} title="Limb Symmetry Index (LSI)" color="text-vellera-green" />
            <p className="text-commander-muted text-xs mb-3">Formula: (Injured ÷ Uninjured) × 100 · RTP threshold: ≥90%</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="lsi-injured" className="text-xs text-commander-muted block mb-1">Injured Limb Score</label>
                <input id="lsi-injured" type="number" min="0" value={lsiInjured}
                  onChange={e => setLsiInjured(e.target.value)}
                  className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  placeholder="e.g. 85"
                />
              </div>
              <div>
                <label htmlFor="lsi-uninjured" className="text-xs text-commander-muted block mb-1">Uninjured Limb Score</label>
                <input id="lsi-uninjured" type="number" min="0.01" value={lsiUninjured}
                  onChange={e => setLsiUninjured(e.target.value)}
                  className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  placeholder="e.g. 100"
                />
              </div>
            </div>
            <button onClick={handleLSI}
              className="w-full py-2 bg-vellera-blue text-black font-black text-sm rounded-xl hover:opacity-90 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
            >
              Calculate LSI
            </button>

            {lsiResult && (
              <div className={`mt-3 p-3 rounded-xl border ${lsiResult.category.bg}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-black ${lsiResult.category.color}`}>{lsiResult.lsi}%</p>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${lsiResult.category.bg}`}>
                    {lsiResult.category.label}
                  </span>
                </div>
                <p className="text-xs text-commander-muted mt-1">{lsiResult.clearance}</p>
                {lsiResult.is_high_risk && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                    <p className="text-xs text-red-400 font-bold">Not cleared for return-to-play</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wellness Daily Check-in */}
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon={Activity} title="Wellness Check-In" color="text-yellow-400" />
              {!todayLog && (
                <button onClick={() => setShowWellnessForm(f => !f)}
                  className="text-xs text-yellow-400 font-bold hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 rounded"
                  aria-expanded={showWellnessForm}
                >
                  <Plus className="w-3.5 h-3.5 inline" /> Log Today
                </button>
              )}
            </div>

            {todayLog ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pain (VAS)', value: `${todayLog.pain_vas}/10`, flag: todayLog.pain_vas >= 7 },
                  { label: 'Mood', value: `${todayLog.mood_score}/5`, flag: false },
                  { label: 'Sleep', value: `${todayLog.sleep_quality}/5`, flag: false },
                ].map(({ label, value, flag }) => (
                  <div key={label} className={`p-2 rounded-lg border text-center ${flag ? 'bg-red-950/20 border-red-700' : 'bg-commander-dark border-commander-border'}`}>
                    <p className={`font-black text-lg ${flag ? 'text-red-400' : 'text-white'}`}>{value}</p>
                    <p className="text-xs text-commander-muted">{label}</p>
                  </div>
                ))}
              </div>
            ) : showWellnessForm ? (
              <div className="space-y-3">
                {[
                  { id: 'w-pain', label: 'Pain VAS (0-10)', key: 'pain_vas', min: 0, max: 10 },
                  { id: 'w-mood', label: 'Mood (1-5)', key: 'mood_score', min: 1, max: 5 },
                  { id: 'w-sleep-h', label: 'Sleep Hours', key: 'sleep_hours', min: 0, max: 24 },
                  { id: 'w-sleep-q', label: 'Sleep Quality (1-5)', key: 'sleep_quality', min: 1, max: 5 },
                  { id: 'w-energy', label: 'Energy (1-5)', key: 'energy_level', min: 1, max: 5 },
                ].map(({ id, label, key, min, max }) => (
                  <div key={key}>
                    <label htmlFor={id} className="text-xs text-commander-muted flex justify-between mb-1">
                      <span>{label}</span><span className="text-white font-bold">{wellnessForm[key]}</span>
                    </label>
                    <input id={id} type="range" min={min} max={max} step="1"
                      value={wellnessForm[key]}
                      onChange={e => setWellnessForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                      className="w-full accent-vellera-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                    />
                  </div>
                ))}
                <textarea
                  value={wellnessForm.notes}
                  onChange={e => setWellnessForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                />
                <button onClick={handleSaveWellness}
                  className="w-full py-2 bg-yellow-500 text-black font-black text-sm rounded-xl hover:opacity-90 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
                >
                  Save Wellness Log
                </button>
              </div>
            ) : (
              <p className="text-commander-muted text-sm text-center py-4">No log for today yet.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Trend Charts + Messaging ───────────────────────── */}
        <div className="space-y-4">

          {/* Trend Charts */}
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
            <SectionHeader icon={Activity} title="30-Day Wellness Trends" color="text-vellera-blue" />
            {trendData.length === 0 ? (
              <p className="text-commander-muted text-sm text-center py-8">Log wellness data to see trends.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#888', fontSize: 10 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#aaa', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                  <Line type="monotone" dataKey="pain" name="Pain (VAS)" stroke="#f87171" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="#00E5FF" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="sleep" name="Sleep Quality" stroke="#CCFF00" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="energy" name="Energy" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Secure Messaging */}
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-4">
            <SectionHeader icon={MessageSquare} title="Secure Clinical Messaging" />
            <p className="text-commander-muted text-xs mb-3">Messages are strictly isolated to each practitioner-patient pair. Coaches cannot read clinical threads.</p>

            <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
              {messages.length === 0 && <p className="text-commander-muted text-sm text-center py-4">No messages.</p>}
              {messages.map(m => (
                <div key={m.id} className={`p-2.5 rounded-lg text-sm ${m.from_email === user?.email ? 'bg-vellera-blue/10 border border-vellera-blue/30 ml-6' : 'bg-commander-dark border border-commander-border mr-6'}`}>
                  <p className="text-white">{m.content}</p>
                  <p className="text-commander-muted text-xs mt-1">{m.from_email === user?.email ? 'You' : m.from_email} · {m.sent_at ? format(parseISO(m.sent_at), 'MMM d, h:mm a') : ''}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <input
                type="email"
                value={msgTo}
                onChange={e => setMsgTo(e.target.value)}
                placeholder="Recipient email..."
                className="w-full bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                aria-label="Recipient email"
              />
              <div className="flex gap-2">
                <textarea
                  value={msgContent}
                  onChange={e => setMsgContent(e.target.value)}
                  placeholder="Type a secure clinical message..."
                  rows={2}
                  className="flex-1 bg-commander-dark border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  aria-label="Message content"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendMessage(); }}
                />
                <button onClick={handleSendMessage} disabled={sendingMsg || !msgContent.trim() || !msgTo.trim()}
                  className="px-3 py-2 bg-vellera-blue text-black rounded-xl hover:opacity-90 disabled:opacity-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-vellera-blue"
                  aria-label="Send message"
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Flagged Wellness Logs */}
          {wellnessLogs.some(w => w.flagged) && (
            <div className="bg-red-950/20 border border-red-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" aria-hidden="true" />
                <h2 className="text-red-400 font-black text-sm uppercase tracking-wider">Flagged Logs — Clinician Review Required</h2>
              </div>
              <div className="space-y-2">
                {wellnessLogs.filter(w => w.flagged).map(w => (
                  <div key={w.id} className="flex items-center justify-between text-sm p-2 bg-commander-dark rounded-lg border border-red-800/50">
                    <span className="text-white">{w.log_date} · Pain: {w.pain_vas}/10</span>
                    <span className="text-red-400 text-xs font-bold uppercase">High Pain</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}