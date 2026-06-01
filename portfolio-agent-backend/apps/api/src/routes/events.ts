import { Elysia } from "elysia";
import { createSSEEvent, type SSEEvent } from "@portfolio-agent/shared";
import { getDb } from "@portfolio-agent/db";
import { appEvents } from "@portfolio-agent/db/schema";
import { desc, gt } from "drizzle-orm";

const subscribers = new Set<ReadableStreamDefaultController>();
let lastDbEventId: string | null = null;

function addSubscriber(c: ReadableStreamDefaultController): void {
  subscribers.add(c);
}

function removeSubscriber(c: ReadableStreamDefaultController): void {
  subscribers.delete(c);
}

function sendToSubscriber(c: ReadableStreamDefaultController, id: number, event: SSEEvent): void {
  const data = `id: ${id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  try {
    c.enqueue(new TextEncoder().encode(data));
  } catch {
    subscribers.delete(c);
  }
}

async function pollDbEvents(): Promise<void> {
  const db = getDb();
  const where = lastDbEventId
    ? gt(appEvents.id, lastDbEventId)
    : undefined;

  const rows = await db
    .select()
    .from(appEvents)
    .where(where ?? undefined)
    .orderBy(desc(appEvents.createdAt))
    .limit(50);

  for (const row of rows.reverse()) {
    const event = createSSEEvent(
      row.eventType as SSEEvent["type"],
      (row.payload as Record<string, unknown>) ?? {},
      row.source ?? "system"
    );
    event.id = row.id;
    event.createdAt = row.createdAt.toISOString();
    lastDbEventId = row.id;

    let eventCounter = 0;
    for (const sub of subscribers) {
      sendToSubscriber(sub, ++eventCounter, event);
    }
  }
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const eventsRoutes = new Elysia({ prefix: "/events" }).get(
  "/stream",
  ({ set }) => {
    if (!pollInterval) {
      pollInterval = setInterval(pollDbEvents, 3000);
    }

    let controller!: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(c) {
        controller = c;
        addSubscriber(c);

        const ready = createSSEEvent("system.ready", {
          message: "SSE stream connected",
        });
        const readyData = `id: 0\nevent: system.ready\ndata: ${JSON.stringify(ready)}\n\n`;
        c.enqueue(new TextEncoder().encode(readyData));
      },
      cancel() {
        removeSubscriber(controller);
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }
);
