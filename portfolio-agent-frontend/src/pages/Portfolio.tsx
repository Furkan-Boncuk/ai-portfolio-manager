import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  exchange: string;
}

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  isActive: boolean;
}

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Portfolio[] }>("/api/v1/portfolios"),
      apiFetch<{ data: Asset[] }>("/api/v1/assets"),
    ])
      .then(([p, a]) => {
        setPortfolios(p.data);
        setAssets(a.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Portfolios</h2>
        {portfolios.length === 0 ? (
          <p className="text-gray-500">No portfolios yet. Run seed to create defaults.</p>
        ) : (
          <div className="grid gap-4">
            {portfolios.map((p) => (
              <div key={p.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                    {p.baseCurrency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Tracked Assets</h2>
        {assets.length === 0 ? (
          <p className="text-gray-500">No assets tracked yet.</p>
        ) : (
          <div className="grid gap-3">
            {assets.map((a) => (
              <div key={a.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex justify-between">
                <div>
                  <span className="font-bold text-yellow-400">{a.symbol}</span>
                  <span className="text-gray-500 ml-3">{a.name}</span>
                </div>
                <span className="text-sm text-gray-500">{a.assetType} / {a.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
