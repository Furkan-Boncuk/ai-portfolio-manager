import { pgTable, uuid, varchar, text, timestamp, numeric, jsonb, boolean, integer, uniqueIndex, index, pgEnum, customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector";
  },
});

export const assetTypeEnum = pgEnum("asset_type", [
  "CRYPTO",
  "STOCK",
  "ETF",
  "FOREX",
  "COMMODITY",
]);

export const directionEnum = pgEnum("direction", ["long", "short"]);

export const signalStatusEnum = pgEnum("signal_status", [
  "active",
  "invalidated",
  "completed",
  "expired",
  "rejected",
]);

export const positionStatusEnum = pgEnum("position_status", [
  "open",
  "closed",
  "cancelled",
  "manual",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  baseCurrency: varchar("base_currency", { length: 10 }).notNull().default("TRY"),
  riskProfile: varchar("risk_profile", { length: 50 }).default("moderate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: varchar("name", { length: 255 }).notNull(),
  baseCurrency: varchar("base_currency", { length: 10 }).notNull().default("TRY"),
  description: text("description"),
  maxAssetWeight: numeric("max_asset_weight", { precision: 5, scale: 2 }).default("1.00"),
  maxCryptoWeight: numeric("max_crypto_weight", { precision: 5, scale: 2 }).default("1.00"),
  rebalanceThreshold: numeric("rebalance_threshold", { precision: 5, scale: 2 }).default("0.05"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  assetType: assetTypeEnum("asset_type").notNull().default("CRYPTO"),
  exchange: varchar("exchange", { length: 100 }),
  quoteCurrency: varchar("quote_currency", { length: 10 }),
  baseCurrency: varchar("base_currency", { length: 10 }),
  provider: varchar("provider", { length: 50 }).notNull().default("binance"),
  providerSymbol: varchar("provider_symbol", { length: 50 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  quantity: numeric("quantity", { precision: 30, scale: 8 }).notNull(),
  averageCost: numeric("average_cost", { precision: 30, scale: 8 }),
  targetWeight: numeric("target_weight", { precision: 5, scale: 2 }),
  minWeight: numeric("min_weight", { precision: 5, scale: 2 }),
  maxWeight: numeric("max_weight", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id),
  title: varchar("title", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 30, scale: 2 }).notNull(),
  startAmount: numeric("start_amount", { precision: 30, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 30, scale: 2 }),
  currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  riskAcceptance: varchar("risk_acceptance", { length: 50 }).default("moderate"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goalProgressSnapshots = pgTable("goal_progress_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id),
  portfolioValue: numeric("portfolio_value", { precision: 30, scale: 2 }),
  requiredDailyGrowth: numeric("required_daily_growth", { precision: 10, scale: 4 }),
  requiredWeeklyGrowth: numeric("required_weekly_growth", { precision: 10, scale: 4 }),
  requiredMonthlyGrowth: numeric("required_monthly_growth", { precision: 10, scale: 4 }),
  progressRatio: numeric("progress_ratio", { precision: 5, scale: 2 }),
  riskComment: text("risk_comment"),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const watchlistAssets = pgTable("watchlist_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchlistId: uuid("watchlist_id")
    .notNull()
    .references(() => watchlists.id),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  timeframe: varchar("timeframe", { length: 10 }).notNull().default("15m"),
  strategyType: varchar("strategy_type", { length: 20 }).notNull().default("scalp"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const strategyConfigs = pgTable("strategy_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  strategyType: varchar("strategy_type", { length: 20 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  params: jsonb("params").notNull().default({}),
  maxSignalsPerDay: integer("max_signals_per_day").default(20),
  cooldownMinutes: integer("cooldown_minutes").default(60),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketCandles = pgTable(
  "market_candles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    provider: varchar("provider", { length: 50 }).notNull(),
    timeframe: varchar("timeframe", { length: 10 }).notNull(),
    openTime: timestamp("open_time").notNull(),
    closeTime: timestamp("close_time"),
    open: numeric("open", { precision: 30, scale: 8 }).notNull(),
    high: numeric("high", { precision: 30, scale: 8 }).notNull(),
    low: numeric("low", { precision: 30, scale: 8 }).notNull(),
    close: numeric("close", { precision: 30, scale: 8 }).notNull(),
    volume: numeric("volume", { precision: 30, scale: 8 }).notNull(),
    isClosed: boolean("is_closed").notNull().default(true),
    raw: jsonb("raw").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueCandle: uniqueIndex("uq_candle").on(
      table.assetId,
      table.provider,
      table.timeframe,
      table.openTime
    ),
    assetTimeIdx: index("idx_candle_asset_time").on(table.assetId, table.timeframe, table.openTime),
  })
);

export const signals = pgTable("signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  strategyConfigId: uuid("strategy_config_id").references(() => strategyConfigs.id),
  signalType: varchar("signal_type", { length: 20 }).notNull(),
  direction: directionEnum("direction").notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  entryLow: numeric("entry_low", { precision: 30, scale: 8 }),
  entryHigh: numeric("entry_high", { precision: 30, scale: 8 }),
  invalidationPrice: numeric("invalidation_price", { precision: 30, scale: 8 }).notNull(),
  takeProfit1: numeric("take_profit_1", { precision: 30, scale: 8 }),
  takeProfit2: numeric("take_profit_2", { precision: 30, scale: 8 }),
  takeProfit3: numeric("take_profit_3", { precision: 30, scale: 8 }),
  riskLevel: varchar("risk_level", { length: 20 }).notNull().default("medium"),
  confidence: integer("confidence").notNull().default(50),
  status: signalStatusEnum("status").notNull().default("active"),
  reasonSummary: text("reason_summary"),
  aiExplanation: text("ai_explanation"),
  evidence: jsonb("evidence").default({}),
  disclaimer: varchar("disclaimer", { length: 500 }).default(
    "Bu yatirim tavsiyesi degildir."
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const signalOutcomes = pgTable("signal_outcomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  signalId: uuid("signal_id")
    .notNull()
    .references(() => signals.id),
  outcomeStatus: varchar("outcome_status", { length: 50 }),
  maxFavorableMove: numeric("max_favorable_move", { precision: 10, scale: 2 }),
  maxAdverseMove: numeric("max_adverse_move", { precision: 10, scale: 2 }),
  reachedTp1At: timestamp("reached_tp1_at"),
  reachedTp2At: timestamp("reached_tp2_at"),
  invalidatedAt: timestamp("invalidated_at"),
  evaluatedAt: timestamp("evaluated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  signalId: uuid("signal_id").references(() => signals.id),
  status: positionStatusEnum("status").notNull().default("manual"),
  source: varchar("source", { length: 50 }).notNull().default("manual"),
  entryPrice: numeric("entry_price", { precision: 30, scale: 8 }),
  entryTime: timestamp("entry_time"),
  exitPrice: numeric("exit_price", { precision: 30, scale: 8 }),
  exitTime: timestamp("exit_time"),
  quantity: numeric("quantity", { precision: 30, scale: 8 }),
  realizedPnl: numeric("realized_pnl", { precision: 30, scale: 2 }),
  unrealizedPnl: numeric("unrealized_pnl", { precision: 30, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  signalId: uuid("signal_id").references(() => signals.id),
  channel: varchar("channel", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  destination: varchar("destination", { length: 255 }),
  message: text("message"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  goalId: uuid("goal_id").references(() => goals.id),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("running"),
  modelName: varchar("model_name", { length: 100 }),
  inputSummary: text("input_summary"),
  finalSummary: text("final_summary"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentSteps = pgTable("agent_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id")
    .notNull()
    .references(() => agentRuns.id),
  stepIndex: integer("step_index").notNull(),
  stepType: varchar("step_type", { length: 50 }).notNull(),
  content: text("content"),
  toolName: varchar("tool_name", { length: 100 }),
  toolInput: jsonb("tool_input"),
  toolOutput: jsonb("tool_output"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const researchSources = pgTable("research_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  assetId: uuid("asset_id").references(() => assets.id),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: text("url"),
  publisher: varchar("publisher", { length: 255 }),
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  contentHash: varchar("content_hash", { length: 255 }),
  rawMetadata: jsonb("raw_metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ragDocuments = pgTable("rag_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  sourceId: uuid("source_id").references(() => researchSources.id),
  assetId: uuid("asset_id").references(() => assets.id),
  title: varchar("title", { length: 500 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  originalUri: text("original_uri"),
  contentHash: varchar("content_hash", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ragChunks = pgTable("rag_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => ragDocuments.id),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  embedding: vector("embedding"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scheduledJobs = pgTable("scheduled_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }),
  config: jsonb("config").default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobRuns = pgTable("job_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("running"),
  idempotencyKey: varchar("idempotency_key", { length: 500 }).notNull(),
  errorSummary: text("error_summary"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appEvents = pgTable("app_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("system"),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const riskPolicies = pgTable("risk_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  policy: jsonb("policy").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  channel: varchar("channel", { length: 50 }).notNull(),
  destination: varchar("destination", { length: 255 }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentMissions = pgTable("agent_missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  missionPromptSummary: text("mission_prompt_summary"),
  fullPromptRef: varchar("full_prompt_ref", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investmentTheses = pgTable("investment_theses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id),
  assetId: uuid("asset_id").references(() => assets.id),
  title: varchar("title", { length: 255 }).notNull(),
  thesisBody: text("thesis_body"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  confidenceNote: text("confidence_note"),
  invalidationNote: text("invalidation_note"),
  reviewCadence: varchar("review_cadence", { length: 50 }),
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const suggestedSources = pgTable("suggested_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  assetId: uuid("asset_id").references(() => assets.id),
  sourceType: varchar("source_type", { length: 50 }),
  title: varchar("title", { length: 500 }).notNull(),
  url: text("url"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const providerConfigs = pgTable("provider_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  providerType: varchar("provider_type", { length: 50 }).notNull(),
  providerName: varchar("provider_name", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const toolRegistry = pgTable("tool_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  allowedAgents: jsonb("allowed_agents").default([]),
  inputSchemaSummary: text("input_schema_summary"),
  outputSchemaSummary: text("output_schema_summary"),
  lastUsedAt: timestamp("last_used_at"),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentDefinitions = pgTable("agent_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  schedule: varchar("schedule", { length: 100 }),
  lastRunAt: timestamp("last_run_at"),
  currentTask: text("current_task"),
  allowedTools: jsonb("allowed_tools").default([]),
  promptSummary: text("prompt_summary"),
  constraints: jsonb("constraints").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Indexes managed via migration files
