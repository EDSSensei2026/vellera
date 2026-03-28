import { X } from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return null;
  // Handle youtu.be short links
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // Handle youtube.com/watch?v=
  const longMatch = url.match(/[?&]v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  // Handle youtube.com/embed/ already
  if (url.includes("youtube.com/embed/")) return url;
  return url;
}

export default function VideoModal({ tech, onClose }) {
  const embedUrl = getEmbedUrl(tech.video_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="w-full max-w-lg bg-commander-surface border border-commander-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-commander-border">
          <div>
            <p className="text-white font-bold text-sm">{tech.name}</p>
            <p className="text-commander-muted text-xs">{tech.category}</p>
          </div>
          <button onClick={onClose} className="text-commander-muted hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Video */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={tech.name}
          />
        </div>
        {tech.description && (
          <div className="px-4 py-3 border-t border-commander-border">
            <p className="text-commander-muted text-xs">{tech.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}