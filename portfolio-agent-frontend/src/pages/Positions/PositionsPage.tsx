import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Briefcase, Layers } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import { Badge } from "../../components/atoms/Badge/Badge";
import { DirectionIcon } from "../../components/molecules/Positions/DirectionIcon/DirectionIcon";
import { PnlDisplay } from "../../components/molecules/Positions/PnlDisplay/PnlDisplay";
import { statusVariant, type PositionsData } from "./Positions.interface";

export default function PositionsPage() {
  const { data, isLoading } = useQuery<PositionsData>({
    queryKey: ["positions"],
    queryFn: () => http.get<PositionsData>("/api/v1/positions"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading positions...</p>
      </div>
    );
  }

  const positions = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Positions</h1>
        {positions.length > 0 && (
          <span className="text-text-muted text-sm">({positions.length} total)</span>
        )}
      </div>

      <p className="text-text-secondary text-sm">
        Track your manual positions and monitor their performance.
        Positions are created manually or will come from future signal execution.
      </p>

      {positions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-text-muted text-xs uppercase border-b border-surface-border">
                <th className="pb-3 pr-4">Asset</th>
                <th className="pb-3 pr-4">Direction</th>
                <th className="pb-3 pr-4">Entry</th>
                <th className="pb-3 pr-4">Current / Exit</th>
                <th className="pb-3 pr-4">Quantity</th>
                <th className="pb-3 pr-4">PnL</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-surface-border hover:bg-surface-hover">
                  <td className="py-3 pr-4 text-text-primary text-sm font-medium">{pos.asset}</td>
                  <td className="py-3 pr-4">
                    <DirectionIcon direction={pos.direction} />
                  </td>
                  <td className="py-3 pr-4 text-text-secondary text-sm">{pos.entryPrice}</td>
                  <td className="py-3 pr-4 text-text-secondary text-sm">
                    {pos.exitPrice ?? pos.currentPrice ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary text-sm">{pos.quantity}</td>
                  <td className="py-3 pr-4 text-sm font-medium">
                    <PnlDisplay value={pos.realizedPnl ?? pos.unrealizedPnl} />
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={statusVariant[pos.status] ?? "neutral"} label={pos.status} />
                  </td>
                  <td className="py-3 text-text-muted text-xs">{pos.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
          <SectionHeader icon={Layers} title="Open Positions" />
          <EmptyCard>No positions yet. Add a manual position to start tracking.</EmptyCard>
        </section>
      )}
    </div>
  );
}
