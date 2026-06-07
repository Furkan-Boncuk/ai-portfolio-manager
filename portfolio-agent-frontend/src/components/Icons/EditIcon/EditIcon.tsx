import { clsx } from "clsx";
import type { EditIconProps } from "./EditIcon.interface";

export function EditIcon({ className }: EditIconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={clsx(className)}>
      <path d="M11 2l3 3-9 9H2v-3z" />
    </svg>
  );
}
