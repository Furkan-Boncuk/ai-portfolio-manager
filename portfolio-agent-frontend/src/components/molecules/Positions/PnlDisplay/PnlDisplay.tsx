import { Minus } from "lucide-react";
import type { PnlDisplayProps } from "./PnlDisplay.interface";

export function PnlDisplay({ value }: PnlDisplayProps) {
  if (!value) return <Minus className="w-4 h-4 text-text-muted" />;
  const num = parseFloat(value);
  const isPositive = num >= 0;
  return (
    <span className={isPositive ? "text-semantic-success" : "text-semantic-danger"}>
      {isPositive ? "+" : ""}{value}
    </span>
  );
}
