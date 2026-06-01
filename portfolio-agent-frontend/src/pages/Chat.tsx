import { useState } from "react";
import { apiFetch } from "../lib/api";

interface Message {
  role: string;
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch<{ response: string }>("/api/v1/agent/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg.content }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Unable to reach agent." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chat with Agent</h1>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 min-h-[400px] max-h-[600px] overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Ask the agent about your portfolio, signals, or market conditions.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block px-4 py-2 rounded-lg text-sm max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-800 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {msg.content}
              </span>
            </div>
          ))
        )}
        {loading && (
          <p className="text-gray-500 text-sm animate-pulse">Agent is thinking...</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
}
