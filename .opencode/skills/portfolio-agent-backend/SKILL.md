---
name: portfolio-agent-backend
description: Use when developing or modifying the backend code for the AI Portfolio Manager in portfolio-agent-backend/. Covers Bun monorepo, Elysia.js API, service layer pattern, dependency injection, Drizzle ORM, Zod validation, typed errors, SSE events, signal engine, market data, worker jobs, and clean architecture rules.
---

# Portfolio Agent Backend — Coding Conventions

> ## ⚠️ SOURCE OF TRUTH
> Bu skill **kesin bağlayıcıdır**. Agent burada yazılı olan tüm kurallara uymak zorundadır.
> Mevcut proje kodu bu skill ile çelişiyorsa **proje kodu yanlıştır** ve agent onu **refactor etmelidir**.
> Skill'de yazan pattern, projenin her yerinde tutarlı şekilde uygulanana kadar eski kod düzeltilir.
> "Proje zaten böyleydi" bahanesi kabul edilmez.

---

## 1. Architecture

```
portfolio-agent-backend/
├── apps/
│   ├── api/          # Elysia.js REST + SSE server
│   └── worker/       # Background scheduler & jobs
├── packages/
│   ├── shared/       # Config (getEnv), errors, events, domain types, validation
│   ├── db/           # Drizzle ORM schema, migrations, repositories, seed
│   ├── agent-core/   # Ollama provider, AgentRunner (chat, signal review)
│   ├── market-data/  # Binance & Mock market data providers
│   ├── signal-engine/# Technical indicators & scalp/swing strategies
│   └── notifications/# Telegram notification provider
└── package.json      # Workspace root
```

Package naming: `@portfolio-agent/<name>`

---

## 2. Comment Rules

- **Never remove existing comments** — they are there for a reason
- **Add comments only when necessary** — code should be self-documenting
- **English only** — all comments must be in English, never Turkish or any other language
- Focus comments on *why*, not *what* (the code already says what it does)

---

## 3. Non-Negotiable Rules

- **No Prisma, NestJS, Express, Next.js, LangChain, LangGraph, CrewAI**
- **No live trading code** — no `placeOrder`, `withdraw`, or Binance private API
- **No raw chain-of-thought exposure** to user
- **No `any`** — TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess`)
- **Side-effect functions** must indicate so in their name (e.g., `saveSignal`, `sendNotification`)
- **All external API responses** treated as `unknown`, then parsed with Zod
- **All LLM structured output** validated with Zod
- **No `as` type assertions** — use Zod `parse` or type guards instead

---

## 4. Clean Architecture — Layered Pattern

Projede **3 katman** ayırımı zorunludur:

```
┌─────────────────────────────────────┐
│  Routes (transport layer)           │
│  - HTTP request/response handling   │
│  - Auth, validation, serialization  │
│  - NO business logic here           │
├─────────────────────────────────────┤
│  Services (use-case / business)     │
│  - Business logic, orchestration    │
│  - Provider çağrıları, event emit   │
│  - Test edilebilir saf mantık       │
├─────────────────────────────────────┤
│  Repositories (data access)         │
│  - DB CRUD, queries                 │
│  - Drizzle ORM                      │
│  - Transaction support              │
└─────────────────────────────────────┘
```

### Route → Service → Repository akışı:

```ts
// ❌ YANLIŞ: Business logic route içinde
app.post("/portfolios", async ({ body }) => {
  const db = getDb();
  const result = await db.insert(portfolios).values(body).returning();
  return result;
});

// ✅ DOĞRU: Route sadece HTTP işini yapar
app.post("/portfolios", async ({ body, set }) => {
  const service = new PortfolioService(db);
  const result = await service.createPortfolio(body);
  return { data: result };
});
```

---

## 5. Service Layer

Tüm business logic **service class'larında** olmalıdır. Route'lar sadece HTTP taşımacılığı yapar.

```ts
// apps/api/src/services/PortfolioService.ts
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { portfolios } from "@portfolio-agent/db/schema";
import { AppError } from "@portfolio-agent/shared/errors";

