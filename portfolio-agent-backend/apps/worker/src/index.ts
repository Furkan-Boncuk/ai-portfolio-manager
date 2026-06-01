import { runMarketWatcher } from "./jobs/market-watcher";
import { runSignalEvaluator } from "./jobs/signal-evaluator";
import { getDb } from "@portfolio-agent/db";
import { appEvents } from "@portfolio-agent/db/schema";
import { createSSEEvent, type SSEEvent } from "@portfolio-agent/shared";

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL_MS ?? "30000", 10);
let running = true;

async function publishEventToDb(event: SSEEvent): Promise<void> {
  try {
    const db = getDb();
    await db.insert(appEvents).values({
      eventType: event.type,
      source: event.source,
      payload: event.payload,
    });
  } catch (err) {
    console.error("[worker] failed to publish event:", (err as Error).message);
  }
}

async function heartbeat(): Promise<void> {
  const event = createSSEEvent("worker.heartbeat", {
    timestamp: new Date().toISOString(),
  }, "worker");
  await publishEventToDb(event);
  console.log(`[worker] heartbeat - ${new Date().toISOString()}`);
}

async function runJobs(): Promise<void> {
  const onEvent = (event: SSEEvent) => publishEventToDb(event);

  try {
    await runMarketWatcher(onEvent);
  } catch (err) {
    console.error("[worker] market watcher error:", (err as Error).message);
  }

  try {
    await runSignalEvaluator(onEvent);
  } catch (err) {
    console.error("[worker] signal evaluator error:", (err as Error).message);
  }
}

async function mainLoop(): Promise<void> {
  console.log("[worker] starting main loop...");

  while (running) {
    await heartbeat();
    await runJobs();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

function handleShutdown(): void {
  console.log("[worker] shutting down...");
  running = false;
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

console.log("[worker] starting...");
mainLoop().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
