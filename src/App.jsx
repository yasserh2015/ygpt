import React, { useEffect, useMemo, useRef, useState } from "react";

// 👇 Customize your gag here
const CONFIG = {
  siteTitle: "Ygpt",
  accent: "#10b981", // Tailwind emerald-500
  triggerMode: "contains", // "exact" | "contains" | "regex"
  trigger: "Do engineers have common traits?",
  specialAnswer: "Engineers do have common traits, they all get unfairly accused of being the same. But Yasser stands out. Engineers might share a toolkit, but how they use it is what makes each unique.",
  fallbackAnswers: [
    "Sorry, I can only answer one very specific question.",
    "Hmm… my training prevents me from answering that. Try the *special* one.",
    "As an AI, I'm laser-focused today. Ask the **right** question ;)"
  ],
  headerSubtitle: "totally real and extremely helpful ai 🤖",
};

// --- Helper: rudimentary text matcher
function isMatch(input, mode, trigger) {
  const i = input.trim().toLowerCase();
  if (mode === "exact") return i === trigger.trim().toLowerCase();
  if (mode === "contains") return i.includes(trigger.trim().toLowerCase());
  if (mode === "regex") {
    try {
      const re = new RegExp(trigger, "i");
      return re.test(input);
    } catch {
      return false;
    }
  }
  return false;
}

// --- Helper: fake streaming reply
async function streamText(text, onChunk, speed = [10, 25]) {
  const [min, max] = speed;
  for (let i = 0; i < text.length; i++) {
    onChunk(text.slice(0, i + 1));
    const jitter = Math.floor(Math.random() * (max - min + 1)) + min;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, jitter));
  }
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi! Ask me anything… or better yet, ask me that *one* question I love." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  const accent = useMemo(() => CONFIG.accent, []);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    setLoading(true);

    const shouldSpecial = isMatch(text, CONFIG.triggerMode, CONFIG.trigger);
    const answer = shouldSpecial
      ? CONFIG.specialAnswer
      : CONFIG.fallbackAnswers[Math.floor(Math.random() * CONFIG.fallbackAnswers.length)];

    // Add placeholder AI message, then stream into it
    const idx = messages.length + 1;
    setMessages((m) => [...m, { role: "ai", content: "" }]);

    await streamText(answer, (partial) => {
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, content: partial } : msg)));
    });

    setLoading(false);
  }

  return (
    // Full-screen center
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center px-4">
      {/* Centered card container */}
      <div className="w-full max-w-xl rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/40 shadow-lg backdrop-blur p-4 sm:p-6">
        {/* Header */}
        <header className="mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-7 w-7 rounded-xl shadow ring-1 ring-black/10"
              style={{ background: accent }}
            />
            <div className="leading-tight">
              <h1 className="text-2xl sm:text-3xl font-bold">{CONFIG.siteTitle}</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{CONFIG.headerSubtitle}</p>
            </div>
            <div className="ml-auto text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <span className="rounded-md border border-black/10 dark:border-white/10 px-2 py-1">Ygpt-1.0</span>
            </div>
          </div>
        </header>

        {/* Chat */}
        <main className="w-full">
          <div
            ref={viewRef}
            className="h-[55vh] sm:h-[60vh] overflow-y-auto py-4 space-y-4"
          >
            {messages.map((m, i) => (
              <Message key={i} role={m.role}>
                {m.content}
              </Message>
            ))}
            {loading && (
              <Message role="ai">
                <TypingDots />
              </Message>
            )}
          </div>
        </main>

        {/* Composer */}
        <form onSubmit={handleSend} className="w-full pt-2">
          <div className="relative flex gap-2">
            <input
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 shadow-sm outline-none focus:ring-2"
              style={{ boxShadow: `0 4px 14px -6px ${accent}55` }}
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl px-4 py-3 text-white"
              style={{ background: accent }}
            >
              Send
            </button>
          </div>
        </form>

        {/* Footer */}
      </div>
    </div>
  );
}

function Message({ role, children }) {
  const isAI = role === "ai";
  return (
    <div className={`flex items-start gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center text-xs font-bold"
        style={{ background: isAI ? "#e5f9f3" : "#e5e7eb" }}
      >
        {isAI ? "🤖" : "🧑"}
      </div>
      <div
        className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isAI
            ? "bg-white/90 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10"
            : "bg-emerald-500/10 border border-emerald-400/40"
        }`}
      >
        <RichText text={String(children)} />
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
    </div>
  );
}

// Mini markdown-ish renderer (bold/italic/code/links)
function RichText({ text }) {
  const html = useMemo(() => {
    let t = text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+?)`/g, "<code class='px-1 py-0.5 rounded bg-black/10 dark:bg-white/10'>$1</code>")
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, "<a class='underline' href='$2' target='_blank' rel='noreferrer'>$1</a>");
    return t;
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
