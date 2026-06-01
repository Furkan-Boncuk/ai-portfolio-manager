import { z } from "zod";

export const sseEventTypes = [
  "system.ready",
  "worker.heartbeat",
  "agent.run.started",
  "agent.step.created",
  "agent.tool.started",
  "agent.tool.finished",
  "agent.run.completed",
  "agent.run.failed",
  "worker.job.started",
  "worker.job.completed",
  "worker.job.failed",
  "market.candle.closed",
  "portfolio.updated",
  "holding.added",
  "holding.removed",
  "holding.quantity_changed",
  "portfolio.allocation_changed",
  "decision.updated",
  "goal.updated",
  "risk_policy.updated",
  "strategy_config.updated",
  "agent_mission.updated",
  "proposed_user_preference_update",
  "proposed_strategy_update",
  "proposed_goal_update",
  "proposed_decision_update",
  "signal.created",
  "signal.rejected",
  "signal.reviewed",
  "notification.telegram.sent",
  "notification.telegram.failed",
  "goal.progress.updated",
  "portfolio.review.completed",
  "knowledge.source.suggested",
  "knowledge.ingest.requested",
] as const;

export type SSEEventType = (typeof sseEventTypes)[number];

export const sseEventPayloadSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(sseEventTypes),
  createdAt: z.string().datetime(),
  source: z.string().default("system"),
  payload: z.record(z.unknown()).default({}),
});

export type SSEEvent = z.infer<typeof sseEventPayloadSchema>;

export function createSSEEvent(
  type: SSEEventType,
  payload: Record<string, unknown> = {},
  source = "system"
): SSEEvent {
  return {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    source,
    payload,
  };
}
