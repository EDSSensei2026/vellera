import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Zap, Target, Calendar, MessageSquare, ChevronRight, RefreshCw } from "lucide-react";
import BackButton from "../components/BackButton";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  { icon: "📅", label: "Weekly Plan", prompt: "Generate my personalized weekly training plan based on my recent data, recovery scores, and gas levels." },
  { icon: "🎯", label: "Daily Focus", prompt: "What technique should I drill today? Check my technique library for the most overdue skill and my current recovery score." },
  { icon: "⚖️", label: "Goal Check", prompt: "Analyze my progress toward my weight and training goals. Am I on pace? What adjustments do I need?" },
  { icon: "🔥", label: "Competition Prep", prompt: "I have a competition coming up. Based on my current data, what's my readiness and what should I focus on this week?" },
  { icon: "🛡️", label: "Recovery Check", prompt: "Review my last 7 days of biometrics and training. Should I push today or recover? Give me specific guidance." },
  { icon: "🥗", label: "Nutrition Audit", prompt: "Audit my recent food logs. Am I hitting my protein and calorie targets? What specific changes should I make?" },
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-commander-red flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-black">MC</span>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-gray-700 text-white" : "bg-commander-surface border border-commander-border"}`}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:text-gray-200 [&>ul]:text-gray-200 [&>ol]:text-gray-200 [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>strong]:text-white"
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && message.tool_calls.some(t => t.status === "running" || t.status === "in_progress") && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <Loader2 className="w-3 h-3 animate-spin text-commander-red" />
            <span className="text-xs text-commander-muted">Analyzing your training data...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AICoach() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [view, setView] = useState("chat"); // "chat" | "history"
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await base44.agents.listConversations({ agent_name: "mat_commander_coach" });
      setConversations(convs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  };

  const startNewConversation = async (initialPrompt = null) => {
    const conv = await base44.agents.createConversation({
      agent_name: "mat_commander_coach",
      metadata: { name: initialPrompt ? initialPrompt.slice(0, 50) + "..." : "New Session" },
    });
    setActiveConv(conv);
    setMessages(conv.messages || []);
    setView("chat");

    if (initialPrompt) {
      sendMessage(conv, initialPrompt);
    }
  };

  const openConversation = async (convId) => {
    const conv = await base44.agents.getConversation(convId);
    setActiveConv(conv);
    setMessages(conv.messages || []);
    setView("chat");
  };

  const sendMessage = async (conv, text) => {
    const target = conv || activeConv;
    if (!target || !text.trim()) return;

    setSending(true);
    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const updatedConv = await base44.agents.addMessage(target, { role: "user", content: text });
      // Subscribe for streaming updates
      const unsubscribe = base44.agents.subscribeToConversation(target.id, (data) => {
        setMessages(data.messages || []);
        // Check if agent is done
        const lastMsg = data.messages?.[data.messages.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg?.content && !lastMsg?.tool_calls?.some(t => t.status === "running")) {
          setSending(false);
          unsubscribe();
          loadConversations();
        }
      });

      // Fallback timeout
      setTimeout(() => {
        setSending(false);
        unsubscribe?.();
      }, 60000);
    } catch (e) {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || sending) return;
    if (!activeConv) {
      startNewConversation(input.trim());
    } else {
      sendMessage(null, input.trim());
    }
  };

  // History view
  if (view === "history") {
    return (
      <div className="h-screen flex flex-col bg-commander-dark safe-area-top">
        <div className="p-4 border-b border-commander-border flex items-center gap-3">
          <button onClick={() => setView("chat")} className="touch-target-min flex items-center">
            <BackButton to={null} label="" />
          </button>
          <h1 className="text-white font-black text-lg">Coach Sessions</h1>
          <button onClick={() => startNewConversation()} className="ml-auto flex items-center gap-1 bg-commander-red text-white text-xs font-bold px-3 py-2 rounded-lg min-h-[44px]">
            <span>New</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-commander-muted" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-commander-muted text-sm">No sessions yet. Start a conversation below.</div>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => openConversation(conv.id)}
                className="w-full text-left bg-commander-surface border border-commander-border rounded-xl p-4 hover:border-commander-red transition-all min-h-[44px] flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-semibold">{conv.metadata?.name || "Session"}</p>
                  <p className="text-commander-muted text-xs mt-0.5">{new Date(conv.created_date).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-commander-muted flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="h-screen flex flex-col bg-commander-dark safe-area-top">
      {/* Header */}
      <div className="p-4 border-b border-commander-border flex items-center gap-3 flex-shrink-0">
        <BackButton to="/" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-commander-red flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-wide">Mat-Commander Coach</p>
            <p className="text-commander-muted text-xs">AI · Reads your actual data</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setView("history")} className="touch-target-min p-2 text-commander-muted hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => startNewConversation()} className="touch-target-min p-2 text-commander-muted hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Welcome + Quick Prompts (when no active conv or no messages) */}
        {(!activeConv || messages.length === 0) && (
          <div className="space-y-4">
            <div className="bg-commander-surface border border-commander-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-commander-red flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-black">Mat-Commander Coach</p>
                  <p className="text-commander-muted text-xs">Powered by your real training data</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                I have access to your training sessions, biometrics, technique library, food logs, and goals. Ask me anything — or tap a quick prompt below.
              </p>
            </div>

            <p className="text-xs text-commander-muted uppercase tracking-widest px-1">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button key={p.label} onClick={() => startNewConversation(p.prompt)}
                  className="bg-commander-surface border border-commander-border rounded-xl p-3 text-left hover:border-commander-red transition-all min-h-[44px] flex items-start gap-2">
                  <span className="text-base flex-shrink-0">{p.icon}</span>
                  <span className="text-white text-xs font-semibold leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} message={msg} />
        ))}

        {sending && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-commander-red flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">MC</span>
            </div>
            <div className="bg-commander-surface border border-commander-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-commander-red" />
              <span className="text-commander-muted text-sm">Analyzing your data...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-commander-border flex-shrink-0 safe-area-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask your coach anything..."
            rows={1}
            className="flex-1 bg-commander-surface border border-commander-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-commander-muted focus:outline-none focus:border-commander-red resize-none min-h-[44px] max-h-32"
            style={{ fieldSizing: "content" }}
          />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            className="w-11 h-11 bg-commander-red rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:bg-red-700 transition-all">
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}