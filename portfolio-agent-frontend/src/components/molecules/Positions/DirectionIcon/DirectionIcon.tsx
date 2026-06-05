import { TrendingUp, TrendingDown } from "lucide-react";
import { Direction, type DirectionIconProps } from "./DirectionIcon.interface";

export function DirectionIcon({ direction }: DirectionIconProps) {
  if (direction === Direction.Long) {
    return <TrendingUp className="w-4 h-4 text-semantic-success" />;
  }
  return <TrendingDown className="w-4 h-4 text-semantic-danger" />;
}