export class PortfolioService {
  constructor(private db: NodePgDatabase) {}

  async listPortfolios(userId: string) {
    return this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
  }

  async createPortfolio(data: CreatePortfolioInput, userId: string) {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new AppError("Portfolio name is required", "VALIDATION_ERROR", 400);
    }
    // Business logic
    const [result] = await this.db
      .insert(portfolios)
      .values({ ...data, userId })
      .returning();
    return result;
  }

  async getPortfolioById(id: string, userId: string) {
    const [result] = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)))
      .limit(1);
    if (!result) {
      throw new AppError("Portfolio not found", "NOT_FOUND", 404);
    }
    return result;
  }
}
```

```ts
// Route — sadece HTTP
import { PortfolioService } from "../services/PortfolioService";

export const portfolioRoutes = new Elysia()
  .get("/portfolios", async ({ query }) => {
    const service = new PortfolioService(getDb());
    return service.listPortfolios(query.userId as string);
  });
```

**Kural:** Route dosyaları asla `getDb()` + Drizzle sorgusu içermemeli. Tüm DB erişimi Service veya Repository katmanında.

---

## 6. Dependency Injection (DI)

**Hiçbir yerde** `new Provider()` doğrudan kullanılmayacak. Bağımlılıklar constructor üzerinden enjekte edilir.

```ts
// ❌ YANLIŞ: Hardcoded dependency
class AgentRunner {
  private llm = new OllamaProvider();  // Bağımlı sabitlendi, test edilemez
}

// ✅ DOĞRU: Constructor injection
class AgentRunner {
  constructor(
    private llm: LLMProvider,
    private db: NodePgDatabase
  ) {}
}

// Kullanım:
const runner = new AgentRunner(new OllamaProvider(getEnv()), getDb());
// Test:
const runner = new AgentRunner(new MockLLMProvider(), testDb);
```

**Mevcut ihlaller (düzeltilmeli):**
- `agent-core/runner.ts` → `new OllamaProvider()` hardcoded
- `chat.ts` → `new AgentRunner()` module-level singleton
- `market-watcher.ts` → `new BinanceProvider()` / `new MockMarketProvider()` hardcoded
- `signal-evaluator.ts` → `new TelegramProvider()` hardcoded
- `notifications.ts` route → `new TelegramProvider()` hardcoded

---

## 7. Repository Pattern

Repository'ler **class** olmalı ve **transaction** desteği sağlamalı:

```ts
// packages/db/src/repositories/PortfolioRepository.ts
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { portfolios } from "../schema";
import { eq } from "drizzle-orm";

export class PortfolioRepository {
  constructor(private db: NodePgDatabase) {}

  async findAll(userId: string) {
    return this.db.select().from(portfolios).where(eq(portfolios.userId, userId));
  }

  async findById(id: string) {
    const [result] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .limit(1);
    return result ?? null;
  }

  async create(data: NewPortfolio) {
    const [result] = await this.db.insert(portfolios).values(data).returning();
    return result;
  }
}
```

**Transaction örneği:**
```ts
await this.db.transaction(async (tx) => {
  const repo = new PortfolioRepository(tx);
  const holdingRepo = new HoldingRepository(tx);
  const portfolio = await repo.create(data);
  await holdingRepo.create({ portfolioId: portfolio.id, ... });
  return portfolio;
});
```

**Mevcut ihlaller (düzeltilmeli):**
- Repository'ler loose function, class değil
- Her fonksiyon kendi `getDb()`'sini çağırıyor
- Transaction desteği yok
- `candles.ts`'de N+1 upsert — batch yapılmalı

---

## 8. Error Handling

Mevcut `packages/shared/src/errors.ts`'deki hiyerarşi **kullanılmalı**, görmezden gelinmemeli.

```ts
// ✅ DOĞRU: Domain error sınıflarını kullan
import { ValidationError, NotFoundError, ExternalProviderError } from "@portfolio-agent/shared/errors";

