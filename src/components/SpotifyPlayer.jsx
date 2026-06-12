import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Search, Play, Pause, SkipForward, Volume2, Music } from 'lucide-react';
import { toast } from 'sonner';

export default function SpotifyPlayer() {
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showSearch, setShowSearch] = useState(false);
  const [audioRef] = useState(new Audio());

  // Load featured playlists on mount
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('spotifyIntegration', {
          action: 'featured',
        });
        setPlaylists(res.playlists);
      } catch (err) {
        toast.error('Failed to load Spotify playlists');
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('spotifyIntegration', {
        action: 'search',
        query: searchQuery,
      });
      setPlaylists(res.playlists);
      setTracks(res.tracks);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Load playlist tracks
  const loadPlaylist = async (playlistId) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('spotifyIntegration', {
        action: 'playlist',
        query: playlistId,
      });
      setCurrentPlaylist(res);
      setTracks(res.tracks);
      setCurrentTrackIndex(0);
      setPlaying(false);
    } catch (err) {
      toast.error('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  // Play track
  const playTrack = (track) => {
    if (track.previewUrl) {
      audioRef.src = track.previewUrl;
      audioRef.volume = volume;
      audioRef.play();
      setPlaying(true);
      toast.success(`Now playing: ${track.name}`);
    } else {
      toast.error('Preview not available for this track');
    }
  };

  // Pause
  const pauseTrack = () => {
    audioRef.pause();
    setPlaying(false);
  };

  // Next track
  const nextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      const nextIdx = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIdx);
      playTrack(tracks[nextIdx]);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 p-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-white" />
        <h3 className="text-white font-bold">Spotify Player</h3>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-commander-border">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center bg-gray-800 border border-commander-border rounded-lg px-3">
            <Search className="w-4 h-4 text-commander-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Search playlists & tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent text-white text-sm outline-none px-2 py-2 placeholder:text-commander-muted"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 min-h-[44px]"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Featured Playlists */}
        {!showSearch && playlists.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {playlists.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  loadPlaylist(p.id);
                  setShowSearch(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm transition-all text-truncate min-h-[40px] flex items-center"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Now Playing */}
      {currentPlaylist && (
        <div className="p-4 border-b border-commander-border">
          <p className="text-xs text-commander-muted mb-2">Now Playing</p>
          <p className="text-white font-bold text-sm">{currentPlaylist.name}</p>
        </div>
      )}

      {/* Current Track */}
      {currentTrack && (
        <div className="p-4 border-b border-commander-border">
          {currentTrack.image && (
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-full aspect-square rounded-lg mb-3 object-cover"
            />
          )}
          <p className="text-white font-bold text-sm">{currentTrack.name}</p>
          <p className="text-commander-muted text-xs">{currentTrack.artist}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => (playing ? pauseTrack() : playTrack(currentTrack))}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              {playing ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Play Preview
                </>
              )}
            </button>
            <button
              onClick={nextTrack}
              disabled={currentTrackIndex >= tracks.length - 1}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-all disabled:opacity-60 min-h-[44px]"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Volume Control */}
      {playing && (
        <div className="p-4 border-b border-commander-border">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-commander-muted flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const newVol = parseFloat(e.target.value);
                setVolume(newVol);
                audioRef.volume = newVol;
              }}
              className="flex-1 accent-green-600"
            />
          </div>
        </div>
      )}

      {/* Tracks List */}
      {tracks.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => {
                setCurrentTrackIndex(idx);
                playTrack(track);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm min-h-[40px] ${
                idx === currentTrackIndex
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              <p className="font-medium truncate">{track.name}</p>
              <p className="text-xs opacity-75">{track.artist}</p>
            </button>
          ))}
        </div>
      )}

      {!loading && tracks.length === 0 && (
        <div className="p-4 text-center text-commander-muted text-sm">
          Search or select a playlist to get started
        </div>
      )}
    </div>
  );
}