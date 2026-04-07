import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WearableProviderCard from "../components/WearableProviderCard";
import WearablesBiometricsChart from "../components/WearablesBiometricsChart";
import { Activity, RefreshCw, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

const PROVIDERS = ["fitbit", "strava", "polar", "whoop"];

const PROVIDER_META = {
  fitbit: { syncFn: "fitbitSync" },
  strava: { syncFn: "stravaSync" },
  polar:  { syncFn: "polarSync" },
  whoop:  { syncFn: "whoopSync" },
};

export default function WearablesHub() {
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wearable_sync_enabled") || "{}"); }
    catch { return {}; }
  });

  const fetchTokens = async () => {
    setLoading(true);
    const all = await base44.entities.WearableToken.list();
    const map = {};
    all.forEach(t => { map[t.provider] = t; });
    setTokens(map);
    setLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const toggleSync = (provider) => {
    setSyncEnabled(prev => {
      const next = { ...prev, [provider]: !prev[provider] };
      localStorage.setItem("wearable_sync_enabled", JSON.stringify(next));
      return next;
    });
  };

  const syncAll = async () => {
    setSyncingAll(true);
    const active = PROVIDERS.filter(p => tokens[p] && syncEnabled[p] !== false);
    await Promise.all(active.map(p =>
      base44.functions.invoke(PROVIDER_META[p].syncFn, {}).catch(() => {})
    ));
    await fetchTokens();
    setSyncingAll(false);
  };

  const connectedCount = PROVIDERS.filter(p => tokens[p]).length;
  const enabledCount = PROVIDERS.filter(p => tokens[p] && syncEnabled[p] !== false).length;

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-commander-red rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">Wearables Hub</h1>
            <p className="text-commander-muted text-xs">{connectedCount} connected · {enabledCount} syncing</p>
          </div>
        </div>
        {connectedCount > 0 && (
          <button
            onClick={syncAll}
            disabled={syncingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-commander-surface border border-commander-border text-white text-xs font-bold hover:border-commander-red transition-all"
          >
            {syncingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync All
          </button>
        )}
      </div>

      {/* Biometrics Chart */}
      <WearablesBiometricsChart />

      {/* Device Cards with sync toggle */}
      <div>
        <p className="text-white font-black text-sm mb-3 uppercase tracking-wider">Connected Devices</p>
        {loading ? (
          <div className="space-y-3">
            {PROVIDERS.map(p => (
              <div key={p} className="h-24 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {PROVIDERS.map(p => {
              const isConnected = !!tokens[p];
              const isEnabled = syncEnabled[p] !== false;
              return (
                <div key={p}>
                  <WearableProviderCard
                    provider={p}
                    token={tokens[p] || null}
                    onRefresh={fetchTokens}
                  />
                  {isConnected && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 border-x border-b border-commander-border rounded-b-xl -mt-1">
                      <span className="text-xs text-gray-400">Auto-sync enabled</span>
                      <button
                        onClick={() => toggleSync(p)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isEnabled ? "text-vellera-green" : "text-gray-600"}`}
                      >
                        {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {isEnabled ? "On" : "Off"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-xs text-commander-muted space-y-1">
        <p className="text-white font-bold text-sm mb-2">📡 How it works</p>
        <p>• Connect each provider once via OAuth — no passwords stored.</p>
        <p>• Toggle auto-sync per device using the switch below each card.</p>
        <p>• "Sync All" pulls the last 7 days from all enabled devices.</p>
        <p>• HRV, resting HR, and training strain feed directly into the chart above.</p>
      </div>
    </div>
  );
}