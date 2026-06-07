import { clsx } from "clsx";
import type { TrashIconProps } from "./TrashIcon.interface";

export function TrashIcon({ className }: TrashIconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={clsx(className)}>
      <path d="M2 4h12M5 4V2.5a1 1 0 011-1h4a1 1 0 011 1V4M12 4v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4" />
    </svg>
  );
}
