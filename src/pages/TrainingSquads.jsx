import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MessageSquare, Plus, LogIn, Copy, ThumbsUp, Share2 } from "lucide-react";
import BackButton from "../components/BackButton";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

// ── Sub-components ────────────────────────────────────────────────────────────

function LeaderboardRow({ member, rank }) {
  const medal = MEDAL[rank] || `#${rank + 1}`;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rank === 0 ? "border-yellow-700 bg-yellow-950/20" : "border-gray-800 bg-gray-900/50"}`}>
      <span className="text-xl w-7 text-center">{medal}</span>
      <div className="flex-1">
        <p className="text-white text-sm font-bold">{member.display_name}</p>
        <p className="text-gray-500 text-xs">{member.streak_days || 0} day streak</p>
      </div>
      <div className="text-right">
        <p className="text-[#CCFF00] font-black text-sm">{member.total_sessions || 0}</p>
        <p className="text-gray-600 text-xs">sessions</p>
      </div>
      <div className="text-right">
        <p className="text-[#00E5FF] font-black text-sm">{member.total_minutes || 0}</p>
        <p className="text-gray-600 text-xs">min</p>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserEmail, onLike, onComment }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const liked = post.likes?.includes(currentUserEmail);

  const submit = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
    setCommentOpen(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="w-9 h-9 rounded-full bg-commander-red flex items-center justify-center text-white font-black text-sm">
          {post.author_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-bold">{post.author_name}</p>
          <p className="text-gray-500 text-xs">{timeAgo(post.created_date)}</p>
        </div>
        {post.post_type === "analysis_share" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00E5FF15] border border-[#00E5FF30] text-[#00E5FF]">
            🎯 Analysis
          </span>
        )}
        {post.post_type === "milestone" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-950 border border-yellow-800 text-yellow-400">
            🏆 Milestone
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.content && <p className="text-gray-300 text-sm leading-relaxed mb-2">{post.content}</p>}

        {/* Analysis card */}
        {post.post_type === "analysis_share" && post.analysis_score != null && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs">{post.session_type}</p>
              <span className={`font-black text-lg ${post.analysis_score >= 80 ? "text-green-400" : post.analysis_score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                {post.analysis_score}/100
              </span>
            </div>
            {post.analysis_errors?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.analysis_errors.slice(0, 3).map((e, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-950/50 border border-red-900 text-red-400">{e}</span>
                ))}
              </div>
            )}
            {post.analysis_cues?.length > 0 && (
              <div className="space-y-0.5">
                {post.analysis_cues.slice(0, 2).map((cue, i) => (
                  <p key={i} className="text-xs text-gray-400"><span className="text-[#00E5FF]">→</span> {cue}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-800 px-4 py-2 flex items-center gap-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-[#00E5FF]" : "text-gray-500 hover:text-white"}`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs">{post.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => setCommentOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {post.comments?.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-2 space-y-2">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs font-bold text-[#00E5FF]">{c.author}:</span>
              <span className="text-xs text-gray-300">{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {commentOpen && (
        <div className="border-t border-gray-800 px-4 py-3 flex gap-2">
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add feedback..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] min-h-[44px]"
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-[#00E5FF] text-black text-sm font-bold min-h-[44px]">Send</button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingSquads() {
  const [tab, setTab] = useState("squads");
  const [user, setUser] = useState(null);
  const [mySquads, setMySquads] = useState([]);
  const [activeSquad, setActiveSquad] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create squad
  const [showCreate, setShowCreate] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [squadDesc, setSquadDesc] = useState("");
  const [squadEmoji, setSquadEmoji] = useState("🥋");

  // Join squad
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Share analysis
  const [showShare, setShowShare] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [recentAnalysis, setRecentAnalysis] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadMySquads(u.email);
      base44.entities.VideoVault.filter({ analyzed: true }).then(vids => {
        setRecentAnalysis(vids.slice(0, 5));
      }).catch(() => {});
    });
  }, []);

  const loadMySquads = async (email) => {
    setLoading(true);
    try {
      const memberships = await base44.entities.SquadMembership.filter({ user_email: email });
      if (memberships.length === 0) { setLoading(false); return; }
      const squadIds = [...new Set(memberships.map(m => m.squad_id))];
      const squads = await Promise.all(squadIds.map(id => base44.entities.TrainingSquad.filter({ id }).then(r => r[0])));
      const valid = squads.filter(Boolean);
      setMySquads(valid);
      if (valid.length > 0 && !activeSquad) {
        selectSquad(valid[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectSquad = async (squad) => {
    setActiveSquad(squad);
    const [mems, sqPosts] = await Promise.all([
      base44.entities.SquadMembership.filter({ squad_id: squad.id }),
      base44.entities.SquadPost.filter({ squad_id: squad.id }),
    ]);
    setMembers(mems.sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0)));
    setPosts(sqPosts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  const handleCreate = async () => {
    if (!squadName.trim()) { toast.error("Squad needs a name"); return; }
    const code = makeCode();
    const squad = await base44.entities.TrainingSquad.create({
      name: squadName.trim(),
      description: squadDesc.trim(),
      emoji: squadEmoji,
      invite_code: code,
    });
    await base44.entities.SquadMembership.create({
      squad_id: squad.id,
      user_email: user.email,
      display_name: user.full_name || user.email.split("@")[0],
      role: "captain",
      total_sessions: 0,
      total_minutes: 0,
      streak_days: 0,
    });
    toast.success(`Squad "${squad.name}" created! Code: ${code}`);
    setShowCreate(false);
    setSquadName(""); setSquadDesc(""); setSquadEmoji("🥋");
    loadMySquads(user.email);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const squads = await base44.entities.TrainingSquad.filter({ invite_code: joinCode.trim().toUpperCase() });
    if (!squads[0]) { toast.error("Invalid invite code"); return; }
    const squad = squads[0];
    const existing = await base44.entities.SquadMembership.filter({ squad_id: squad.id, user_email: user.email });
    if (existing.length > 0) { toast.info("You're already in this squad!"); setShowJoin(false); return; }
    await base44.entities.SquadMembership.create({
      squad_id: squad.id,
      user_email: user.email,
      display_name: user.full_name || user.email.split("@")[0],
      role: "member",
      total_sessions: 0,
      total_minutes: 0,
      streak_days: 0,
    });
    toast.success(`Joined "${squad.name}"!`);
    setShowJoin(false);
    setJoinCode("");
    loadMySquads(user.email);
  };

  const handleShare = async (analysis) => {
    if (!activeSquad) { toast.error("Select a squad first"); return; }
    await base44.entities.SquadPost.create({
      squad_id: activeSquad.id,
      author_email: user.email,
      author_name: user.full_name || user.email.split("@")[0],
      post_type: "analysis_share",
      content: shareContent.trim() || null,
      analysis_score: analysis?.posture_score,
      analysis_errors: analysis?.ai_coaching_cues?.slice(0, 3) || [],
      analysis_cues: analysis?.ai_coaching_cues || [],
      session_type: analysis?.session_type,
      media_url: analysis?.video_url,
      likes: [],
      comments: [],
    });
    toast.success("Shared with your squad!");
    setShowShare(false);
    setShareContent("");
    selectSquad(activeSquad);
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    const likes = post.likes || [];
    const updated = likes.includes(user.email)
      ? likes.filter(e => e !== user.email)
      : [...likes, user.email];
    await base44.entities.SquadPost.update(postId, { likes: updated });
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: updated } : p));
  };

  const handleComment = async (postId, text) => {
    const post = posts.find(p => p.id === postId);
    const comments = [...(post.comments || []), {
      author: user?.full_name || "You",
      text,
      timestamp: new Date().toISOString(),
    }];
    await base44.entities.SquadPost.update(postId, { comments });
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments } : p));
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BackButton to="/" />
          <div>
            <h1 className="text-white text-xl font-black tracking-tight">Training Squads</h1>
            <p className="text-gray-500 text-xs">Train together. Push each other.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="p-2 rounded-lg border border-gray-700 hover:border-[#00E5FF] text-gray-400 hover:text-[#00E5FF] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" title="Join squad">
            <LogIn className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="p-2 rounded-lg bg-commander-red hover:bg-red-700 text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center" title="Create squad">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* No squads empty state */}
      {!loading && mySquads.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
          <p className="text-4xl">🥋</p>
          <p className="text-white font-bold text-lg">No Squads Yet</p>
          <p className="text-gray-500 text-sm">Create a squad or join one with an invite code to start training together.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-commander-red text-white text-sm font-bold min-h-[44px]">Create Squad</button>
            <button onClick={() => setShowJoin(true)} className="px-4 py-2.5 rounded-xl border border-gray-700 text-white text-sm font-bold min-h-[44px]">Join Squad</button>
          </div>
        </div>
      )}

      {mySquads.length > 0 && (
        <>
          {/* Squad Selector */}
          {mySquads.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mySquads.map(sq => (
                <button key={sq.id} onClick={() => selectSquad(sq)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${activeSquad?.id === sq.id ? "bg-commander-red border-commander-red text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                  <span>{sq.emoji}</span>{sq.name}
                </button>
              ))}
            </div>
          )}

          {/* Active Squad Header */}
          {activeSquad && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl mb-1">{activeSquad.emoji}</p>
                  <p className="text-white font-black text-lg">{activeSquad.name}</p>
                  {activeSquad.description && <p className="text-gray-400 text-xs mt-0.5">{activeSquad.description}</p>}
                  <p className="text-gray-500 text-xs mt-1">{members.length} member{members.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(activeSquad.invite_code); toast.success("Code copied!"); }}
                  className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 hover:border-[#00E5FF] rounded-xl px-3 py-2 text-xs font-bold text-gray-400 hover:text-[#00E5FF] transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {activeSquad.invite_code}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {[["leaderboard", "🏆 Leaderboard"], ["feed", "📣 Feed"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-2.5 text-xs font-bold transition-all min-h-[44px] ${tab === key ? "bg-commander-red text-white" : "text-gray-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          {tab === "leaderboard" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 px-4 pb-1">
                <span>Athlete</span>
                <div className="flex gap-6">
                  <span className="text-[#CCFF00]">Sessions</span>
                  <span className="text-[#00E5FF]">Minutes</span>
                </div>
              </div>
              {members.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-6">No members yet. Share the invite code!</p>
              ) : (
                members.map((m, i) => <LeaderboardRow key={m.id} member={m} rank={i} />)
              )}
              <p className="text-xs text-gray-700 text-center pt-1">Stats sync when members log sessions</p>
            </div>
          )}

          {/* Feed */}
          {tab === "feed" && (
            <div className="space-y-3">
              {/* Share button */}
              <button onClick={() => setShowShare(true)}
                className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-[#00E5FF] rounded-2xl px-4 py-3 text-gray-500 hover:text-[#00E5FF] transition-all text-sm min-h-[44px]">
                <Share2 className="w-4 h-4" />
                Share an analysis or achievement...
              </button>

              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📣</p>
                  <p className="text-gray-500 text-sm">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserEmail={user?.email} onLike={handleLike} onComment={handleComment} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Create Squad Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-3">
            <p className="text-white font-black text-lg">Create Squad</p>
            <div className="flex gap-2">
              <input value={squadEmoji} onChange={e => setSquadEmoji(e.target.value)} placeholder="🥋"
                className="w-16 bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-center text-xl focus:outline-none min-h-[44px]" />
              <input value={squadName} onChange={e => setSquadName(e.target.value)} placeholder="Squad name"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] min-h-[44px]" />
            </div>
            <input value={squadDesc} onChange={e => setSquadDesc(e.target.value)} placeholder="Description (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] min-h-[44px]" />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-white text-sm font-bold min-h-[44px]">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-commander-red text-white text-sm font-bold min-h-[44px]">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Squad Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-3">
            <p className="text-white font-black text-lg">Join a Squad</p>
            <p className="text-gray-500 text-sm">Enter the 6-character invite code from your teammate.</p>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-center text-xl font-black tracking-widest placeholder-gray-700 focus:outline-none focus:border-[#00E5FF] min-h-[44px]"
              maxLength={6} />
            <div className="flex gap-2">
              <button onClick={() => setShowJoin(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-white text-sm font-bold min-h-[44px]">Cancel</button>
              <button onClick={handleJoin} className="flex-1 py-3 rounded-xl bg-[#00E5FF] text-black text-sm font-bold min-h-[44px]">Join</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Analysis Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <p className="text-white font-black text-lg">Share with {activeSquad?.name}</p>
            <textarea value={shareContent} onChange={e => setShareContent(e.target.value)}
              placeholder="Add a note for your squad... (optional)"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] resize-none" />

            {recentAnalysis.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Select an Analysis to Share</p>
                {recentAnalysis.map(a => (
                  <button key={a.id} onClick={() => handleShare(a)}
                    className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 hover:border-[#00E5FF] rounded-xl px-3 py-3 transition-all text-left min-h-[44px]">
                    <div>
                      <p className="text-white text-sm font-semibold">{a.title}</p>
                      <p className="text-gray-500 text-xs">{a.session_type} · {a.date}</p>
                    </div>
                    <span className={`font-black text-base ${(a.posture_score || 0) >= 80 ? "text-green-400" : (a.posture_score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                      {a.posture_score ?? "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {recentAnalysis.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-2">No analyses yet. Run the Analyze Technique tool first!</p>
            )}

            <button onClick={() => setShowShare(false)} className="w-full py-3 rounded-xl border border-gray-700 text-white text-sm font-bold min-h-[44px]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}