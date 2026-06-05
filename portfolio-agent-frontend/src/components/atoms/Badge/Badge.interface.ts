export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}
