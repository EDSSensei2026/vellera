import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Upload, X, GitCompare, Camera, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PROTOCOL_START = new Date("2026-04-06");
const PHASES = ["Shred", "Maintain", "Build"];
const POSES = ["Front", "Side", "Back", "Flex"];
const BELTS = ["White", "Blue", "Purple", "Brown", "Black"];

function weeksSince(dateStr) {
  const d = new Date(dateStr);
  const diff = (d - PROTOCOL_START) / (1000 * 60 * 60 * 24 * 7);
  return Math.max(1, Math.round(diff));
}

function PhotoCard({ entry, onSelect, selected, onDelete }) {
  return (
    <div
      onClick={() => onSelect(entry)}
      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        selected ? "border-vellera-green" : "border-commander-border hover:border-vellera-blue"
      }`}
    >
      <img src={entry.photo_url} alt={entry.date} className="w-full aspect-[3/4] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-xs font-bold">{entry.date}</p>
        {entry.weight_lbs && <p className="text-vellera-green text-xs">{entry.weight_lbs} lbs</p>}
        <div className="flex gap-1 mt-0.5 flex-wrap">
          {entry.pose && <span className="text-xs bg-black/50 text-gray-300 px-1 rounded">{entry.pose}</span>}
          {entry.phase && <span className="text-xs bg-black/50 text-vellera-blue px-1 rounded">{entry.phase}</span>}
        </div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-vellera-green rounded-full flex items-center justify-center">
          <span className="text-black text-xs font-black">✓</span>
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
        className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

export default function PhysiqueTrackerPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState("gallery"); // "gallery" | "compare" | "upload"
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [selectingFor, setSelectingFor] = useState(null); // "A" | "B" | null

  // Upload form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight_lbs: "",
    body_fat_pct: "",
    phase: "Shred",
    pose: "Front",
    bjj_belt: "White",
    notes: "",
  });

  useEffect(() => {
    base44.entities.PhysiqueTracker.list("-date", 50)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const weekNum = weeksSince(form.date);
      const created = await base44.entities.PhysiqueTracker.create({
        ...form,
        photo_url: file_url,
        weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : undefined,
        body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : undefined,
        week_number: weekNum,
      });
      setEntries(prev => [created, ...prev]);
      setView("gallery");
      setForm(f => ({ ...f, weight_lbs: "", body_fat_pct: "", notes: "" }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.PhysiqueTracker.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (compareA?.id === id) setCompareA(null);
    if (compareB?.id === id) setCompareB(null);
  };

  const handleSelectForCompare = (entry) => {
    if (selectingFor === "A") { setCompareA(entry); setSelectingFor(null); }
    else if (selectingFor === "B") { setCompareB(entry); setSelectingFor(null); }
  };

  // Weight delta for comparison
  const weightDelta = compareA && compareB
    ? (parseFloat(compareB.weight_lbs) - parseFloat(compareA.weight_lbs)).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Physique Tracker</h1>
            <p className="text-commander-muted text-xs">{entries.length} photos logged · Zulu Warrior Recomp</p>
          </div>
        </div>
        <button
          onClick={() => setView("upload")}
          className="bg-vellera-green text-commander-dark font-bold px-3 py-2 rounded-lg flex items-center gap-1 text-sm hover:bg-vellera-blue transition-all"
        >
          <Camera className="w-4 h-4" /> Add
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-commander-border">
        {[
          { id: "gallery", label: "📸 Gallery" },
          { id: "compare", label: "⚖️ Compare" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`pb-3 px-4 font-semibold text-sm transition-all ${
              view === tab.id ? "text-vellera-blue border-b-2 border-vellera-blue" : "text-commander-muted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Form */}
      {view === "upload" && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <p className="text-white font-bold">New Progress Photo</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-commander-muted text-xs block mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-commander-muted text-xs block mb-1">Weight (lbs)</label>
              <input type="number" placeholder="e.g. 258" value={form.weight_lbs} onChange={e => setForm(f => ({ ...f, weight_lbs: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-commander-muted text-xs block mb-1">Phase</label>
              <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
                {PHASES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-commander-muted text-xs block mb-1">Pose</label>
              <select value={form.pose} onChange={e => setForm(f => ({ ...f, pose: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
                {POSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-commander-muted text-xs block mb-1">BJJ Belt</label>
              <select value={form.bjj_belt} onChange={e => setForm(f => ({ ...f, bjj_belt: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm">
                {BELTS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-commander-muted text-xs block mb-1">Body Fat %</label>
              <input type="number" placeholder="optional" value={form.body_fat_pct} onChange={e => setForm(f => ({ ...f, body_fat_pct: e.target.value }))}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div>
            <label className="text-commander-muted text-xs block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How are you feeling? BJJ progress notes…"
              className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" rows={2} />
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full bg-vellera-green text-commander-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-vellera-blue transition-all disabled:opacity-60"
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-commander-dark border-t-transparent rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="w-4 h-4" /> Choose & Upload Photo</>
            )}
          </button>
          <button onClick={() => setView("gallery")} className="w-full text-commander-muted text-sm hover:text-white transition-all">
            Cancel
          </button>
        </div>
      )}

      {/* Gallery */}
      {view === "gallery" && (
        <>
          {entries.length === 0 ? (
            <div className="bg-commander-surface border border-dashed border-commander-border rounded-xl p-10 text-center">
              <Camera className="w-10 h-10 mx-auto text-commander-muted mb-3 opacity-40" />
              <p className="text-commander-muted text-sm">No progress photos yet.</p>
              <button onClick={() => setView("upload")} className="mt-3 text-vellera-blue text-sm font-bold hover:text-vellera-green">
                Add your first photo →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {entries.map(entry => (
                <PhotoCard
                  key={entry.id}
                  entry={entry}
                  onSelect={() => {}}
                  selected={false}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Compare View */}
      {view === "compare" && (
        <div className="space-y-4">
          {/* Side-by-side display */}
          <div className="grid grid-cols-2 gap-3">
            {/* Slot A */}
            <div className="space-y-2">
              <p className="text-commander-muted text-xs font-bold uppercase text-center">Before</p>
              {compareA ? (
                <div className="relative rounded-xl overflow-hidden border border-vellera-blue">
                  <img src={compareA.photo_url} alt="Before" className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-xs">
                    <p className="text-white font-bold">{compareA.date}</p>
                    {compareA.weight_lbs && <p className="text-vellera-blue">{compareA.weight_lbs} lbs</p>}
                  </div>
                  <button onClick={() => setCompareA(null)} className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectingFor("A")}
                  className={`w-full aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                    selectingFor === "A" ? "border-vellera-blue bg-vellera-blue/10" : "border-commander-border hover:border-vellera-blue"
                  }`}
                >
                  <Camera className="w-6 h-6 text-commander-muted" />
                  <span className="text-commander-muted text-xs">{selectingFor === "A" ? "Tap a photo below" : "Select photo"}</span>
                </button>
              )}
            </div>

            {/* Slot B */}
            <div className="space-y-2">
              <p className="text-commander-muted text-xs font-bold uppercase text-center">After</p>
              {compareB ? (
                <div className="relative rounded-xl overflow-hidden border border-vellera-green">
                  <img src={compareB.photo_url} alt="After" className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-xs">
                    <p className="text-white font-bold">{compareB.date}</p>
                    {compareB.weight_lbs && <p className="text-vellera-green">{compareB.weight_lbs} lbs</p>}
                  </div>
                  <button onClick={() => setCompareB(null)} className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectingFor("B")}
                  className={`w-full aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                    selectingFor === "B" ? "border-vellera-green bg-vellera-green/10" : "border-commander-border hover:border-vellera-green"
                  }`}
                >
                  <Camera className="w-6 h-6 text-commander-muted" />
                  <span className="text-commander-muted text-xs">{selectingFor === "B" ? "Tap a photo below" : "Select photo"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Delta Stats */}
          {compareA && compareB && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <p className="text-white font-bold text-sm">Recomp Delta</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {weightDelta !== null && !isNaN(weightDelta) && (
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className={`text-lg font-black ${parseFloat(weightDelta) < 0 ? "text-vellera-green" : "text-red-400"}`}>
                      {parseFloat(weightDelta) > 0 ? "+" : ""}{weightDelta}
                    </p>
                    <p className="text-commander-muted text-xs">lbs</p>
                  </div>
                )}
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-vellera-blue text-sm font-black">
                    {Math.abs(Math.round((new Date(compareB.date) - new Date(compareA.date)) / (1000 * 60 * 60 * 24 * 7)))} wks
                  </p>
                  <p className="text-commander-muted text-xs">apart</p>
                </div>
                {compareA.bjj_belt !== compareB.bjj_belt && (
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-vellera-green text-xs font-black">{compareA.bjj_belt} → {compareB.bjj_belt}</p>
                    <p className="text-commander-muted text-xs">Belt</p>
                  </div>
                )}
              </div>
              {compareA.notes && <p className="text-commander-muted text-xs">Before: "{compareA.notes}"</p>}
              {compareB.notes && <p className="text-commander-muted text-xs">After: "{compareB.notes}"</p>}
            </div>
          )}

          {/* Photo picker grid */}
          {selectingFor && (
            <div>
              <p className="text-vellera-blue text-sm font-bold mb-2">
                Select {selectingFor === "A" ? "Before" : "After"} photo:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {entries.map(entry => (
                  <PhotoCard
                    key={entry.id}
                    entry={entry}
                    onSelect={handleSelectForCompare}
                    selected={(selectingFor === "A" && compareA?.id === entry.id) || (selectingFor === "B" && compareB?.id === entry.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {!selectingFor && entries.length > 0 && (
            <div>
              <p className="text-commander-muted text-xs mb-2">All Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {entries.map(entry => (
                  <PhotoCard
                    key={entry.id}
                    entry={entry}
                    onSelect={() => {
                      if (!compareA) setCompareA(entry);
                      else if (!compareB) setCompareB(entry);
                    }}
                    selected={compareA?.id === entry.id || compareB?.id === entry.id}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}