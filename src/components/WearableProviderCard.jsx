import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, RefreshCw, Unlink, Loader2 } from "lucide-react";

export default function WearableProviderCard({ provider, token, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const PROVIDERS = {
    strava: { label: "Strava", emoji: "🚴", color: "border-orange-600", accent: "text-orange-400", bg: "bg-orange-950/30", startFn: "stravaOAuthStart", syncFn: "stravaSync" },
    google_fit: { label: "Google Fit", emoji: "💚", color: "border-green-600", accent: "text-green-400", bg: "bg-green-950/30", startFn: "googleFitOAuthStart", syncFn: "googleFitSync" },
    fitbit: { label: "Fitbit", emoji: "💙", color: "border-blue-600", accent: "text-blue-400", bg: "bg-blue-950/30", startFn: "fitbitOAuthStart", syncFn: "fitbitSync" },
    polar: { label: "Polar", emoji: "❤️", color: "border-red-600", accent: "text-red-400", bg: "bg-red-950/30", startFn: "polarOAuthStart", syncFn: "polarSync" },
  };

  const cfg = PROVIDERS[provider];
  const connected = !!token;

  const handleConnect = async () => {
    setLoading(true);
    base44.analytics.track({ eventName: "wearable_connect_initiated", properties: { provider } });
    const res = await base44.functions.invoke(cfg.startFn, {});
    const url = res.data?.url;
    if (url) {
      const popup = window.open(url, "_blank", "width=600,height=700");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setLoading(false);
          base44.analytics.track({ eventName: "wearable_connected", properties: { provider } });
          onRefresh();
        }
      }, 500);
    } else {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    base44.analytics.track({ eventName: "wearable_sync", properties: { provider } });
    await base44.functions.invoke(cfg.syncFn, {});
    setSyncing(false);
    onRefresh();
  };

  const handleDisconnect = async () => {
    setLoading(true);
    base44.analytics.track({ eventName: "wearable_disconnected", properties: { provider } });
    await base44.entities.WearableToken.delete(token.id);
    setLoading(false);
    onRefresh();
  };

  return (
    <div className={`border rounded-xl p-4 ${connected ? `${cfg.color} ${cfg.bg}` : "border-commander-border bg-commander-surface"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cfg.emoji}</span>
          <div>
            <p className="text-white font-bold text-sm">{cfg.label}</p>
            {connected && token.last_synced && (
              <p className="text-xs text-commander-muted">
                Synced {new Date(token.last_synced).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {connected && <CheckCircle className={`w-4 h-4 ${cfg.accent}`} />}
      </div>

      {connected ? (
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border ${cfg.color} ${cfg.accent} hover:opacity-80 transition-all`}
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="px-3 py-2 rounded-lg text-xs font-bold border border-red-900 text-red-400 hover:bg-red-950/40 transition-all"
          >
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-white/10 text-white border border-commander-border hover:bg-white/20 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {loading ? "Connecting..." : `Connect ${cfg.label}`}
        </button>
      )}
    </div>
  );
}