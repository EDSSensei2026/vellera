import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ClipboardList, ExternalLink, RefreshCw, Loader2,
  Users, Copy, Check, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function ResponseCard({ response, index, onGeneratePlan }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await base44.functions.invoke("generatePlansFromTypeform", { response_id: response.response_id });
    const r = res.data?.results?.[0];
    setResult(r);
    setGenerating(false);
    if (onGeneratePlan) onGeneratePlan(r);
  };

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-vellera-blue text-xs font-bold">Recruit #{index + 1}</p>
          <p className="text-white text-sm font-semibold">{new Date(response.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {result?.status === 'created' && (
            <span className="flex items-center gap-1 text-vellera-green text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Plan Created
            </span>
          )}
          {result?.status === 'already_exists' && (
            <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> Already exists
            </span>
          )}
          {!result && (
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-1.5 bg-vellera-green/20 border border-vellera-green text-vellera-green text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-vellera-green/30 transition-all disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {generating ? "Generating..." : "Generate Plan"}
            </button>
          )}
          <button onClick={() => setOpen(o => !o)} className="text-commander-muted p-1">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-commander-border px-4 pb-4 pt-3 space-y-2">
          {Object.entries(response.answers || {}).map(([key, val]) => val ? (
            <div key={key} className="text-xs border-b border-commander-border/50 pb-1.5 last:border-0">
              <p className="text-commander-muted mb-0.5">{key}</p>
              <p className="text-white">{val}</p>
            </div>
          ) : null)}
          {result?.plan_name && (
            <div className="mt-3 bg-vellera-blue/10 border border-vellera-blue/30 rounded-lg p-3">
              <p className="text-vellera-blue text-xs font-bold">✅ Plan: {result.plan_name}</p>
              <p className="text-commander-muted text-xs">{result.member_email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [syncingAirtable, setSyncingAirtable] = useState(false);
  const [airtableResult, setAirtableResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      await fetchForm();
    };
    init();
  }, []);

  const fetchForm = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("typeformOnboarding", { action: "get" });
    if (res.data?.error) setError(res.data.error);
    else setFormData(res.data);
    setLoading(false);
  };

  const fetchResponses = async () => {
    setLoadingResponses(true);
    const res = await base44.functions.invoke("typeformOnboarding", { action: "responses" });
    if (res.data?.responses) setResponses(res.data.responses);
    setLoadingResponses(false);
  };

  const generateAllPlans = async () => {
    setGeneratingAll(true);
    setBatchResult(null);
    const res = await base44.functions.invoke("generatePlansFromTypeform", {});
    setBatchResult(res.data);
    setGeneratingAll(false);
  };

  const syncToAirtable = async () => {
    if (!airtableBaseId.trim()) {
      alert('Please enter your Airtable Base ID');
      return;
    }
    setSyncingAirtable(true);
    setAirtableResult(null);
    const res = await base44.functions.invoke("syncTypeformToAirtable", { baseId: airtableBaseId });
    setAirtableResult(res.data);
    setSyncingAirtable(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(formData.formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Member Onboarding</h1>
            <p className="text-commander-muted text-xs">Typeform survey → AI personalized training plan</p>
          </div>
        </div>
        <button onClick={fetchForm} disabled={loading} className="p-2 bg-commander-surface border border-commander-border rounded-lg hover:border-vellera-blue transition-all">
          <RefreshCw className={`w-4 h-4 text-vellera-blue ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-vellera-blue" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {formData && !loading && (
        <>
          {/* How it works */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
            <p className="text-white font-bold text-sm mb-3">How it works</p>
            <div className="space-y-2">
              {[
                { step: "1", label: "Share the survey link with new recruits" },
                { step: "2", label: "They answer 10 questions about goals, level, and schedule" },
                { step: "3", label: 'Click "Generate Plans" — AI builds a personalized 4-week training plan for each' },
                { step: "4", label: "Plans appear in Training Plans & the member's dashboard" },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vellera-blue/20 border border-vellera-blue text-vellera-blue text-xs font-black flex items-center justify-center shrink-0">{step}</div>
                  <p className="text-commander-muted text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Survey Link Card */}
          <div className="bg-gradient-to-br from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vellera-blue/20 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-vellera-blue" />
              </div>
              <div>
                <p className="text-white font-black">Vellera Member Onboarding Survey</p>
                <p className="text-commander-muted text-xs">{formData.totalResponses} response{formData.totalResponses !== 1 ? 's' : ''} collected</p>
              </div>
            </div>

            <p className="text-commander-muted text-xs break-all">{formData.formUrl}</p>

            <div className="flex gap-2">
              <button onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-vellera-blue/20 border border-vellera-blue text-vellera-blue rounded-lg py-2.5 text-sm font-bold hover:bg-vellera-blue/30 transition-all">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a href={formData.formUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-vellera-green/20 border border-vellera-green text-vellera-green rounded-lg py-2.5 text-sm font-bold hover:bg-vellera-green/30 transition-all">
                <ExternalLink className="w-4 h-4" />
                Preview Survey
              </a>
            </div>
          </div>

          {/* Responses + Generate Plans (admin only) */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-vellera-green" />
                  <p className="text-white font-bold text-sm">Recruit Submissions</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchResponses} disabled={loadingResponses}
                    className="text-xs text-vellera-blue border border-vellera-blue/40 px-3 py-1.5 rounded-lg hover:bg-vellera-blue/10 transition-all flex items-center gap-1.5">
                    {loadingResponses ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Load Responses
                  </button>
                  {responses.length > 0 && (
                    <button onClick={generateAllPlans} disabled={generatingAll}
                      className="text-xs bg-vellera-green text-commander-dark font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-60">
                      {generatingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      {generatingAll ? "Generating All..." : "Generate All Plans"}
                    </button>
                  )}
                </div>
              </div>

              {batchResult && (
                <div className="bg-vellera-green/10 border border-vellera-green/40 rounded-xl p-4">
                  <p className="text-vellera-green font-bold text-sm">✅ Processed {batchResult.processed} responses</p>
                  <div className="mt-2 space-y-1">
                    {(batchResult.results || []).map((r, i) => (
                      <p key={i} className="text-xs text-commander-muted">
                        {r.status === 'created' ? `✅ ${r.plan_name} → ${r.member_email}` : `⏭️ Response ${r.response_id.slice(0, 8)}... already has a plan`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {responses.length === 0 && !loadingResponses && (
                <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
                  <p className="text-commander-muted text-sm">Click "Load Responses" to view submissions and generate training plans.</p>
                </div>
              )}

              {responses.map((r, i) => (
                <ResponseCard key={r.response_id || i} response={r} index={i} />
              ))}
            </div>
          )}

          {/* Sync to Airtable Section */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-vellera-green" />
              <p className="text-white font-bold text-sm">Sync to Airtable</p>
            </div>
            <p className="text-commander-muted text-xs">Export all Typeform responses to your Airtable base for centralized tracking.</p>
            <input type="text" placeholder="Base ID (from airtable.com/appXXXXXX...)" value={airtableBaseId} onChange={e => setAirtableBaseId(e.target.value)}
              className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={syncToAirtable} disabled={syncingAirtable || !airtableBaseId.trim()}
              className="w-full bg-vellera-green/20 border border-vellera-green text-vellera-green rounded-lg py-2.5 text-sm font-bold hover:bg-vellera-green/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {syncingAirtable ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {syncingAirtable ? "Syncing..." : "Sync to Airtable"}
            </button>
            {airtableResult?.error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-xs">{airtableResult.error}</div>
            )}
            {airtableResult?.message && (
              <div className="bg-vellera-green/10 border border-vellera-green/40 rounded-lg p-3 text-vellera-green text-xs font-bold">✅ {airtableResult.message}</div>
            )}
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <p className="text-commander-muted text-sm">Share the link above with new recruits. Admins can generate personalized training plans from responses.</p>
        </div>
      )}
    </div>
  );
}