async function createPortfolio(data: unknown) {
  const parsed = createPortfolioSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError("Invalid portfolio data", { issues: parsed.error.issues });
  }
  // ...
}

async function getCandles(symbol: string) {
  try {
    return await provider.getCandles(symbol);
  } catch (error) {
    throw new ExternalProviderError("Failed to fetch candles", "binance", { symbol });
  }
}
```

```ts
// Route'da error handling:
app
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return error.toJSON();
    }
    console.error("Unhandled error:", error);
    set.status = 500;
    return {
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    };
  })
```

**Mevcut ihlaller (düzeltilmeli):**
- API route'ları `AppError` kullanmıyor — hata mesajları string olarak dönüyor
- Bazı route'larda hiç try/catch yok
- Error response shape tutarsız: kimi `{ error: "message" }`, kimi `{ error: { code, message } }`
- `events.ts`'de `catch {}` sessiz hata yutma
- `app.ts` global handler `AppError` kontrolü yapmıyor, `(error as any)` cast kullanıyor

---

## 9. Type Safety — No `as` Casts

Type assertion (`as`) **kesinlikle yasaktır**. Bunun yerine Zod ile runtime validation yap:

```ts
// ❌ YANLIŞ
const timeframe = someValue as "1m" | "5m" | "15m";
const params = strategy.params as Record<string, number>;

// ✅ DOĞRU
const timeframeSchema = z.enum(["1m", "5m", "15m", "1h", "4h"]);
const timeframe = timeframeSchema.parse(someValue);
const params = z.record(z.string(), z.number()).parse(strategy.params);
```

**Mevcut ihlaller (düzeltilmeli):**
- `market-watcher.ts` → `timeframe as "1m" | "5m" | ...`
- `signal-evaluator.ts` → `strategy.params as Record<string, number>`
- `signal-evaluator.ts` → `parseFloat(String(c.close))` tip uyumsuzluğu

---

## 10. Env Variable Access

**Tüm** env değişkenleri `getEnv()` üzerinden okunur. Asla doğrudan `process.env` kullanılmaz.

```ts
// ✅ DOĞRU
import { getEnv } from "@portfolio-agent/shared/config";
const env = getEnv();
const interval = env.WORKER_POLL_INTERVAL_MS;

// ❌ YANLIŞ
const interval = parseInt(process.env.WORKER_POLL_INTERVAL_MS ?? "30000", 10);
```

**Mevcut ihlaller (düzeltilmeli):**
- `worker/index.ts` → `process.env.WORKER_POLL_INTERVAL_MS`
- `app.ts` → `process.env.LOCAL_AUTH_TOKEN`
- `apps/api/src/index.ts` → `process.env.API_PORT`
- `cors.ts` → `process.env.CORS_ORIGIN`
- `events.ts` → hardcoded 3s interval
- `market-watcher.ts` → `process.env.MARKET_DATA_PROVIDER`

---

## 11. Zod Validation

Zod validation her girdi noktasında yapılır:

```ts
// 1. API request body — Elysia t.Object() ile
.post("/portfolios", async ({ body }) => { ... }, {
  body: t.Object({
    name: t.String({ minLength: 1 }),
    baseCurrency: t.Optional(t.String({ maxLength: 10 })),
  }),
})

// 2. External API response — once unknown, then parse
const raw: unknown = await fetch(url).then(r => r.json());
const validated = candleSchema.parse(raw);

// 3. LLM structured output
const parsed = signalReviewSchema.parse(llmResponse);

// 4. Service input
function createPortfolio(input: unknown) {
  const data = createPortfolioSchema.parse(input);
}

