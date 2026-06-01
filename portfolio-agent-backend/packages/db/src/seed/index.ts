import { getDb } from "..";
import { users, workspaces, portfolios, assets, watchlists, watchlistAssets, strategyConfigs, notificationSettings } from "../schema";

async function seed() {
  const db = getDb();

  const [existingUser] = await db.select().from(users).limit(1);
  if (existingUser) {
    console.log("Seed already applied, skipping.");
    process.exit(0);
  }

  const [user] = await db
    .insert(users)
    .values({
      name: "Default User",
      email: "user@localhost",
      baseCurrency: "TRY",
      riskProfile: "moderate",
    })
    .returning();

  if (!user) throw new Error("Failed to seed user");

  const [workspace] = await db
    .insert(workspaces)
    .values({
      userId: user.id,
      name: "Default Workspace",
      description: "Default workspace for MVP",
      isDefault: true,
    })
    .returning();

  if (!workspace) throw new Error("Failed to seed workspace");

  const [portfolio] = await db
    .insert(portfolios)
    .values({
      userId: user.id,
      workspaceId: workspace.id,
      name: "Main Portfolio",
      baseCurrency: "TRY",
      isActive: true,
    })
    .returning();

  const btcAsset = await db
    .insert(assets)
    .values({
      symbol: "BTC",
      name: "Bitcoin",
      assetType: "CRYPTO",
      exchange: "binance",
      quoteCurrency: "USDT",
      provider: "binance",
      providerSymbol: "BTCUSDT",
    })
    .returning()
    .then((r) => r[0]);

  const ethAsset = await db
    .insert(assets)
    .values({
      symbol: "ETH",
      name: "Ethereum",
      assetType: "CRYPTO",
      exchange: "binance",
      quoteCurrency: "USDT",
      provider: "binance",
      providerSymbol: "ETHUSDT",
    })
    .returning()
    .then((r) => r[0]);

  if (btcAsset && ethAsset && portfolio) {
    const [watchlist] = await db
      .insert(watchlists)
      .values({
        userId: user.id,
        name: "Crypto Watch",
        description: "Default crypto watchlist",
        isActive: true,
      })
      .returning();

    if (watchlist) {
      await db.insert(watchlistAssets).values([
        {
          watchlistId: watchlist.id,
          assetId: btcAsset.id,
          timeframe: "15m",
          strategyType: "scalp",
        },
        {
          watchlistId: watchlist.id,
          assetId: btcAsset.id,
          timeframe: "4h",
          strategyType: "swing",
        },
        {
          watchlistId: watchlist.id,
          assetId: ethAsset.id,
          timeframe: "15m",
          strategyType: "scalp",
        },
        {
          watchlistId: watchlist.id,
          assetId: ethAsset.id,
          timeframe: "4h",
          strategyType: "swing",
        },
      ]);
    }

    await db.insert(strategyConfigs).values([
      {
        userId: user.id,
        name: "BTC Scalp 15m",
        strategyType: "scalp",
        timeframe: "15m",
        params: {
          emaFast: 9,
          emaSlow: 21,
          rsiPeriod: 14,
          rsiRecoveryThreshold: 35,
          volumeLookback: 20,
          volumeSpikeMultiplier: 1.5,
          atrPeriod: 14,
          minRiskReward: 1.5,
          cooldownMinutes: 60,
        },
        maxSignalsPerDay: 5,
        cooldownMinutes: 60,
      },
      {
        userId: user.id,
        name: "BTC Swing 4h",
        strategyType: "swing",
        timeframe: "4h",
        params: {
          emaTrend: 50,
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          rsiMin: 45,
          rsiMax: 65,
          minRiskReward: 2.0,
          cooldownHours: 12,
        },
        maxSignalsPerDay: 2,
        cooldownMinutes: 720,
      },
    ]);

    await db.insert(notificationSettings).values({
      userId: user.id,
      channel: "telegram",
      isEnabled: false,
    });
  }

  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
