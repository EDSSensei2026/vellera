import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WearableProviderCard from "../components/WearableProviderCard";
import WearablesBiometricsChart from "../components/WearablesBiometricsChart";
import { Activity, RefreshCw, Loader2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const PROVIDERS = ["strava", "fitbit", "polar", "whoop"];
const SYNC_FNS = { strava: "stravaSync", fitbit: "fitbitSync", polar: "polarSync", whoop: "whoopSync" };

export default function WearablesHub() {
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("wearable_sync_prefs");
      return saved ? JSON.parse(saved) : { strava: true, fitbit: true, polar: true, whoop: true };
    } catch { return { strava: true, fitbit: true, polar: true, whoop: true }; }
  });

  const fetchTokens = async () => {
    setLoading(true);
    const [wearables, whoopTokens] = await Promise.all([
      base44.entities.WearableToken.list(),
      base44.entities.WhoopToken.list().catch(() => []),
    ]);
    const map = {};
    wearables.forEach(t => { map[t.provider] = t; });
    if (whoopTokens.length > 0) map["whoop"] = whoopTokens[0];
    setTokens(map);
    setLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const toggleSync = (provider) => {
    setSyncEnabled(prev => {
      const next = { ...prev, [provider]: !prev[provider] };
      localStorage.setItem("wearable_sync_prefs", JSON.stringify(next));
      return next;
    });
  };

  const syncAll = async () => {
    setSyncingAll(true);
    const connected = PROVIDERS.filter(p => tokens[p] && syncEnabled[p]);
    await Promise.all(connected.map(p => base44.functions.invoke(SYNC_FNS[p], {}).catch(() => {})));
    await fetchTokens();
    setSyncingAll(false);
  };

  const connectedCount = PROVIDERS.filter(p => tokens[p]).length;
  const syncEnabledCount = PROVIDERS.filter(p => tokens[p] && syncEnabled[p]).length;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-commander-red rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">Wearables Hub</h1>
            <p className="text-commander-muted text-xs">
              {connectedCount} connected · {syncEnabledCount} syncing
            </p>
          </div>
        </div>
        {connectedCount > 0 && (
          <button
            onClick={syncAll}
            disabled={syncingAll || syncEnabledCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-commander-surface border border-commander-border text-white text-xs font-bold hover:border-commander-red transition-all disabled:opacity-50"
          >
            {syncingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync All
          </button>
        )}
      </div>

      {/* Connection status bar */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-3">
        <div className="flex gap-1 mb-2">
          {PROVIDERS.map(p => (
            <div
              key={p}
              className={`flex-1 h-2 rounded-full transition-all ${
                tokens[p] && syncEnabled[p] ? "bg-vellera-green" :
                tokens[p] ? "bg-yellow-600" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-commander-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-vellera-green inline-block" /> Syncing</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-600 inline-block" /> Paused</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700 inline-block" /> Not connected</span>
        </div>
      </div>

      {/* Universal Biometric Dashboard */}
      <div className="rounded-xl overflow-hidden border border-commander-border">
        <iframe
          src="https://untitled-app-da2c66fa.base44.app/UniversalDashboard?app=vellera"
          width="100%"
          height="900"
          style={{ border: "none", borderRadius: "16px" }}
          title="Vellera Biometric Dashboard"
        />
      </div>

      {/* Biometrics Trend Chart */}
      <WearablesBiometricsChart />

      {/* Provider Cards */}
      {loading ? (
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <div key={p} className="h-24 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <WearableProviderCard
              key={p}
              provider={p}
              token={tokens[p] || null}
              syncEnabled={syncEnabled[p]}
              onToggleSync={() => toggleSync(p)}
              onRefresh={fetchTokens}
            />
          ))}
        </div>
      )}

      {/* Analytics Link */}
      <Link to="/wearable-analytics" className="flex items-center justify-between bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4 hover:bg-vellera-blue/20 transition">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-vellera-blue" />
          <div>
            <p className="text-white font-bold text-sm">Deep Analytics</p>
            <p className="text-vellera-blue text-xs">Recovery vs Training Load · HRV · Sleep trends</p>
          </div>
        </div>
        <span className="text-vellera-blue text-xs font-bold">View →</span>
      </Link>

      {/* Info */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-xs text-commander-muted space-y-1">
        <p className="text-white font-bold text-sm mb-2">📡 How it works</p>
        <p>• Connect each provider once via OAuth — no passwords stored.</p>
        <p>• Toggle the sync switch to pause/resume data pulls per device.</p>
        <p>• "Sync All" pulls the last 7 days of HRV, heart rate, strain & sleep.</p>
        <p>• All data populates your Biometrics Trends chart and Recovery widgets.</p>
      </div>
    </div>
  );
}