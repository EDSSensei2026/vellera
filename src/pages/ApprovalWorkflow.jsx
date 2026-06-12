import { useState, useEffect, useRef } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Bot, User, Zap,
  ArrowLeft, RefreshCw, Send, ChevronDown, ChevronUp, Shield
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_COLORS = { urgent: "text-red-400 border-red-700 bg-red-900/20", high: "text-orange-400 border-orange-700 bg-orange-900/20", medium: "text-yellow-400 border-yellow-700 bg-yellow-900/20", low: "text-gray-400 border-gray-700 bg-gray-900/20" };
const STATUS_CONFIG = {
  pending:  { label: "Pending",  icon: Clock,       color: "text-yellow-400 bg-yellow-900/20 border-yellow-700/40" },
  approved: { label: "Approved", icon: CheckCircle,  color: "text-green-400 bg-green-900/20 border-green-700/40" },
  rejected: { label: "Rejected", icon: XCircle,      color: "text-red-400 bg-red-900/20 border-red-700/40" },
  deferred: { label: "Deferred", icon: Clock,        color: "text-gray-400 bg-gray-900/20 border-gray-700/40" },
};
const CATEGORY_LABELS = { data_change: "Data Change", user_access: "User Access", beta_approval: "Beta Approval", content_publish: "Publish", system_action: "System", financial: "Financial", other: "Other" };

