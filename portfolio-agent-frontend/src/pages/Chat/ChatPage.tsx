import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import type { Session, Message } from "./Chat.interface";
import { PlusIcon } from "../../components/Icons/PlusIcon/PlusIcon";
import { TrashIcon } from "../../components/Icons/TrashIcon/TrashIcon";
import { EditIcon } from "../../components/Icons/EditIcon/EditIcon";
import { SendIcon } from "../../components/Icons/SendIcon/SendIcon";
import { BotIcon } from "../../components/Icons/BotIcon/BotIcon";
import { UserIcon } from "../../components/Icons/UserIcon/UserIcon";
import { ChatIcon } from "../../components/Icons/ChatIcon/ChatIcon";
import { Spinner } from "../../components/atoms/Spinner/Spinner";
import { ThinkingBlock } from "../../components/molecules/Chat/ThinkingBlock/ThinkingBlock";

export default function Chat() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingSessionRef = useRef<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Session[] }>("/api/v1/chat/sessions");
      setSessions(res.data);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    try {
      const res = await apiFetch<{ data: Message[] }>(
        `/api/v1/chat/sessions/${sid}/messages`
      );
      const msgs = res.data.map((m) => ({
        ...m,
        reasoning: m.metadata && typeof m.metadata === "object" && "reasoning" in m.metadata
          ? (m.metadata as Record<string, unknown>).reasoning as string
          : undefined,
      }));
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, []);

  useEffect(() => {
    loadSessions().finally(() => setInitialLoading(false));
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) {
      if (pendingSessionRef.current === sessionId) {
        pendingSessionRef.current = null;
        return;
      }
      loadSession(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId, loadSession]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (streamActive) {
      scrollToBottom(false);
    }
  }, [messages, streamActive, scrollToBottom]);

  useEffect(() => {
    if (editingSessionId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingSessionId]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const createNewSession = useCallback(() => {
    eventSourceRef.current?.close();
    navigate("/chat");
  }, [navigate]);

  const selectSession = useCallback((sid: string) => {
    eventSourceRef.current?.close();
    navigate(`/chat/${sid}`);
  }, [navigate]);

  const startStream = useCallback(
    (sid: string, message: string) => {
      eventSourceRef.current?.close();

      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
      const encoded = encodeURIComponent(message);
      const url = `${baseUrl}/api/v1/chat/sessions/${sid}/stream?message=${encoded}`;

      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;

      let streamContent = "";
      let streamReasoning = "";

      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sessionId: sid,
          role: "assistant",
          content: "",
          reasoning: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      eventSource.addEventListener("started", () => {
        setStreamActive(true);
      });

      eventSource.addEventListener("reasoning", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as { content: string };
        streamReasoning += data.content;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, reasoning: streamReasoning } : m,
          ),
        );
      });

      eventSource.addEventListener("content", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as { delta: string };
        streamContent += data.delta;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: streamContent } : m,
          ),
        );
      });

      eventSource.addEventListener("done", () => {
        eventSource.close();
        eventSourceRef.current = null;
        setStreamActive(false);
        setLoading(false);
        loadSessions();
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
        eventSourceRef.current = null;
        setStreamActive(false);
        setLoading(false);
      });

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        setStreamActive(false);
        setLoading(false);
      };
    },
    [loadSessions],
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userContent = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sessionId: sessionId ?? "",
        role: "user",
        content: userContent,
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      if (!sessionId) {
        const res = await apiFetch<{ data: { session: Session } }>(
          "/api/v1/chat/sessions",
          { method: "POST",           body: JSON.stringify({}) },
        );

        const newSessionId = res.data.session.id;
        pendingSessionRef.current = newSessionId;
        loadSessions();
        navigate(`/chat/${newSessionId}`, { replace: true });
        startStream(newSessionId, userContent);
      } else {
        startStream(sessionId, userContent);
      }
    } catch (e) {
      console.error("Chat error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sessionId: sessionId ?? "",
          role: "assistant",
          content: "Error: Unable to reach agent.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }
  }, [input, loading, sessionId, navigate, startStream]);

  const handleDeleteSession = useCallback(
    async (sid: string) => {
      try {
        await apiFetch(`/api/v1/chat/sessions/${sid}`, {
          method: "DELETE",
        });
        if (sessionId === sid) {
          navigate("/chat", { replace: true });
        }
        await loadSessions();
      } catch (e) {
        console.error("Failed to delete session", e);
      }
      setDeleteConfirmId(null);
    },
    [sessionId, navigate, loadSessions]
  );

  const handleRenameSession = useCallback(
    async (sid: string) => {
      if (!editTitle.trim()) {
        setEditingSessionId(null);
        return;
      }
      try {
        await apiFetch(`/api/v1/chat/sessions/${sid}`, {
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

  const showSpinner = loading && !streamActive;

  const activeSession = sessions.find((s) => s.id === sessionId);

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
                    <div
                      onClick={() => selectSession(session.id)}
                      className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                        sessionId === session.id
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
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    </div>
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
            {!sessionId && messages.length === 0 && !loading ? (
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
                      {msg.role === "assistant" && msg.reasoning && (
                        <ThinkingBlock
                          reasoning={msg.reasoning}
                          streaming={streamActive && i === messages.length - 1}
                        />
                      )}
                      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {showSpinner && (
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
