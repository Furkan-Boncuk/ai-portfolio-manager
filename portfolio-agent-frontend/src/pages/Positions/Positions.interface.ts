import { Direction } from "../../components/molecules/Positions/DirectionIcon/DirectionIcon.interface";

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
