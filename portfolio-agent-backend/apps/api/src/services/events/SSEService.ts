import { createSSEEvent, sseEventPayloadSchema, type SSEEvent } from "@portfolio-agent/shared";
import { getDb } from "@portfolio-agent/db";
import { appEvents } from "@portfolio-agent/db/schema";
import { desc, gt } from "drizzle-orm";
import { z } from "zod";

export class SSEService {
  private subscribers = new Set<ReadableStreamDefaultController>();
  private lastDbEventId: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  addSubscriber(c: ReadableStreamDefaultController): void {
    this.subscribers.add(c);
  }

  removeSubscriber(c: ReadableStreamDefaultController): void {
    this.subscribers.delete(c);
  }

  private sendToSubscriber(
    c: ReadableStreamDefaultController,
    id: number,
    event: SSEEvent,
  ): void {
    const data = `id: ${id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    try {
      c.enqueue(new TextEncoder().encode(data));
    } catch {
      this.subscribers.delete(c);
    }
  }

  private async pollDbEvents(): Promise<void> {
    const db = getDb();
    const where = this.lastDbEventId
      ? gt(appEvents.id, this.lastDbEventId)
      : undefined;

    const rows = await db
      .select()
      .from(appEvents)
      .where(where ?? undefined)
      .orderBy(desc(appEvents.createdAt))
      .limit(50);

    for (const row of rows.reverse()) {
      const typeResult = sseEventPayloadSchema.shape.type.safeParse(row.eventType);
      if (!typeResult.success) continue;

      const payloadResult = z.record(z.unknown()).safeParse(row.payload);
      const payload = payloadResult.success ? payloadResult.data : {};

      const event = createSSEEvent(typeResult.data, payload, row.source ?? "system");
      event.id = row.id;
      event.createdAt = row.createdAt.toISOString();
      this.lastDbEventId = row.id;

      let eventCounter = 0;
      for (const sub of this.subscribers) {
        this.sendToSubscriber(sub, ++eventCounter, event);
      }
    }
  }

  startPolling(): void {
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.pollDbEvents(), 3000);
    }
  }

  createStream(): ReadableStream {
    this.startPolling();

    const service = this;
    let controller!: ReadableStreamDefaultController;

    return new ReadableStream({
      start(c) {
        controller = c;
        service.addSubscriber(c);

        const ready = createSSEEvent("system.ready", {
          message: "SSE stream connected",
        });
        const readyData = `id: 0\nevent: system.ready\ndata: ${JSON.stringify(ready)}\n\n`;
        c.enqueue(new TextEncoder().encode(readyData));
      },
      cancel() {
        service.removeSubscriber(controller);
      },
    });
  }
}