function StatusBadge({ status }) {
  const { label, icon: Icon, color } = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function ApprovalCard({ req, onAction, currentUserEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const isPending = req.status === "pending";
  const isAI = req.requester_type === "ai_agent";
  const isUrgent = req.priority === "urgent" || req.priority === "high";

  const act = async (status) => {
    setActing(true);
    await base44.entities.ApprovalRequest.update(req.id, {
      status,
      reviewed_by: currentUserEmail,
      reviewed_at: new Date().toISOString(),
      admin_notes: notes,
    });
    toast.success(`Request ${status}`);
    onAction();
    setActing(false);
  };

  return (
    <div className={`bg-commander-surface border rounded-xl overflow-hidden transition-all ${isUrgent && isPending ? "border-red-700/50" : "border-commander-border"}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAI ? "bg-vellera-blue/20" : "bg-gray-700"}`}>
              {isAI ? <Bot className="w-4 h-4 text-vellera-blue" /> : <User className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-white font-bold text-sm truncate">{req.title}</p>
                {isUrgent && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={req.status} />
                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${PRIORITY_COLORS[req.priority] || PRIORITY_COLORS.medium}`}>{req.priority}</span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[req.category] || req.category}</span>
                {isAI && <span className="text-xs text-vellera-blue bg-vellera-blue/10 border border-vellera-blue/20 px-2 py-0.5 rounded-full font-bold">AI Agent</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white transition shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-gray-400 text-xs mt-2 ml-11 leading-relaxed">{req.description}</p>

        <div className="flex items-center gap-3 mt-2 ml-11 text-xs text-gray-600">
          <span>by <span className="text-gray-400">{req.requested_by}</span></span>
          <span>{new Date(req.created_date).toLocaleDateString()}</span>
          {req.related_entity && <span className="text-gray-500">{req.related_entity}</span>}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-commander-border px-4 pb-4 pt-3 space-y-3">
          {req.payload && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Action Payload</p>
              <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {(() => { try { return JSON.stringify(JSON.parse(req.payload), null, 2); } catch { return req.payload; } })()}
              </pre>
            </div>
          )}
          {req.admin_notes && !isPending && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Admin Notes</p>
              <p className="text-gray-300 text-sm bg-gray-900 rounded-lg p-3 border border-gray-800">{req.admin_notes}</p>
            </div>
          )}
          {req.reviewed_by && (
            <p className="text-xs text-gray-600">Reviewed by {req.reviewed_by} on {new Date(req.reviewed_at).toLocaleString()}</p>
          )}

          {isPending && (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Admin notes (optional)..."
                rows={2}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => act("approved")} disabled={acting}
                  className="flex-1 py-2 bg-vellera-green/20 border border-vellera-green/40 text-vellera-green text-sm font-bold rounded-lg hover:bg-vellera-green/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => act("rejected")} disabled={acting}
                  className="flex-1 py-2 bg-red-900/20 border border-red-700/40 text-red-400 text-sm font-bold rounded-lg hover:bg-red-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => act("deferred")} disabled={acting}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 text-sm font-bold rounded-lg hover:bg-gray-700 transition">
                  Defer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentChat() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.agents.createConversation({ agent_name: "approval_agent", metadata: { name: "Approval Session" } })
      .then(c => setConversationId(c.id));
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, data => setMessages(data.messages || []));
    return unsub;
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !conversationId) return;
    const msg = input; setInput(""); setSending(true);
    const conv = await base44.agents.getConversation(conversationId);
    await base44.agents.addMessage(conv, { role: "user", content: msg });
    setSending(false);
  };

  const isWaiting = sending || (messages.length > 0 && messages[messages.length - 1]?.role === "user");

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl flex flex-col h-[480px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-commander-border">
        <Bot className="w-4 h-4 text-vellera-blue" />
        <p className="text-white font-bold text-sm">Approval Agent</p>
        <span className="text-xs text-vellera-blue bg-vellera-blue/10 border border-vellera-blue/20 px-2 py-0.5 rounded-full ml-auto">AI</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-gray-500 text-xs text-center mb-3">Ask the agent to help manage approvals</p>
            {["Show all pending approvals", "Flag urgent items", "Summarize AI agent requests"].map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 transition">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-gray-700 text-white" : "bg-gray-800 border border-gray-700 text-gray-200"}`}>
              {m.role === "user"
                ? <p>{m.content}</p>
                : <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-xs">{m.content}</ReactMarkdown>
              }
            </div>
          </div>
        ))}
        {isWaiting && <div className="flex gap-1 px-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.1s"}} /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.2s"}} /></div>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-commander-border p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about approvals..."
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue" />
        <button onClick={send} disabled={sending || !input.trim()}
          className="px-3 py-2 bg-vellera-blue text-black rounded-lg font-bold disabled:opacity-40 hover:opacity-90 transition">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const BETA_STATUS_COLORS = {
  pending:  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  approved: "bg-green-900/40 text-green-400 border-green-700",
  rejected: "bg-red-900/40 text-red-400 border-red-700",
};

function BetaRequestCard({ req, onUpdate }) {
  const [notes, setNotes] = useState(req.notes || "");
  const [acting, setActing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const act = async (status) => {
    setActing(true);
    await base44.entities.BetaRequest.update(req.id, { status, notes, approved_date: status === "approved" ? new Date().toISOString() : undefined });
    toast.success(`Request ${status}`);
    onUpdate();
    setActing(false);
  };

  return (
    <div className={`bg-commander-surface border rounded-xl overflow-hidden ${req.status === "pending" ? "border-yellow-700/30" : "border-commander-border"}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-white font-bold text-sm">{req.full_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${BETA_STATUS_COLORS[req.status] || BETA_STATUS_COLORS.pending}`}>{req.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-vellera-blue/10 text-vellera-blue border border-vellera-blue/20 font-bold">{req.primary_goal}</span>
            </div>
            <p className="text-gray-500 text-xs">{req.email}</p>
            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{req.why_interested}</p>
            <p className="text-gray-600 text-xs mt-1">{new Date(req.created_date || req.requested_date).toLocaleDateString()}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white transition shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-commander-border px-4 pb-4 pt-3 space-y-2">
          <p className="text-gray-300 text-sm">{req.why_interested}</p>
          {req.status === "pending" && (
            <>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Admin notes (optional)..." rows={2}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none" />
              <div className="flex gap-2">
                <button onClick={() => act("approved")} disabled={acting} className="flex-1 py-2 bg-vellera-green/20 border border-vellera-green/40 text-vellera-green text-sm font-bold rounded-lg hover:bg-vellera-green/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => act("rejected")} disabled={acting} className="flex-1 py-2 bg-red-900/20 border border-red-700/40 text-red-400 text-sm font-bold rounded-lg hover:bg-red-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </>
          )}
          {req.notes && <p className="text-xs text-gray-500 italic">Notes: {req.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function ApprovalWorkflow() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [user, setUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newReq, setNewReq] = useState({ title: "", description: "", category: "other", priority: "medium", requester_type: "user" });
  const [view, setView] = useState("approvals");
  const [betaRequests, setBetaRequests] = useState([]);
  const [betaFilter, setBetaFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    fetchRequests();
    fetchBetaRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    const all = await base44.entities.ApprovalRequest.list("-created_date", 100);
    setRequests(filter === "all" ? all : all.filter(r => r.status === filter));
    setLoading(false);
  };

  const fetchBetaRequests = async () => {
    const all = await base44.entities.BetaRequest.list("-created_date", 500).catch(() => []);
    setBetaRequests(all);
  };

  const createRequest = async () => {
    if (!newReq.title.trim() || !newReq.description.trim()) { toast.error("Title and description required"); return; }
    await base44.entities.ApprovalRequest.create({ ...newReq, requested_by: user?.email || "admin" });
    toast.success("Approval request created");
    setCreating(false);
    setNewReq({ title: "", description: "", category: "other", priority: "medium", requester_type: "user" });
    fetchRequests();
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const urgentCount  = requests.filter(r => r.status === "pending" && (r.priority === "urgent" || r.priority === "high")).length;
  const aiCount      = requests.filter(r => r.status === "pending" && r.requester_type === "ai_agent").length;

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-500 hover:text-white transition"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-vellera-blue" /> Approval Workflows
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">Review and act on AI agent and admin approval requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreating(!creating)}
              className="px-4 py-2 bg-vellera-blue text-black font-bold text-sm rounded-xl hover:opacity-90 transition flex items-center gap-2">
              <Zap className="w-4 h-4" /> New Request
            </button>
            <button onClick={fetchRequests} className="p-2 bg-commander-surface border border-commander-border rounded-xl text-gray-400 hover:text-white transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-commander-surface border border-commander-border rounded-xl p-1 w-fit">
          <button onClick={() => setView("approvals")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${view === "approvals" ? "bg-vellera-blue text-black" : "text-gray-400 hover:text-white"}`}>
            Approval Requests
          </button>
          <button onClick={() => setView("beta")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${view === "beta" ? "bg-vellera-blue text-black" : "text-gray-400 hover:text-white"}`}>
            Beta Access Requests
            {betaRequests.filter(r => r.status === "pending").length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${view === "beta" ? "bg-black/20" : "bg-yellow-900/40 text-yellow-400"}`}>
                {betaRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {view === "approvals" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-red-400">{urgentCount}</p>
            <p className="text-xs text-gray-500">Urgent / High</p>
          </div>
          <div className="bg-vellera-blue/10 border border-vellera-blue/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-vellera-blue">{aiCount}</p>
            <p className="text-xs text-gray-500">From AI Agent</p>
          </div>
        </div>
        )}

        {view === "beta" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{betaRequests.filter(r => r.status === "pending").length}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-vellera-green/10 border border-vellera-green/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-vellera-green">{betaRequests.filter(r => r.status === "approved").length}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-red-400">{betaRequests.filter(r => r.status === "rejected").length}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </div>
        </div>
        )}

        {/* New Request Form */}
        {creating && (
          <div className="bg-commander-surface border border-vellera-blue/30 rounded-xl p-5 space-y-3">
            <p className="text-white font-bold text-sm">Create Approval Request</p>
            <input value={newReq.title} onChange={e => setNewReq(p => ({...p, title: e.target.value}))}
              placeholder="Request title..." className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue" />
            <textarea value={newReq.description} onChange={e => setNewReq(p => ({...p, description: e.target.value}))}
              placeholder="Describe what needs to happen and why it needs approval..."
              rows={3} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none" />
            <div className="grid grid-cols-3 gap-2">
              <select value={newReq.category} onChange={e => setNewReq(p => ({...p, category: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={newReq.priority} onChange={e => setNewReq(p => ({...p, priority: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {["low","medium","high","urgent"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={newReq.requester_type} onChange={e => setNewReq(p => ({...p, requester_type: e.target.value}))}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="user">User</option>
                <option value="ai_agent">AI Agent</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={createRequest} className="flex-1 py-2 bg-vellera-blue text-black font-bold text-sm rounded-lg hover:opacity-90 transition">Submit Request</button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm font-bold rounded-lg hover:bg-gray-700 transition">Cancel</button>
            </div>
          </div>
        )}

        {/* ── BETA REQUESTS VIEW ─────────────────────────────────────────── */}
        {view === "beta" && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-commander-surface border border-commander-border rounded-xl p-1">
              {["all", "pending", "approved", "rejected"].map(f => (
                <button key={f} onClick={() => setBetaFilter(f)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold capitalize transition ${betaFilter === f ? "bg-vellera-blue text-black" : "text-gray-400 hover:text-white"}`}>
                  {f} {f === "all" ? `(${betaRequests.length})` : `(${betaRequests.filter(r => r.status === f).length})`}
                </button>
              ))}
            </div>
            {betaRequests.filter(r => betaFilter === "all" || r.status === betaFilter).length === 0 ? (
              <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
                <p className="text-white font-bold">No requests</p>
                <p className="text-gray-500 text-sm">No beta requests match this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {betaRequests
                  .filter(r => betaFilter === "all" || r.status === betaFilter)
                  .map(r => <BetaRequestCard key={r.id} req={r} onUpdate={fetchBetaRequests} />)}
              </div>
            )}
          </div>
        )}

        {/* ── APPROVAL REQUESTS VIEW ─────────────────────────────────────── */}
        {view === "approvals" && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Requests list */}
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-1 bg-commander-surface border border-commander-border rounded-xl p-1">
              {["pending", "approved", "rejected", "deferred", "all"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold capitalize transition ${filter === f ? "bg-vellera-blue text-black" : "text-gray-400 hover:text-white"}`}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
                <CheckCircle className="w-10 h-10 text-vellera-green mx-auto mb-2" />
                <p className="text-white font-bold">All clear</p>
                <p className="text-gray-500 text-sm">No {filter === "all" ? "" : filter} requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <ApprovalCard key={r.id} req={r} onAction={fetchRequests} currentUserEmail={user?.email} />
                ))}
              </div>
            )}
          </div>

          {/* Agent Chat */}
          <div>
            <AgentChat />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}