import { clsx } from "clsx";
import type { PlusIconProps } from "./PlusIcon.interface";

export function PlusIcon({ className }: PlusIconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={clsx(className)}>
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}
