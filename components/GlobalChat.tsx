"use client";

import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

type Message = { role: "user" | "assistant"; content: string };

export function GlobalChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useAction(api.ai.chat.sendMessage);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    // #region agent log
    const runId = "ai-chat-run";
    fetch("http://127.0.0.1:7242/ingest/b28c620f-1826-4804-86f9-e892a0cc3bef", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "GlobalChat.tsx:handleSubmit:beforeSend",
        message: "AI chat sendMessage called",
        data: { messageLen: text.length, historyLen: messages.length },
        timestamp: Date.now(),
        runId,
        hypothesisId: "H2_H4_H5",
      }),
    }).catch(() => {});
    // #endregion
    try {
      const reply = await sendMessage({
        message: text,
        history: messages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      // #region agent log
      const errObj = err instanceof Error ? err : new Error(String(err));
      const errData: Record<string, unknown> = {
        message: errObj.message,
        name: errObj.name,
      };
      try {
        if (typeof (err as { data?: unknown }).data !== "undefined") {
          errData.convexData = (err as { data: unknown }).data;
        }
      } catch (_) {}
      fetch("http://127.0.0.1:7242/ingest/b28c620f-1826-4804-86f9-e892a0cc3bef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "GlobalChat.tsx:handleSubmit:catch",
          message: "AI chat sendMessage failed",
          data: errData,
          timestamp: Date.now(),
          runId,
          hypothesisId: "H2_H3_H5",
        }),
      }).catch(() => {});
      // #endregion
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-600 bg-slate-800 shadow-xl flex flex-col overflow-hidden max-h-[420px]">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Cold chain assistant</h3>
                <p className="text-xs text-slate-400">Ask about compliance or best practices.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-[200px] max-h-[280px] overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-slate-500 text-sm">Send a message to start.</p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user" ? "bg-accent text-white" : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about cold chain..."
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full bg-accent text-white p-3 shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          aria-label={open ? "Close chat" : "Open AI assistant"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
