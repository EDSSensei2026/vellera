import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WearableProviderCard from "../components/WearableProviderCard";
import { Activity, RefreshCw, Loader2 } from "lucide-react";

const PROVIDERS = ["strava", "google_fit", "fitbit", "polar"];

export default function WearablesHub() {
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    const all = await base44.entities.WearableToken.list();
    const map = {};
    all.forEach(t => { map[t.provider] = t; });
    setTokens(map);
    setLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const syncAll = async () => {
    setSyncingAll(true);
    const syncFns = { strava: "stravaSync", google_fit: "googleFitSync", fitbit: "fitbitSync", polar: "polarSync" };
    const connected = PROVIDERS.filter(p => tokens[p]);
    await Promise.all(connected.map(p => base44.functions.invoke(syncFns[p], {}).catch(() => {})));
    await fetchTokens();
    setSyncingAll(false);
  };

  const connectedCount = PROVIDERS.filter(p => tokens[p]).length;

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
            <p className="text-commander-muted text-xs">{connectedCount} of {PROVIDERS.length} connected</p>
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

      {/* Status bar */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-3">
        <div className="flex gap-1 mb-2">
          {PROVIDERS.map(p => (
            <div key={p} className={`flex-1 h-2 rounded-full ${tokens[p] ? "bg-green-500" : "bg-gray-700"}`} />
          ))}
        </div>
        <p className="text-commander-muted text-xs">
          {connectedCount === 0
            ? "Connect wearables to auto-sync biometric data into your dashboard."
            : `${connectedCount} provider${connectedCount > 1 ? "s" : ""} syncing — data flows into BiometricLog automatically.`}
        </p>
      </div>

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
              onRefresh={fetchTokens}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-xs text-commander-muted space-y-1">
        <p className="text-white font-bold text-sm mb-2">📡 How it works</p>
        <p>• Connect each provider once via OAuth — no passwords stored.</p>
        <p>• "Sync Now" pulls the last 7 days of activity, heart rate, sleep & calories.</p>
        <p>• All data writes into your BiometricLog and powers your Recovery & Dashboard widgets.</p>
        <p>• Whoop is managed separately on the Dashboard.</p>
      </div>
    </div>
  );
}