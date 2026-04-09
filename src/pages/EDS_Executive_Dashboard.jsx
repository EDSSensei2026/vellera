import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, TrendingUp, Users, DollarSign, CheckCircle, AlertTriangle, Activity, Building2, Shield, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Bento Card primitives ────────────────────────────────────────────────────
function BentoCard({ children, className = '', span = '' }) {
  return (
    <div className={`bg-commander-surface border border-commander-border rounded-2xl p-5 ${span} ${className}`}>
      {children}
    </div>
  );
}

function StatLabel({ children }) {
  return <p className="text-commander-muted text-xs uppercase tracking-widest font-bold mb-1">{children}</p>;
}

function StatValue({ children, color = 'text-white' }) {
  return <p className={`text-4xl font-black ${color}`}>{children}</p>;
}

function StatusBadge({ status }) {
  const map = {
    active:   'bg-vellera-green/20 text-vellera-green border-vellera-green/40',
    paused:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    closed:   'bg-red-500/20 text-red-400 border-red-500/40',
    healthy:  'bg-vellera-green/20 text-vellera-green border-vellera-green/40',
    at_risk:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  };
  return (
    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded border ${map[status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function HealthBar({ score }) {
  const color = score >= 75 ? 'bg-vellera-green' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function EDS_Executive_Dashboard() {
  const navigate = useNavigate();
  const [hub, setHub] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role !== 'admin') { navigate('/'); return; }

      const hubs = await base44.entities.EDS_Enterprise_Hub.list('-created_date', 1);
      const h = hubs[0] || null;
      setHub(h);

      if (h) {
        const orgResults = await base44.entities.Operational_Businesses.filter({ parent_company_id: h.id });
        setOrgs(orgResults);
      }

      const allActivities = await base44.entities.Activity_Logs.list('-timestamp', 10);
      setActivities(allActivities);
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-commander-dark">
        <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center text-red-400 font-bold">Access Denied — Admins Only</div>;
  }

  const totalStudents = orgs.reduce((s, o) => s + (o.student_roster_count || 0), 0);
  const totalRevenue  = orgs.reduce((s, o) => s + (o.monthly_revenue_usd  || 0), 0);
  const avgHealth     = orgs.length ? Math.round(orgs.reduce((s, o) => s + (o.health_score || 0), 0) / orgs.length) : 0;
  const activeOrgs    = orgs.filter(o => o.status === 'active').length;

  return (
    <div className="min-h-screen bg-commander-dark p-4 md:p-8 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white transition p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-vellera-blue" />
            EDS Executive Dashboard
          </h1>
          <p className="text-commander-muted text-xs uppercase tracking-widest mt-0.5">
            {hub?.business_name || 'Emerging Defense Solutions'} · Global View
          </p>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-auto">

        {/* Row 1: KPI tiles */}
        <BentoCard>
          <StatLabel>Total Students</StatLabel>
          <StatValue color="text-vellera-green">{totalStudents}</StatValue>
          <p className="text-commander-muted text-xs mt-1">{orgs.length} orgs</p>
        </BentoCard>

        <BentoCard>
          <StatLabel>Monthly Revenue</StatLabel>
          <StatValue color="text-vellera-blue">${(totalRevenue / 1000).toFixed(1)}K</StatValue>
          <p className="text-commander-muted text-xs mt-1">
            {hub?.revenue_target_usd ? `Target $${(hub.revenue_target_usd / 12000).toFixed(1)}K/mo` : 'No target set'}
          </p>
        </BentoCard>

        <BentoCard>
          <StatLabel>Portfolio Health</StatLabel>
          <StatValue color={avgHealth >= 75 ? 'text-vellera-green' : avgHealth >= 50 ? 'text-yellow-400' : 'text-red-400'}>
            {avgHealth}%
          </StatValue>
          <HealthBar score={avgHealth} />
        </BentoCard>

        <BentoCard>
          <StatLabel>Portfolio Status</StatLabel>
          <div className="mt-2">
            <StatusBadge status={hub?.health_status || 'healthy'} />
          </div>
          <p className="text-commander-muted text-xs mt-2">{activeOrgs}/{orgs.length} orgs active</p>
        </BentoCard>

        {/* Row 2: Organizations table — spans full width */}
        <BentoCard span="col-span-2 md:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-vellera-blue" />
            <h2 className="text-white font-black text-sm uppercase tracking-wider">Sub-Organizations</h2>
            <span className="ml-auto text-commander-muted text-xs">{orgs.length} linked</span>
          </div>

          {orgs.length === 0 ? (
            <p className="text-commander-muted text-sm text-center py-6">No sub-organizations linked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-commander-border text-left">
                    {['Organization', 'Location', 'Students', 'Revenue', 'Health', 'Status'].map(h => (
                      <th key={h} className="pb-2 px-2 text-commander-muted text-xs uppercase tracking-wider font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-commander-border">
                  {orgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-800/40 transition">
                      <td className="py-3 px-2">
                        <p className="text-white font-bold">{org.org_name}</p>
                        <p className="text-commander-muted text-xs">{org.primary_instructor_email}</p>
                      </td>
                      <td className="py-3 px-2 text-commander-muted text-xs">{org.location || '—'}</td>
                      <td className="py-3 px-2 text-white font-bold">{org.student_roster_count || 0}</td>
                      <td className="py-3 px-2 text-white font-bold">${(org.monthly_revenue_usd || 0).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <p className="text-xs text-commander-muted">{org.health_score || 0}%</p>
                        <HealthBar score={org.health_score || 0} />
                      </td>
                      <td className="py-3 px-2"><StatusBadge status={org.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>

        {/* Row 3: Activity feed — 2 cols | Stats summary — 2 cols */}
        <BentoCard span="col-span-2 md:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-vellera-green" />
            <h2 className="text-white font-black text-sm uppercase tracking-wider">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {activities.length === 0 && (
              <p className="text-commander-muted text-sm text-center py-4">No activity logs yet.</p>
            )}
            {activities.map(a => (
              <div key={a.id} className="flex items-start justify-between border-b border-commander-border pb-2 last:border-0">
                <div>
                  <p className="text-white text-sm font-semibold">{a.title || a.activity_type}</p>
                  <p className="text-commander-muted text-xs">{a.student_id} · {a.activity_type}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={a.status} />
                  {a.performance_score != null && (
                    <span className="text-xs text-vellera-blue font-bold">{a.performance_score}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard span="col-span-2 md:col-span-1" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-vellera-blue" />
            <h2 className="text-white font-black text-sm uppercase tracking-wider">Breakdown</h2>
          </div>
          {[
            { label: 'Submitted',  value: activities.filter(a => a.status === 'submitted').length,  color: 'text-yellow-400' },
            { label: 'Reviewed',   value: activities.filter(a => a.status === 'reviewed').length,   color: 'text-vellera-blue' },
            { label: 'Approved',   value: activities.filter(a => a.status === 'approved').length,   color: 'text-vellera-green' },
            { label: 'Needs Work', value: activities.filter(a => a.status === 'needs_revision').length, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <p className="text-commander-muted text-xs uppercase tracking-wider">{label}</p>
              <p className={`font-black text-lg ${color}`}>{value}</p>
            </div>
          ))}
        </BentoCard>

      </div>
    </div>
  );
}