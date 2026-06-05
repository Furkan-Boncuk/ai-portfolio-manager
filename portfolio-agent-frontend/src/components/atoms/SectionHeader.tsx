import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  className?: string;
}

export function SectionHeader({ icon: Icon, title, className }: SectionHeaderProps) {
  return (
    <div className={clsx("flex items-center gap-2 mb-3", className)}>
      <Icon className="w-5 h-5 text-brand-400" />
      <h2 className="text-text-primary text-lg font-semibold">{title}</h2>
    </div>
  );
}