// 5. Path params
.get("/portfolios/:id", async ({ params: { id } }) => {
  const uuid = z.string().uuid().parse(id);
  // ...
})
```

Her `parse` başarısız olursa ValidationError fırlatır. `safeParse` kullanılırsa hata elle yönetilir.

---

## 12. Service / Repository DI in Routes

Route'lar bağımlılıklarını **manuel enjeksiyon** ile alır. Her route handler çağrısında yeni service instance'ı oluşturulabilir:

```ts
// Simple factory pattern
function createServices() {
  const db = getDb();
  return {
    portfolio: new PortfolioService(db),
    signal: new SignalService(db, getEnv()),
  };
}

export const portfolioRoutes = new Elysia()
  .get("/portfolios", async () => {
    const { portfolio } = createServices();
    return portfolio.listPortfolios(userId);
  });
```

Veya Elysia's **state/decorate** mekanizması:
```ts
const app = new Elysia()
  .decorate("db", getDb())
  .decorate("services", {
    portfolio: new PortfolioService(getDb()),
    signal: new SignalService(getDb(), getEnv()),
  });
```

---

## 13. Provider Abstraction & DI

Tüm provider'lar interface arkasında. Service'ler provider'ı constructor'da alır:

```ts
// Provider interface (packages/market-data/src/types.ts)
export interface MarketDataProvider {
  getCandles(input: CandleRequest): Promise<Candle[]>;
  getTicker(symbol: string): Promise<Ticker>;
}

// Service provider'ı enjekte alır
export class MarketWatcherService {
  constructor(
    private provider: MarketDataProvider,
    private db: NodePgDatabase,
    private eventBus: EventBus
  ) {}

  async checkCandles(watchlist: WatchlistAsset[]) {
    const candles = await this.provider.getCandles({ symbol, interval });
    await this.db.insert(marketCandles).values(candles);
    this.eventBus.emit("market.candle.closed", { assetId, timeframe });
  }
}
```

---

## 14. Event Bus Pattern

Worker ve API arasında event taşıma için soyutlanmış bir EventBus kullanın:

```ts
// Interface
interface EventBus {
  emit(eventType: string, payload: unknown): Promise<void>;
}

// PostgreSQL implementation (MVP)
class PostgresEventBus implements EventBus {
  constructor(private db: NodePgDatabase) {}

  async emit(eventType: string, payload: unknown) {
    await this.db.insert(appEvents).values({
      eventType,
      payload: payload as Record<string, unknown>,
      source: "worker",
    });
  }
}

// Usage in service:
class SignalEvaluatorService {
  constructor(
    private db: NodePgDatabase,
    private eventBus: EventBus,
    private telegram: NotificationProvider
  ) {}

  async evaluate(strategy: StrategyConfig, candles: Candle[]) {
    const signal = await this.runStrategy(strategy, candles);
    if (signal) {
      await this.saveSignal(signal);
      await this.eventBus.emit("signal.created", { signalId: signal.id });
      await this.telegram.send(signal);
    }
  }
}
```

---

## 15. Worker Patterns

Worker restart-safe ve idempotent olmalıdır:

```ts
// ✅ DOĞRU
export class WorkerService {
  private running = true;

  constructor(
    private marketWatcher: MarketWatcherService,
    private signalEvaluator: SignalEvaluatorService,
    private eventBus: EventBus,
    private interval: number
  ) {}

  async start() {
    // Graceful shutdown
    process.on("SIGINT", () => { this.running = false; });
    process.on("SIGTERM", () => { this.running = false; });

    while (this.running) {
      try {
        await this.eventBus.emit("worker.heartbeat", { timestamp: new Date() });
        await this.marketWatcher.process();
        await this.signalEvaluator.process();
      } catch (error) {
        console.error("Worker error:", error);
        // Don't crash — log and continue
      }
      await sleep(this.interval);
    }
  }
}
```

**Idempotency key pattern:**
```ts
const key = `signal:${assetId}:${strategyId}:${timeframe}:${candleCloseTime}`;
const existing = await this.jobRepo.findByKey(key);
if (existing) return; // Already processed
await this.jobRepo.create({ idempotencyKey: key, status: "running" });
```

---

## 16. Clean Code Rules

### No Business Logic in Routes
Route dosyası sadece HTTP işlemi yapar: request oku, service çağır, response dön.

### No Magic Strings / Numbers
```ts
// ❌ YANLIŞ
const userId = "fc650a01-85f1-4d63-afec-f3b7c99c5272";

