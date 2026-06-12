import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Heart, Moon, Zap, Activity, Loader2, AlertTriangle, TrendingDown } from 'lucide-react';

function HealthMetricBar({ label, value, max, color, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-commander-muted">{label}</span>
        <span className="text-white font-bold">{value !== null ? `${value}${unit}` : '—'}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SquadHealthOverview({ students }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (students.length === 0) { setLoading(false); return; }
      // Fetch recent wellness logs for all students
      const allLogs = await base44.entities.WellnessLog.list('-log_date', 100);
      const studentEmails = new Set(students.map(s => s.user_email));
      setLogs(allLogs.filter(l => studentEmails.has(l.user_email)));
      setLoading(false);
    };
    load();
  }, [students]);

  // Aggregate: latest log per student
  const latestByStudent = {};
  logs.forEach(log => {
    if (!latestByStudent[log.user_email] || log.log_date > latestByStudent[log.user_email].log_date) {
      latestByStudent[log.user_email] = log;
    }
  });

  const studentLogs = students.map(s => ({
    member: s,
    log: latestByStudent[s.user_email] || null,
  }));

  // Squad aggregates
  const logsWithData = studentLogs.filter(sl => sl.log);
  const avg = (field) => {
    const vals = logsWithData.map(sl => sl.log[field]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  };

  const avgReadiness = avg('readiness_score');
  const avgSleep = avg('sleep_hours');
  const avgMood = avg('mood_score');
  const avgFatigue = avg('fatigue_score');

  const flagged = studentLogs.filter(sl => sl.log?.flagged || sl.log?.readiness_score < 40 || sl.log?.pain_vas > 6);

  const readinessColor = (score) => {
    if (!score) return 'bg-gray-600';
    if (score >= 75) return 'bg-vellera-green';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <Loader2 className="w-6 h-6 text-commander-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-white font-black text-sm uppercase tracking-wider">Squad Health Overview</h2>

      {/* Squad Aggregates */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-white font-bold text-sm mb-3">Squad Averages · Last Check-In</p>
        {avgReadiness !== null ? (
          <>
            <HealthMetricBar label="Avg Readiness" value={avgReadiness} max={100} color={readinessColor(avgReadiness)} unit="%" />
            <HealthMetricBar label="Avg Sleep" value={avgSleep} max={10} color="bg-vellera-blue" unit="h" />
            <HealthMetricBar label="Avg Mood" value={avgMood} max={5} color="bg-purple-500" unit="/5" />
            <HealthMetricBar label="Avg Energy" value={avgFatigue} max={5} color="bg-vellera-green" unit="/5" />
          </>
        ) : (
          <p className="text-commander-muted text-sm text-center py-4">No wellness check-ins from students yet.</p>
        )}
      </div>

      {/* Flagged Athletes */}
      {flagged.length > 0 && (
        <div className="bg-red-950/20 border border-red-700/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 font-bold text-sm">Athletes Needing Attention ({flagged.length})</p>
          </div>
          {flagged.map(({ member, log }) => (
            <div key={member.id} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
              <div>
                <p className="text-white text-sm font-bold">{member.user_name || member.user_email.split('@')[0]}</p>
                <p className="text-red-300 text-xs">
                  {log?.readiness_score < 40 ? `Readiness: ${log.readiness_score}%` : ''}
                  {log?.pain_vas > 6 ? ` Pain: ${log.pain_vas}/10` : ''}
                  {log?.flagged ? ' Flagged' : ''}
                </p>
              </div>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          ))}
        </div>
      )}

      {/* Per-Student Grid */}
      <div>
        <p className="text-white font-bold text-sm mb-3">Individual Status</p>
        {studentLogs.length === 0 ? (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
            <Activity className="w-10 h-10 text-commander-muted mx-auto mb-2" />
            <p className="text-white font-bold">No students enrolled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {studentLogs.map(({ member, log }) => (
              <div key={member.id} className="bg-commander-surface border border-commander-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm">{member.user_name || member.user_email.split('@')[0]}</p>
                  {log ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${readinessColor(log.readiness_score)}`} />
                      <span className="text-xs text-commander-muted">
                        {new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">No check-in</span>
                  )}
                </div>
                {log ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Ready', val: log.readiness_score != null ? `${log.readiness_score}%` : '—', icon: Zap, color: 'text-vellera-green' },
                      { label: 'Sleep', val: log.sleep_hours != null ? `${log.sleep_hours}h` : '—', icon: Moon, color: 'text-vellera-blue' },
                      { label: 'Mood', val: log.mood_score != null ? `${log.mood_score}/5` : '—', icon: Heart, color: 'text-purple-400' },
                      { label: 'Pain', val: log.pain_vas != null ? `${log.pain_vas}/10` : '—', icon: Activity, color: log.pain_vas > 5 ? 'text-red-400' : 'text-gray-400' },
                    ].map(({ label, val, icon: Icon, color }) => (
                      <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                        <Icon className={`w-3 h-3 mx-auto mb-1 ${color}`} />
                        <p className={`text-xs font-black ${color}`}>{val}</p>
                        <p className="text-gray-600 text-xs">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-commander-muted text-xs">Awaiting first wellness check-in</p>
                )}
                {log?.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.symptoms.map(s => (
                      <span key={s} className="text-xs bg-red-900/30 border border-red-700/30 text-red-300 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}