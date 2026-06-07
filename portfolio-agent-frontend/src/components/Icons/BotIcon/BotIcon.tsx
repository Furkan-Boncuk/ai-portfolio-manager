import { clsx } from "clsx";
import type { BotIconProps } from "./BotIcon.interface";

export function BotIcon({ className }: BotIconProps) {
  return (
    <div className={clsx("w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0", className)}>
      AI
    </div>
  );
}
