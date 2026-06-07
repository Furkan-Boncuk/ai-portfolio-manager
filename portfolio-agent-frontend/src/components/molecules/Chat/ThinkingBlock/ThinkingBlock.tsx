import { useState, useEffect } from "react";
import type { ThinkingBlockProps } from "./ThinkingBlock.interface";

export function ThinkingBlock({ reasoning, streaming }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (streaming) {
      setOpen(true);
    }
  }, [streaming]);

  if (!reasoning) return null;

  return (
    <div className={`mb-2 border rounded-lg overflow-hidden ${
      streaming ? "border-emerald-500/30" : "border-gray-700/50"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 text-xs text-gray-400 hover:text-gray-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
        <div className="flex items-center gap-1.5">
          <span>Thinking</span>
          {streaming && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="px-3 py-2 text-xs text-gray-500 italic leading-relaxed whitespace-pre-wrap">
          {reasoning}
        </div>
      )}
    </div>
  );
}
