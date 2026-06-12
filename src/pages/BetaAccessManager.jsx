import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, Shield, Users, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Ban } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────
function daysLeft(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }) {
  const map = {
    pending:   "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
    approved:  "bg-vellera-green/20 text-vellera-green border-vellera-green/40",
    rejected:  "bg-red-900/40 text-red-400 border-red-700/50",
    active:    "bg-vellera-green/20 text-vellera-green border-vellera-green/40",
    completed: "bg-gray-700/50 text-gray-400 border-gray-600/50",
    extended:  "bg-vellera-blue/20 text-vellera-blue border-vellera-blue/40",
    converted_to_paid: "bg-purple-900/40 text-purple-300 border-purple-700/50",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide ${map[status] || "bg-gray-800 text-gray-400 border-gray-700"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Request Row ────────────────────────────────────────────────────────────
function RequestRow({ request, onApprove, onReject, approving }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-commander-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-commander-surface">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold">{request.full_name}</p>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-commander-muted text-xs mt-0.5">{request.email}</p>
          <p className="text-vellera-blue text-xs mt-0.5">{request.primary_goal}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="text-gray-500 hover:text-white transition p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {request.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(request)}
                disabled={approving === request.id}
                className="px-3 py-1.5 bg-vellera-green text-black font-bold text-xs rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
              >
                {approving === request.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve
              </button>
              <button
                onClick={() => onReject(request)}
                className="px-3 py-1.5 bg-red-900/50 text-red-400 font-bold text-xs rounded-lg hover:bg-red-900 transition border border-red-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-900/40 border-t border-commander-border">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Why they're interested:</p>
          <p className="text-gray-300 text-sm">{request.why_interested}</p>
          {request.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Admin Notes:</p>
              <p className="text-gray-400 text-sm">{request.notes}</p>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-3">Submitted: {new Date(request.requested_date || request.created_date).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

// ── Tester Row ─────────────────────────────────────────────────────────────
function TesterRow({ tester, onRevoke, onExtend }) {
  const days = daysLeft(tester.trial_end_date);
  const isExpired = days !== null && days <= 0;
  const isUrgent = days !== null && days > 0 && days <= 5;

  return (
    <div className="flex items-center gap-3 p-4 bg-commander-surface border border-commander-border rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-bold">{tester.full_name}</p>
          <StatusBadge status={tester.trial_status} />
        </div>
        <p className="text-commander-muted text-xs mt-0.5">{tester.email}</p>
        <p className="text-vellera-blue text-xs mt-0.5">{tester.primary_goal}</p>
      </div>
      <div className="text-right shrink-0 mr-2">
        {days !== null && (
          <p className={`text-sm font-black ${isExpired ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-vellera-green"}`}>
            {isExpired ? "Expired" : `${days}d left`}
          </p>
        )}
        {tester.trial_end_date && (
          <p className="text-xs text-gray-600">{new Date(tester.trial_end_date).toLocaleDateString()}</p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onExtend(tester)}
          className="px-3 py-1.5 bg-vellera-blue/20 text-vellera-blue font-bold text-xs rounded-lg hover:bg-vellera-blue/40 transition border border-vellera-blue/30 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> +30d
        </button>
        {tester.trial_status === "active" && (
          <button
            onClick={() => onRevoke(tester)}
            className="px-3 py-1.5 bg-red-900/30 text-red-400 font-bold text-xs rounded-lg hover:bg-red-900/60 transition border border-red-800/50 flex items-center gap-1"
          >
            <Ban className="w-3 h-3" /> Revoke
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BetaAccessManager() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("requests");
  const [approving, setApproving] = useState(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      if (user?.role !== "admin") { navigate("/"); return; }
      await loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [reqs, tstrs] = await Promise.all([
      base44.entities.BetaRequest.list("-created_date", 100),
      base44.entities.BetaTester.list("-created_date", 100),
    ]);
    setRequests(reqs);
    setTesters(tstrs);
    setLoading(false);
  };

  const handleApprove = async (request) => {
    setApproving(request.id);
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30);

      // Create BetaTester record
      await base44.entities.BetaTester.create({
        email: request.email,
        full_name: request.full_name,
        primary_goal: request.primary_goal,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        trial_status: "active",
        biography: "",
        fitness_experience: "Intermediate (1-3 years)",
        what_will_you_use_for: [],
        consent_data_collection: false,
        consent_contact: true,
        feedback_submitted: false,
      });

      // Update request status
      await base44.entities.BetaRequest.update(request.id, {
        status: "approved",
        approved_date: now.toISOString(),
      });

      // Send approval email
      await base44.integrations.Core.SendEmail({
        to: request.email,
        subject: "🎉 You're In — Vellera Beta Access Approved!",
        body: `Hi ${request.full_name},\n\nGreat news! Your Vellera beta application has been approved.\n\n✅ Your 30-day free trial starts now.\n\nTo get started:\n1. Sign up or sign in at https://vellera.app\n2. Complete your beta onboarding at https://vellera.app/beta-onboarding\n3. Start training!\n\nYour trial runs until ${trialEnd.toLocaleDateString()}.\n\nWe're excited to have you on the team. Your feedback will shape the future of Vellera.\n\nTrain hard,\nThe Vellera Team`,
      });

      toast.success(`${request.full_name} approved! Trial ends ${trialEnd.toLocaleDateString()}`);
      await loadData();
    } catch (err) {
      toast.error("Failed to approve: " + err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (request) => {
    if (!confirm(`Reject ${request.full_name}'s request?`)) return;
    await base44.entities.BetaRequest.update(request.id, { status: "rejected" });
    toast.success("Request rejected.");
    await loadData();
  };

  const handleExtend = async (tester) => {
    const current = tester.trial_end_date ? new Date(tester.trial_end_date) : new Date();
    const newEnd = new Date(Math.max(current, new Date()));
    newEnd.setDate(newEnd.getDate() + 30);
    await base44.entities.BetaTester.update(tester.id, {
      trial_end_date: newEnd.toISOString(),
      trial_status: "extended",
    });
    toast.success(`Trial extended to ${newEnd.toLocaleDateString()}`);
    await loadData();
  };

  const handleRevoke = async (tester) => {
    if (!confirm(`Revoke access for ${tester.full_name}?`)) return;
    await base44.entities.BetaTester.update(tester.id, { trial_status: "completed" });
    toast.success("Access revoked.");
    await loadData();
  };

  const filteredRequests = requests.filter(r => filter === "all" ? true : r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const activeCount = testers.filter(t => t.trial_status === "active").length;
  const expiringCount = testers.filter(t => { const d = daysLeft(t.trial_end_date); return d !== null && d > 0 && d <= 5; }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-vellera-blue" />
              Beta Access Manager
            </h1>
            <p className="text-commander-muted text-sm mt-1">Manage invite-only beta access and 30-day trials</p>
          </div>
          <button onClick={loadData} className="p-2 text-gray-500 hover:text-white transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Review", value: pendingCount, color: "text-yellow-400", icon: Clock },
            { label: "Active Testers", value: activeCount, color: "text-vellera-green", icon: Users },
            { label: "Expiring Soon", value: expiringCount, color: "text-orange-400", icon: AlertCircle },
            { label: "Total Approved", value: requests.filter(r => r.status === "approved").length, color: "text-vellera-blue", icon: Check },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-commander-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["requests", "testers"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-bold text-sm transition capitalize ${tab === t ? "bg-vellera-blue text-black" : "bg-commander-surface text-gray-400 border border-commander-border hover:text-white"}`}
            >
              {t === "requests" ? `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}` : `Active Trials (${activeCount})`}
            </button>
          ))}
        </div>

        {/* Requests Tab */}
        {tab === "requests" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {["pending", "approved", "rejected", "all"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${filter === f ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-commander-muted">No {filter} requests.</div>
            ) : (
              filteredRequests.map(r => (
                <RequestRow key={r.id} request={r} onApprove={handleApprove} onReject={handleReject} approving={approving} />
              ))
            )}
          </div>
        )}

        {/* Testers Tab */}
        {tab === "testers" && (
          <div className="space-y-3">
            {testers.length === 0 ? (
              <div className="text-center py-12 text-commander-muted">No beta testers yet.</div>
            ) : (
              testers.map(t => (
                <TesterRow key={t.id} tester={t} onRevoke={handleRevoke} onExtend={handleExtend} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}