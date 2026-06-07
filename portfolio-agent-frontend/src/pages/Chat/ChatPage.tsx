import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import type { Session, Message } from "./Chat.interface";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M5 4V2.5a1 1 0 011-1h4a1 1 0 011 1V4M12 4v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 2l3 3-9 9H2v-3z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BotIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      AI
    </div>
  );
}

function UserIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      U
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

export default function Chat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Session[] }>("/api/v1/chat/sessions");
      setSessions(res.data);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await apiFetch<{ data: Message[] }>(
        `/api/v1/chat/sessions/${sessionId}/messages`
      );
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, []);

  useEffect(() => {
    loadSessions().finally(() => setInitialLoading(false));
  }, [loadSessions]);

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    }
  }, [activeSessionId, loadSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingSessionId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingSessionId]);

  const createNewSession = useCallback(async () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userContent = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sessionId: activeSessionId ?? "",
        role: "user",
        content: userContent,
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      if (!activeSessionId) {
        const res = await apiFetch<{
          data: { sessionId: string; response: string };
        }>("/api/v1/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ message: userContent }),
        });

        setActiveSessionId(res.data.sessionId);
        setMessages([
          {
            id: crypto.randomUUID(),
            sessionId: res.data.sessionId,
            role: "user",
            content: userContent,
            createdAt: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            sessionId: res.data.sessionId,
            role: "assistant",
            content: res.data.response,
            createdAt: new Date().toISOString(),
          },
        ]);
        await loadSessions();
      } else {
        const res = await apiFetch<{
          data: { response: string; message: Message };
        }>(`/api/v1/chat/sessions/${activeSessionId}/messages`, {
          method: "POST",
          body: JSON.stringify({ message: userContent }),
        });

        setMessages((prev) => [
          ...prev,
          {
            id: res.data.message.id,
            sessionId: activeSessionId,
            role: "assistant",
            content: res.data.response,
            createdAt: res.data.message.createdAt,
          },
        ]);
        await loadSessions();
      }
    } catch (e) {
      console.error("Chat error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sessionId: activeSessionId ?? "",
          role: "assistant",
          content: "Error: Unable to reach agent.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, activeSessionId, loadSessions]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await apiFetch(`/api/v1/chat/sessions/${sessionId}`, {
          method: "DELETE",
        });
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
        await loadSessions();
      } catch (e) {
        console.error("Failed to delete session", e);
      }
      setDeleteConfirmId(null);
    },
    [activeSessionId, loadSessions]
  );

  const handleRenameSession = useCallback(
    async (sessionId: string) => {
      if (!editTitle.trim()) {
        setEditingSessionId(null);
        return;
      }
      try {
        await apiFetch(`/api/v1/chat/sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify({ title: editTitle.trim() }),
        });
        await loadSessions();
      } catch (e) {
        console.error("Failed to rename session", e);
      }
      setEditingSessionId(null);
    },
    [editTitle, loadSessions]
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex -m-6 h-[calc(100vh-57px)]">
      {sidebarOpen && (
        <div className="w-72 border-r border-gray-800 bg-gray-900/50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-800">
            <button
              onClick={createNewSession}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <PlusIcon />
              <span>New conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {initialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-8 px-4">
                No conversations yet
              </p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="group relative">
                  {editingSessionId === session.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameSession(session.id);
                      }}
                      className="px-2 py-1.5"
                    >
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameSession(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        className="w-full bg-gray-800 border border-blue-500 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                        maxLength={100}
                      />
                    </form>
                  ) : deleteConfirmId === session.id ? (
                    <div className="px-2 py-2 flex items-center gap-1.5 text-xs">
                      <span className="text-gray-400">Delete?</span>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-500"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => selectSession(session.id)}
                      className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                        activeSessionId === session.id
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      }`}
                    >
                      <ChatIcon />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs leading-tight">
                          {session.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setEditTitle(session.title);
                          }}
                          className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(session.id);
                          }}
                          className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-gray-900/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {activeSession && (
            <span className="text-sm text-gray-400 truncate">
              {activeSession.title}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full">
            {!activeSessionId && messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <BotIcon />
                </div>
                <h1 className="text-xl font-semibold text-gray-200 mb-2">
                  Portfolio AI Assistant
                </h1>
                <p className="text-sm text-gray-500 text-center max-w-md mb-8">
                  Ask about your portfolio, market analysis, signals, or any
                  financial questions.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    "How is my portfolio performing?",
                    "What signals were generated today?",
                    "Analyze BTC market conditions",
                    "Explain risk management",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-left text-xs text-gray-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-800 rounded-xl px-3 py-2.5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 && loading ? null : (
              <div className="px-4 py-4 space-y-1">
                {messages.map((msg, i) => (
                  <div
                    key={msg.id ?? i}
                    className={`flex gap-3 px-4 py-3 rounded-xl ${
                      msg.role === "assistant"
                        ? "bg-gray-800/30"
                        : "bg-transparent"
                    }`}
                  >
                    {msg.role === "assistant" ? <BotIcon /> : <UserIcon />}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 px-4 py-3 rounded-xl bg-gray-800/30">
                    <BotIcon />
                    <div className="pt-1">
                      <Spinner />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 bg-gray-900/50">
          <div className="max-w-3xl mx-auto w-full px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2 focus-within:border-gray-600 transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Portfolio AI..."
                className="flex-1 bg-transparent text-sm text-gray-200 py-1.5 focus:outline-none placeholder-gray-500"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300 hover:text-white"
              >
                <SendIcon />
              </button>
            </form>
            <p className="text-[10px] text-gray-700 text-center mt-2">
              AI may produce inaccurate information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
