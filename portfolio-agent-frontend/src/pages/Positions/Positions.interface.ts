import { Direction } from "../../components/molecules/Positions/DirectionIcon/DirectionIcon.interface";
import type { BadgeVariant } from "../../components/atoms/Badge/Badge.interface";

export interface Position {
  id: string;
  asset: string;
  direction: Direction;
  entryPrice: string;
  exitPrice: string | null;
  currentPrice: string | null;
  quantity: string;
  realizedPnl: string | null;
  unrealizedPnl: string | null;
  status: "open" | "closed" | "cancelled" | "manual";
  source: string;
  entryTime: string;
  exitTime: string | null;
}

export interface PositionsData {
  data: Position[];
  total: number;
}

export const statusVariant: Record<Position["status"], BadgeVariant> = {
  open: "success",
  closed: "info",
  cancelled: "neutral",
  manual: "warning",
};