// ✅ DOĞRU
const userId = getEnv().DEFAULT_USER_ID;
```

### No Silent Error Swallowing
```ts
// ❌ YANLIŞ
catch {}  // sessiz yutma

// ✅ DOĞRU
catch (error) {
  console.error("Failed to process:", error);
  throw new ExternalProviderError("Operation failed", "provider");
}
```

### No Module-Level Mutable State
```ts
// ❌ YANLIŞ
const subscribers = new Set();  // module-level state
let lastId = null;

// ✅ DOĞRU
class SSEBroadcaster {
  private subscribers = new Set<SSEClient>();
  // state instance içinde
}
```

### Consistent Error Responses
```ts
// Tüm hatalar aynı formatta:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## 17. Financial Safety Rules

- Her sinyalde `invalidationPrice` (stop) zorunlu
- Her sinyalde `disclaimer`: "Bu yatirim tavsiyesi degildir."
- LLM risk filter'ı override edemez
- LLM kesin iddia edemez ("kesin yukselir", "al")
- Confidence score 0-100 aralığı dışına çıkamaz
- Sinyal gönderilmeden önce cooldown kontrolü yapılır
- Aynı asset/timeframe için spam engellenir

---

## 18. Mevcut Kodda Düzeltilmesi Gereken İhlaller

> Agent bu skill'i gördüğünde aşağıdaki ihlalleri de düzeltmelidir.

| # | İhlal | Dosya | Yapılması Gereken |
|---|-------|-------|-------------------|
| 1 | Business logic route içinde | `chat.ts`, `portfolios.ts`, `assets.ts` | Service katmanına taşı |
| 2 | Hardcoded user UUID | `chat.ts:15` | Env/config'den al veya auth'dan çek |
| 3 | Hardcoded `new Provider()` | `runner.ts`, `market-watcher.ts`, `signal-evaluator.ts` | Constructor injection |
| 4 | `AppError` kullanılmıyor | Tüm route'lar | Domain error sınıflarını kullan |
| 5 | `as` type assertion | `market-watcher.ts`, `signal-evaluator.ts` | Zod parse ile değiştir |
| 6 | `process.env` doğrudan | `worker/`, `app.ts`, `cors.ts` | `getEnv()` ile değiştir |
| 7 | Module-level mutable state | `events.ts` | Class içine al |
| 8 | N+1 upsert | `candles.ts` | Batch upsert yap |
| 9 | Error response shape tutarsız | Tüm route'lar | Standardize et |
| 10 | `getDb()` her fonksiyonda | Repository'ler | Constructor'da al |

---

## 19. Özet

| Kural | Açıklama |
|-------|----------|
| **Layered architecture** | Route → Service → Repository, her katman ayrı sorumlu |
| **DI** | Bağımlılıklar constructor'dan enjekte edilir, asla `new` ile sabitlenmez |
| **Service pattern** | Business logic service class'larında |
| **Repository pattern** | DB erişimi class-based repository'lerde, transaction destekli |
| **Zod validation** | Her dış girdi (API, provider, LLM) Zod ile parse edilir |
| **No `as`** | Type assertion yasak, Zod `parse` kullan |
| **Error hierarchy** | `AppError` ve alt sınıfları kullan |
| **getEnv()** | `process.env` direkt okunmaz |
| **Idempotency** | Her job unique key ile deduplicate edilir |
| **Financial safety** | Stop, disclaimer, risk level her sinyalde zorunlu |
