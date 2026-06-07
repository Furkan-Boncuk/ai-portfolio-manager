import { clsx } from "clsx";
import type { SpinnerProps } from "./Spinner.interface";

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={clsx("flex items-center gap-2 text-sm text-gray-400", className)}>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
