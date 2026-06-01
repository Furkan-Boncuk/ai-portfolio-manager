import { useEffect, useState } from "react";
import { getSSEUrl } from "../lib/api";

interface EventEntry {
  id: string;
  type: string;
  time: string;
  data: string;
}

export default function Processing() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = getSSEUrl();
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("system.ready", () => {
      setConnected(true);
    });

    const eventTypes = [
      "worker.heartbeat",
      "market.candle.closed",
      "signal.created",
      "signal.rejected",
      "notification.telegram.sent",
      "notification.telegram.failed",
      "agent.run.started",
      "agent.run.completed",
      "agent.run.failed",
    ];

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents((prev) => [
          {
            id: e.lastEventId ?? crypto.randomUUID(),
            type,
            time: new Date().toLocaleTimeString(),
            data: JSON.stringify(data.payload ?? data, null, 0),
          },
          ...prev.slice(0, 99),
        ]);
      });
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Processing</h1>
        <span
          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm text-gray-500">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 font-mono text-xs max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Waiting for events... Start the worker to begin processing.
          </p>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="mb-2 leading-relaxed">
              <span className="text-gray-600">{evt.time}</span>{" "}
              <span
                className={`font-bold ${
                  evt.type.includes("created")
                    ? "text-green-400"
                    : evt.type.includes("rejected") || evt.type.includes("failed")
                      ? "text-red-400"
                      : evt.type.includes("heartbeat")
                        ? "text-gray-600"
                        : "text-blue-400"
                }`}
              >
                {evt.type}
              </span>{" "}
              <span className="text-gray-500">{evt.data}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
