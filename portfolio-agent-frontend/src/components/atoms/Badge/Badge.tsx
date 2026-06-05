import { clsx } from "clsx";
import type { BadgeProps, BadgeVariant } from "./Badge.interface";


const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-900 text-green-300",
  warning: "bg-yellow-900 text-yellow-300",
  danger: "bg-red-900 text-red-300",
  info: "bg-blue-900 text-blue-300",
  neutral: "bg-gray-700 text-gray-300",
};

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", variantStyles[variant], className)}>
      {label}
    </span>
  );
}
