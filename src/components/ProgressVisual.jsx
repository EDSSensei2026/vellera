import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ProgressVisual: High-contrast branded stats card for Instagram/TikTok
 * Shows: Volume, Intensity, Streak, Technique Focus
 */
export default function ProgressVisual({ sessionData, userName }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const stats = {
    volume: sessionData?.total_weight || 0,
    reps: sessionData?.total_reps || 0,
    duration: sessionData?.duration_minutes || 0,
    exercises: sessionData?.exercise_count || 0,
    streak: sessionData?.streak_days || 0,
  };

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `vellera-training-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      toast.success('Training card downloaded!');
    } catch (err) {
      toast.error('Failed to download: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card */}
      <div
        ref={cardRef}
        className="aspect-square max-w-sm mx-auto bg-gradient-to-br from-vellera-dark via-commander-surface to-vellera-dark border-2 border-vellera-green rounded-2xl p-6 flex flex-col justify-between"
      >
        {/* Header */}
        <div>
          <p className="text-vellera-green text-xs uppercase tracking-widest font-black">Today's Training</p>
          <h2 className="text-white text-2xl font-black mt-2">{userName}</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="bg-vellera-green/20 border border-vellera-green rounded-lg p-4 text-center">
            <p className="text-vellera-green text-3xl font-black">{(stats.volume / 1000).toFixed(1)}k</p>
            <p className="text-white text-xs font-bold mt-1">VOLUME (lbs)</p>
          </div>
          <div className="bg-vellera-blue/20 border border-vellera-blue rounded-lg p-4 text-center">
            <p className="text-vellera-blue text-3xl font-black">{stats.reps}</p>
            <p className="text-white text-xs font-bold mt-1">REPS</p>
          </div>
          <div className="bg-vellera-green/20 border border-vellera-green rounded-lg p-4 text-center">
            <p className="text-vellera-green text-3xl font-black">{stats.duration}</p>
            <p className="text-white text-xs font-bold mt-1">MINUTES</p>
          </div>
          <div className="bg-vellera-blue/20 border border-vellera-blue rounded-lg p-4 text-center">
            <p className="text-vellera-blue text-3xl font-black">{stats.streak}</p>
            <p className="text-white text-xs font-bold mt-1">DAY STREAK</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-vellera-green/40 pt-4 text-center">
          <p className="text-white text-xs font-bold">TRACKED ON VELLERA</p>
          <p className="text-vellera-green text-xs mt-1">vellera.app</p>
        </div>
      </div>

      {/* Download + Share */}
      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="bg-vellera-blue/20 border border-vellera-blue rounded-lg py-3 text-vellera-blue font-bold text-sm flex items-center justify-center gap-2 hover:bg-vellera-blue/30 transition disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download
        </button>
        <button
          onClick={() => window.open('https://instagram.com', '_blank')}
          className="bg-vellera-green/20 border border-vellera-green rounded-lg py-3 text-vellera-green font-bold text-sm flex items-center justify-center gap-2 hover:bg-vellera-green/30 transition"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}