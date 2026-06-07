import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Signal } from "./Signals.interface";

export default function Signals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: Signal[] }>("/api/v1/signals")
      .then((res) => setSignals(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading signals...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Signals</h1>

      {signals.length === 0 ? (
        <p className="text-gray-500">No signals generated yet. Start the worker to begin monitoring.</p>
      ) : (
        <div className="grid gap-4">
          {signals.map((s) => (
            <div key={s.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      s.direction === "long" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {s.direction.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">
                    {s.signalType}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                    {s.timeframe}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-3">{s.reasonSummary}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Entry: </span>
                  <span className="text-gray-300">
                    {parseFloat(s.entryLow).toFixed(2)}-{parseFloat(s.entryHigh).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Stop: </span>
                  <span className="text-red-400">{parseFloat(s.invalidationPrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">TP1: </span>
                  <span className="text-green-400">{parseFloat(s.takeProfit1).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Risk: </span>
                  <span
                    className={
                      s.riskLevel === "high"
                        ? "text-red-400"
                        : s.riskLevel === "medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }
                  >
                    {s.riskLevel}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-600">Confidence: {s.confidence}/100</span>
                <span className="text-xs text-gray-700">Bu yatirim tavsiyesi degildir.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
