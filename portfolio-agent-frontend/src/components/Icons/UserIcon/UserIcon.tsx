import { clsx } from "clsx";
import type { UserIconProps } from "./UserIcon.interface";

export function UserIcon({ className }: UserIconProps) {
  return (
    <div className={clsx("w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0", className)}>
      U
    </div>
  );
}
