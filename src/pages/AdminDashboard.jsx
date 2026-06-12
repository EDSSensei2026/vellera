import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useNavigate, Link } from "react-router-dom";
import BetaAgentChat from "../components/admin/BetaAgentChat";
import {
  Users, Clock, Activity, TrendingUp,
  RefreshCw, Shield, BarChart3, Target, Calendar,
  ChevronRight, AlertCircle, UserCheck, Mail, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

function StatCard({ label, value, sub, icon: Icon, color = "text-vellera-blue" }) {
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-commander-muted text-xs uppercase tracking-wider font-bold">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
    approved: "bg-green-900/40 text-green-400 border-green-700",
    rejected: "bg-red-900/40 text-red-400 border-red-700",
    active:   "bg-vellera-blue/20 text-vellera-blue border-vellera-blue/40",
    completed:"bg-gray-700/40 text-gray-400 border-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${map[status] || "bg-gray-800 text-gray-400 border-gray-700"}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [testers, setTesters] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [allUsers, setAllUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      if (user?.role !== "admin") { navigate("/"); return; }
      await loadAll();
    };
    init();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [reqs, tstrs, usrs] = await Promise.all([
      base44.entities.BetaRequest.list("-created_date", 500),
      base44.entities.BetaTester.list("-created_date", 500),
      base44.entities.User.list("-created_date", 500).catch(() => []),
    ]);
    setRequests(reqs);
    setTesters(tstrs);
    setUsers(usrs);
    setAllUsers(usrs);
    setLoading(false);
  };

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const pending   = requests.filter(r => r.status === "pending");
  const approved  = requests.filter(r => r.status === "approved");
  const rejected  = requests.filter(r => r.status === "rejected");
  const activeT   = testers.filter(t => t.trial_status === "active");
  const expiring  = testers.filter(t => {
    if (!t.trial_end_date) return false;
    const d = Math.ceil((new Date(t.trial_end_date) - new Date()) / 86400000);
    return d > 0 && d <= 5;
  });
  const conversionRate = requests.length > 0 ? Math.round((approved.length / requests.length) * 100) : 0;

  // ── Requests by goal ─────────────────────────────────────────────────────
  const goalMap = {};
  requests.forEach(r => {
    goalMap[r.primary_goal] = (goalMap[r.primary_goal] || 0) + 1;
  });
  const goalData = Object.entries(goalMap)
    .sort((a, b) => b[1] - a[1])
    .map(([goal, count]) => ({ goal: goal.split(" ")[0], count }));

  // ── Requests over time (last 30 days by day) ──────────────────────────────
  const now = new Date();
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const byDay = {};
  days14.forEach(d => { byDay[d] = 0; });
  requests.forEach(r => {
    const day = new Date(r.created_date || r.requested_date).toISOString().slice(0, 10);
    if (byDay[day] !== undefined) byDay[day]++;
  });
  const trendData = days14.map(d => ({ date: d.slice(5), count: byDay[d] }));

  // ── Recent requests ───────────────────────────────────────────────────────
  const recent = [...requests].slice(0, 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-vellera-blue" />
              Admin Dashboard
            </h1>
            <p className="text-commander-muted text-sm mt-1">Vellera platform overview &amp; user analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="p-2 text-gray-500 hover:text-white transition">
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link to="/beta-manager" className="flex items-center gap-2 px-4 py-2 bg-vellera-blue/10 border border-vellera-blue/30 text-vellera-blue text-sm font-bold rounded-xl hover:bg-vellera-blue/20 transition">
              Beta Manager <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/approvals" className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-700/40 text-yellow-400 text-sm font-bold rounded-xl hover:bg-yellow-900/30 transition">
              Approvals <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-commander-border pb-4">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "requests", label: `Requests (${requests.length})`, icon: Mail },
              { id: "testers",  label: `Testers (${testers.length})`,  icon: UserCheck },
              { id: "users",    label: `Users (${users.length})`,      icon: Users },
              { id: "admins",   label: "Admins",                       icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === id
                  ? "bg-vellera-blue text-black"
                  : "text-gray-400 hover:text-white bg-commander-surface border border-commander-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Agent Chat */}
            <BetaAgentChat />

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Requests"   value={requests.length}  sub="all time"              icon={Mail}        color="text-white" />
              <StatCard label="Pending Review"   value={pending.length}   sub="awaiting decision"     icon={Clock}       color="text-yellow-400" />
              <StatCard label="Active Trials"    value={activeT.length}   sub={`${expiring.length} expiring soon`} icon={Activity} color="text-vellera-green" />
              <StatCard label="Conversion Rate"  value={`${conversionRate}%`} sub="requests → approved" icon={TrendingUp} color="text-vellera-blue" />
            </div>

            {/* Funnel */}
            <div className="bg-commander-surface border border-commander-border rounded-xl p-6">
              <h2 className="text-white font-black text-lg mb-5">Beta Funnel</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Submitted",  value: requests.length,  color: "bg-gray-700" },
                  { label: "Approved",   value: approved.length,  color: "bg-vellera-green" },
                  { label: "Active Trial", value: activeT.length, color: "bg-vellera-blue" },
                  { label: "Rejected",   value: rejected.length,  color: "bg-red-800" },
                ].map(({ label, value, color }, i, arr) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`${color} rounded-xl px-5 py-3 text-center min-w-[90px]`}>
                      <p className="text-white text-2xl font-black">{value}</p>
                      <p className="text-white/70 text-xs font-bold">{label}</p>
                    </div>
                    {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Requests by day */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-6">
                <h2 className="text-white font-black mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-vellera-blue" /> Requests — Last 14 Days
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#fff", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="#00E5FF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Requests by goal */}
              <div className="bg-commander-surface border border-commander-border rounded-xl p-6">
                <h2 className="text-white font-black mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-vellera-green" /> Requests by Goal
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={goalData} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#666", fontSize: 10 }} allowDecimals={false} />
                    <YAxis dataKey="goal" type="category" tick={{ fill: "#aaa", fontSize: 10 }} width={70} />
                    <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2a3a", color: "#fff", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#CCFF00" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expiring soon alert */}
            {expiring.length > 0 && (
              <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-300 font-bold text-sm">{expiring.length} trial{expiring.length > 1 ? "s" : ""} expiring within 5 days</p>
                  <p className="text-orange-400/70 text-xs mt-1">{expiring.map(t => t.full_name).join(", ")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ─────────────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Pending",  val: pending.length,  color: "text-yellow-400" },
                { label: "Approved", val: approved.length, color: "text-vellera-green" },
                { label: "Rejected", val: rejected.length, color: "text-red-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${color}`}>{val}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
            {recent.map(r => (
              <div key={r.id} className="bg-commander-surface border border-commander-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold">{r.full_name}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-commander-muted text-xs">{r.email}</p>
                    <p className="text-vellera-blue text-xs mt-0.5">{r.primary_goal}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{r.why_interested}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-600">{new Date(r.created_date || r.requested_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TESTERS TAB ──────────────────────────────────────────────── */}
        {activeTab === "testers" && (
          <div className="space-y-3">
            {testers.length === 0 ? (
              <p className="text-commander-muted text-center py-12">No beta testers yet.</p>
            ) : testers.map(t => {
              const days = t.trial_end_date ? Math.ceil((new Date(t.trial_end_date) - new Date()) / 86400000) : null;
              return (
                <div key={t.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold">{t.full_name}</p>
                      <StatusBadge status={t.trial_status} />
                    </div>
                    <p className="text-commander-muted text-xs">{t.email}</p>
                    <p className="text-vellera-blue text-xs mt-0.5">{t.primary_goal}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {days !== null && (
                      <p className={`font-black text-sm ${days <= 0 ? "text-red-400" : days <= 5 ? "text-yellow-400" : "text-vellera-green"}`}>
                        {days <= 0 ? "Expired" : `${days}d left`}
                      </p>
                    )}
                    {t.trial_end_date && <p className="text-xs text-gray-600">{new Date(t.trial_end_date).toLocaleDateString()}</p>}
                    {t.feedback_submitted && <p className="text-xs text-vellera-green mt-1 font-bold">✓ Feedback</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{users.length}</p>
                <p className="text-gray-500 text-xs">Total Users</p>
              </div>
              <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-vellera-blue">{users.filter(u => u.role === "admin").length}</p>
                <p className="text-gray-500 text-xs">Admins</p>
              </div>
            </div>
            {users.length === 0 ? (
              <p className="text-commander-muted text-center py-12">No users found.</p>
            ) : users.map(u => (
              <div key={u.id} className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-vellera-blue/20 border border-vellera-blue/30 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-vellera-blue font-black text-sm">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{u.full_name || "—"}</p>
                  <p className="text-commander-muted text-xs">{u.email}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {u.role === "admin" && (
                    <span className="text-xs px-2 py-0.5 bg-vellera-blue/20 text-vellera-blue border border-vellera-blue/30 rounded-full font-bold">admin</span>
                  )}
                  <p className="text-xs text-gray-600">{new Date(u.created_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ADMINS TAB ───────────────────────────────────────────────── */}
        {activeTab === "admins" && (
          <div className="space-y-4">
            {/* Invite new admin */}
            <div className="bg-commander-surface border border-commander-border rounded-xl p-5">
              <h2 className="text-white font-black mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-vellera-blue" /> Invite Admin User</h2>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 bg-gray-800 border border-commander-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition"
                />
                <button
                  disabled={!inviteEmail.trim() || inviting}
                  onClick={async () => {
                    setInviting(true);
                    try {
                      await base44.users.inviteUser(inviteEmail.trim(), "admin");
                      toast.success(`Admin invite sent to ${inviteEmail}`);
                      setInviteEmail("");
                      await loadAll();
                    } catch (e) {
                      toast.error(e.message);
                    } finally { setInviting(false); }
                  }}
                  className="px-4 py-2.5 bg-vellera-blue text-black font-bold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Invite
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">They'll receive an invitation email and will have full admin access upon joining.</p>
            </div>

            {/* Current admins */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Current Admins</p>
              {allUsers.filter(u => u.role === "admin").map(u => (
                <div key={u.id} className="bg-commander-surface border border-vellera-blue/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-vellera-blue/20 border border-vellera-blue/30 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-vellera-blue font-black text-sm">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{u.full_name || "—"}</p>
                    <p className="text-commander-muted text-xs">{u.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-vellera-blue/20 text-vellera-blue border border-vellera-blue/30 rounded-full font-bold">admin</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}