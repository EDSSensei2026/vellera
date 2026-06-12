import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { Upload, Zap, Watch, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

/**
 * WearableImport
 * Supports:
 *  - Whoop CSV export (physiological_cycles.csv)
 *  - Apple Health export via CSV (manual export apps)
 *  - Quick manual entry for any wearable
 */

function parseWhoopCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]; });

    // Whoop columns → BiometricLog fields
    const dateRaw = row["cycle start time"] || row["date"] || "";
    const date = dateRaw ? dateRaw.split(" ")[0].split("T")[0] : null;
    if (!date) return null;

    return {
      date,
      recovery_pct: parseFloat(row["recovery score %"] || row["recovery"] || "") || null,
      hrv: parseFloat(row["heart rate variability (ms)"] || row["hrv"] || "") || null,
      rhr: parseFloat(row["resting heart rate (bpm)"] || row["rhr"] || "") || null,
      sleep_performance: parseFloat(row["sleep performance %"] || row["sleep efficiency %"] || "") || null,
      strain: parseFloat(row["day strain"] || row["strain"] || "") || null,
    };
  }).filter(Boolean);
}

function parseAppleCSV(text) {
  // Apple Health CSV (via apps like Health Export)
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());

  const byDate = {};
  lines.slice(1).forEach(line => {
    const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]; });
    const date = (row["startdate"] || row["date"] || "").split(" ")[0].split("T")[0];
    if (!date) return;
    if (!byDate[date]) byDate[date] = {};
    const type = row["type"] || "";
    const val = parseFloat(row["value"] || "");
    if (type.toLowerCase().includes("heartratevariability")) byDate[date].hrv = val;
    if (type.toLowerCase().includes("restingheartrate")) byDate[date].rhr = val;
    if (type.toLowerCase().includes("sleepanalysis") && !isNaN(val)) byDate[date].sleep_performance = val;
  });

  return Object.entries(byDate).map(([date, d]) => ({ date, ...d })).filter(d => d.hrv || d.rhr);
}

export default function WearableImport() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("manual"); // "manual" | "whoop" | "apple"
  const [importing, setImporting] = useState(false);

  // Manual entry state
  const [manual, setManual] = useState({
    date: new Date().toISOString().split("T")[0],
    recovery_pct: "",
    hrv: "",
    rhr: "",
    sleep_performance: "",
    body_battery: "",
    strain: "",
    weight_lbs: "",
    water_oz: "",
  });

  const handleManualSave = async () => {
    setImporting(true);
    try {
      const existing = await base44.entities.BiometricLog.filter({ date: manual.date });
      const payload = Object.fromEntries(
        Object.entries(manual).filter(([k, v]) => v !== "" && k !== "date").map(([k, v]) => [k, parseFloat(v)])
      );
      payload.date = manual.date;

      if (existing[0]) {
        await base44.entities.BiometricLog.update(existing[0].id, payload);
        toast.success("Biometrics updated for " + manual.date);
      } else {
        await base44.entities.BiometricLog.create(payload);
        toast.success("Biometrics logged for " + manual.date);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = mode === "whoop" ? parseWhoopCSV(text) : parseAppleCSV(text);
      if (rows.length === 0) { toast.error("No valid rows found. Check the file format."); return; }

      let saved = 0;
      for (const row of rows) {
        const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v != null && !isNaN(v)));
        clean.date = row.date;
        const existing = await base44.entities.BiometricLog.filter({ date: row.date });
        if (existing[0]) {
          await base44.entities.BiometricLog.update(existing[0].id, clean);
        } else {
          await base44.entities.BiometricLog.create(clean);
        }
        saved++;
      }
      toast.success(`Imported ${saved} days of wearable data!`);
      e.target.value = "";
    } catch (err) {
      toast.error("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const MANUAL_FIELDS = [
    { key: "recovery_pct", label: "Recovery %", placeholder: "0–100", unit: "%", color: "text-green-400" },
    { key: "hrv", label: "HRV", placeholder: "ms", unit: "ms", color: "text-blue-400" },
    { key: "rhr", label: "Resting HR", placeholder: "bpm", unit: "bpm", color: "text-red-400" },
    { key: "sleep_performance", label: "Sleep %", placeholder: "0–100", unit: "%", color: "text-purple-400" },
    { key: "body_battery", label: "Body Battery", placeholder: "Garmin 0–100", unit: "", color: "text-yellow-400" },
    { key: "strain", label: "Strain", placeholder: "Whoop 0–21", unit: "", color: "text-orange-400" },
    { key: "weight_lbs", label: "Weight", placeholder: "lbs", unit: "lbs", color: "text-gray-400" },
    { key: "water_oz", label: "Water", placeholder: "oz", unit: "oz", color: "text-cyan-400" },
  ];

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <Watch className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-white text-sm font-bold">Wearable Data Import</span>
          <span className="text-xs text-gray-500 hidden sm:inline">Whoop · Apple Watch · Garmin</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <div className="border-t border-commander-border p-4 space-y-4">
          {/* Mode Tabs */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {[["manual", "⌨️ Manual"], ["whoop", "💪 Whoop CSV"], ["apple", "🍎 Apple CSV"]].map(([key, label]) => (
              <button key={key} onClick={() => setMode(key)}
                className={`flex-1 py-2 text-xs font-bold transition-all min-h-[44px] ${mode === key ? "bg-[#00E5FF20] text-[#00E5FF]" : "text-gray-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Manual Entry */}
          {mode === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <input type="date" value={manual.date} onChange={e => setManual(m => ({ ...m, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00E5FF] min-h-[44px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MANUAL_FIELDS.map(({ key, label, placeholder, unit, color }) => (
                  <div key={key}>
                    <label className={`text-xs block mb-1 ${color}`}>{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={manual[key]}
                        onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00E5FF] min-h-[44px] pr-8"
                      />
                      {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">{unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleManualSave} disabled={importing}
                className="w-full py-3 rounded-xl bg-[#00E5FF] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Save to Recovery Dashboard
              </button>
            </div>
          )}

          {/* CSV Import */}
          {(mode === "whoop" || mode === "apple") && (
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                {mode === "whoop" ? (
                  <>
                    <p className="text-[#00E5FF] font-bold">How to export from Whoop:</p>
                    <p>1. Open Whoop app → Profile → Privacy & Security</p>
                    <p>2. Tap "Request My Data" → Download CSV</p>
                    <p>3. Upload the <span className="text-white">physiological_cycles.csv</span> file below</p>
                  </>
                ) : (
                  <>
                    <p className="text-[#00E5FF] font-bold">How to export from Apple Health:</p>
                    <p>1. Use "Health Auto Export" app (free on App Store)</p>
                    <p>2. Export HRV, Resting HR, Sleep data as CSV</p>
                    <p>3. Upload the CSV file below</p>
                  </>
                )}
              </div>

              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-700 hover:border-[#00E5FF] rounded-xl cursor-pointer transition-all py-8 bg-gray-900">
                <input type="file" accept=".csv" className="hidden" onChange={handleFileImport} disabled={importing} />
                {importing ? (
                  <><Loader2 className="w-6 h-6 text-[#00E5FF] animate-spin mb-2" /><p className="text-[#00E5FF] text-sm font-bold">Importing...</p></>
                ) : (
                  <><Upload className="w-6 h-6 text-gray-500 mb-2" /><p className="text-gray-400 text-sm">Tap to upload CSV file</p><p className="text-gray-600 text-xs mt-1">Auto-detects and maps all columns</p></>
                )}
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}