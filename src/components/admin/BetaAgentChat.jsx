import { useState, useEffect, useRef } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Bot, Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTED = [
  "Summarize pending beta requests",
  "Which trials are expiring soon?",
  "What are the most common fitness goals?",
  "Who should I approve next?",
];

export default function BetaAgentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "beta_tracker",
      metadata: { name: "Beta Dashboard Session" },
    });
    setConversation(conv);

    const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });

    return unsubscribe;
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || !conversation || sending) return;
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setSending(false);
  };

  const reset = async () => {
    setMessages([]);
    setConversation(null);
    await initConversation();
  };

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-commander-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-vellera-blue/20 border border-vellera-blue/30 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-vellera-blue" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Beta Tracker AI</p>
            <p className="text-commander-muted text-xs">Powered by Vellera Agent</p>
          </div>
        </div>
        <button onClick={reset} className="text-gray-600 hover:text-white transition p-1">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-vellera-blue mt-1 shrink-0" />
              <p className="text-gray-300 text-sm">Hi! I'm your Beta Program AI. Ask me anything about your applicants, trials, or trends.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-vellera-blue/10 border border-vellera-blue/20 text-vellera-blue rounded-full hover:bg-vellera-blue/20 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          if (msg.role === "tool") return null;
          return (
            <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isUser ? "bg-gray-700 text-white" : "bg-vellera-blue/10 border border-vellera-blue/20 text-gray-200"}`}>
                {isUser ? (
                  <p>{msg.content}</p>
                ) : (
                  <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex gap-2">
            <div className="bg-vellera-blue/10 border border-vellera-blue/20 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 text-vellera-blue animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-commander-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your beta program..."
          className="flex-1 bg-gray-800 border border-commander-border rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending}
          className="p-2 bg-vellera-blue text-black rounded-xl hover:opacity-90 transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}