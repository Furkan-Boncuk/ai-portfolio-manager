import { clsx } from "clsx";

interface EmptyCardProps {
  children: string;
  className?: string;
}

export function EmptyCard({ children, className }: EmptyCardProps) {
  return (
    <div className={clsx("bg-surface-overlay border border-surface-border rounded-lg p-4", className)}>
      <p className="text-text-muted text-sm">{children}</p>
    </div>
  );
}
