import type { BadgeVariant } from "../../components/atoms/Badge/Badge.interface";
import type { Position } from "../../pages/Positions/Positions.interface";

export const statusVariant: Record<Position["status"], BadgeVariant> = {
  open: "success",
  closed: "info",
  cancelled: "neutral",
  manual: "warning",
};
