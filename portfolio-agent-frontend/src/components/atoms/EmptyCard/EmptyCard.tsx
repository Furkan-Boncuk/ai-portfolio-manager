import { clsx } from "clsx";
import type { EmptyCardProps } from "./EmptyCard.interface";


export function EmptyCard({ children, className }: EmptyCardProps) {
  return (
    <div className={clsx("bg-surface-overlay border border-surface-border rounded-lg p-4", className)}>
      <p className="text-text-muted text-sm">{children}</p>
    </div>
  );
}
