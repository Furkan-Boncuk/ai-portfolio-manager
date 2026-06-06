---
name: portfolio-agent-frontend
description: Use when developing or modifying the frontend code for the AI Portfolio Manager in portfolio-agent-frontend/. Covers React 19 + Vite 6 + TypeScript, Tailwind CSS 3 + design tokens, React Router 7, TanStack Query, Zustand, SSE EventSource, typed HTTP client, atomic design components, component prop interfaces, and state management guidelines.
---

# Portfolio Agent Frontend — Coding Conventions

> ## ⚠️ SOURCE OF TRUTH
> Bu skill **kesin bağlayıcıdır**. Agent burada yazılı olan tüm kurallara uymak zorundadır.
> Mevcut proje kodu bu skill ile çelişiyorsa **proje kodu yanlıştır** ve agent onu **refactor etmelidir**.
> Skill'de yazan pattern, projenin her yerinde tutarlı şekilde uygulanana kadar eski kod düzeltilir.
> "Proje zaten böyleydi" bahanesi kabul edilmez.

## Comment Rules

- **Never remove existing comments** — they are there for a reason
- **Add comments only when necessary** — code should be self-documenting
- **English only** — all comments must be in English, never Turkish or any other language
- Focus comments on *why*, not *what* (the code already says what it does)

## Tech Stack

- **React 19** + **TypeScript** strict mode
- **Vite 6** for dev/build
- **Tailwind CSS 3** for styling (dark theme, design tokens)
- **React Router 7** (BrowserRouter) for navigation
- **TanStack Query** (`@tanstack/react-query`) for server state / data fetching
- **Zustand** for client state management (when needed)
- **lucide-react** for icons
- **EventSource** for SSE real-time events
- **clsx** for conditional class merging

---

## Project Structure (Atomic Design)

```
portfolio-agent-frontend/
├── src/
│   ├── main.tsx                 # Entry point, QueryClientProvider
│   ├── App.tsx                  # Router + navigation + auth init
│   ├── index.css                # Tailwind directives + design tokens
│   ├── lib/
│   │   ├── api.ts               # HTTP client (typed)
│   │   ├── sse.ts               # SSE connection manager
│   │   └── helpers/             # Pure helper functions
│   ├── store/                   # Zustand stores
│   │   └── useAuthStore.ts
│   ├── context/                 # React Contexts
│   │   └── SSEContext.tsx
│   ├── hooks/                   # Custom hooks
│   │   └── useSignals.ts
│   ├── types/                   # Shared TypeScript types
│   │   ├── api.ts               # API request/response types
│   │   └── domain.ts            # Domain model types
│   ├── utils/                   # (optional) Cross-component pure utilities
│   │   └── positions/           # only if used by 2+ components
│   │       └── statusVariant.ts
│   ├── components/              # Atomic design components
│   │   ├── atoms/               # Smallest: Button, Badge, Input, Card
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Badge.interface.ts
│   │   │   ├── SectionHeader/
│   │   │   │   ├── SectionHeader.tsx
│   │   │   │   └── SectionHeader.interface.ts
│   │   │   └── EmptyCard/
│   │   │       ├── EmptyCard.tsx
│   │   │       └── EmptyCard.interface.ts
│   │   ├── molecules/           # Combinations: SignalCard, PortfolioRow
│   │   │   ├── Positions/       # Position-specific molecules
│   │   │   │   ├── DirectionIcon/
│   │   │   │   │   ├── DirectionIcon.tsx
│   │   │   │   │   └── DirectionIcon.interface.ts
│   │   │   │   └── PnlDisplay/
│   │   │   │       ├── PnlDisplay.tsx
│   │   │   │       └── PnlDisplay.interface.ts
│   │   ├── organisms/           # Complex: SignalTable, PortfolioPanel
│   │   └── templates/           # Layouts: PageLayout, SidebarLayout
│   └── pages/                   # Page-level components (routes)
│       ├── Portfolio/
│       │   ├── Portfolio.tsx
│       │   ├── Portfolio.interface.ts   # Co-located types for this page
│       │   ├── PortfolioSummary.tsx
│       │   └── PortfolioAllocation.tsx
│       ├── Processing/
│       │   ├── Processing.tsx
│       │   └── Processing.interface.ts
│       ├── Signals/
│       ├── Chat/
│       ├── Decisions/
│       │   ├── DecisionsPage.tsx
│       │   └── Decisions.interface.ts
│       ├── Positions/
│       │   ├── PositionsPage.tsx
│       │   └── Positions.interface.ts
│       ├── Knowledge/
│       ├── Agents/
│       ├── Tools/
│       └── Settings/
├── index.html
├── vite.config.ts
├── tailwind.config.js           # Design tokens
├── postcss.config.js
├── tsconfig.json
└── Dockerfile
```

---

## TypeScript Types

### Domain Types

```ts
// src/types/domain.ts
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: "CRYPTO" | "STOCK" | "ETF" | "FOREX" | "COMMODITY";
  provider: string;
}

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Signal {
  id: string;
  assetId: string;
  signalType: "scalp" | "swing";
  direction: "long" | "short";
  timeframe: string;
  entryLow: string | null;
  entryHigh: string | null;
  invalidationPrice: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  status: "active" | "invalidated" | "completed" | "expired" | "rejected";
  reasonSummary: string | null;
  aiExplanation: string | null;
  disclaimer: string;
  createdAt: string;
}
```

### API Request/Response Types

```ts
// src/types/api.ts
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PortfolioListResponse {
  data: Portfolio[];
}

export interface CreatePortfolioRequest {
  name: string;
  baseCurrency?: string;
  description?: string;
}

export interface SignalListResponse {
  data: Signal[];
  total: number;
}
```

Every API call has typed request body and typed response. No `any`.

---

## typed HTTP Client

```ts
// src/lib/api.ts
import type { ApiError } from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem("auth_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
      credentials: "include",
    });

    if (res.status === 401) {
      await this.authWithToken();
      return this.request<T>(path, options);
    }

    if (!res.ok) {
      const err: ApiError = await res.json().catch(() => ({
        error: { code: "UNKNOWN", message: res.statusText },
      }));
      throw new Error(err.error.message);
    }

    return res.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  private async authWithToken(): Promise<void> {
    const token = import.meta.env.VITE_DEFAULT_TOKEN ?? "dev-local-token-change-me";
    await fetch(`${this.baseUrl}/api/v1/auth/local-session`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.setItem("auth_token", token);
  }
}

export const http = new HttpClient(BASE_URL);

export function getSSEUrl(): string {
  return import.meta.env.VITE_SSE_URL ?? `${BASE_URL}/api/v1/events/stream`;
}
```

Usage:
```ts
const portfolios = await http.get<PortfolioListResponse>("/api/v1/portfolios");
const created = await http.post<Portfolio>("/api/v1/portfolios", { name: "Main" });
```

---

## TanStack Query (Server State)

```tsx
// src/hooks/useSignals.ts
import { useQuery } from "@tanstack/react-query";
import { http } from "../lib/api";
import type { SignalListResponse } from "../types/api";

export function useSignals() {
  return useQuery<SignalListResponse>({
    queryKey: ["signals"],
    queryFn: () => http.get<SignalListResponse>("/api/v1/signals"),
    refetchInterval: 30_000, // poll every 30s
  });
}
```

```tsx
// In component:
import { useSignals } from "../hooks/useSignals";

function SignalList() {
  const { data, isLoading, error } = useSignals();

  if (isLoading) return <Loading />;
  if (error) return <Error message={(error as Error).message} />;

  return data.data.map((signal) => <SignalCard key={signal.id} signal={signal} />);
}
```

- All server data fetching goes through TanStack Query hooks
- Mutations use `useMutation` + `queryClient.invalidateQueries`
- Never use `useEffect` for data fetching
- Cache invalidation after create/update/delete

---

## Co-located Types & Constants (`<name>.interface.ts`)

Her component veya sayfanın **tipleri, constant'ları, record/map'leri ve config değerleri** — eğer sadece o componente özel ise — component ile aynı klasörde `<component_name>.interface.ts` dosyasında tanımlanır. Tüm atom/molecule/organism component'leri kendi klasörlerinde bulunur:

```
atoms/
├── Badge/
│   ├── Badge.tsx            # implementasyon
│   └── Badge.interface.ts   # tipler
├── SectionHeader/
│   ├── SectionHeader.tsx
│   └── SectionHeader.interface.ts
├── EmptyCard/
│   ├── EmptyCard.tsx
│   └── EmptyCard.interface.ts
└── Button/                  # yeni atomlar da aynı yapıda
    ├── Button.tsx
    └── Button.interface.ts

pages/Decisions/
├── DecisionsPage.tsx
└── Decisions.interface.ts   # DecisionsData, DecisionsPageProps burada
```

### Kurallar

- **Her** component, page, ve util için bir `<name>.interface.ts` dosyası zorunludur
- `.interface.ts` içinde **sadece tipler değil**, o componente özel constant'lar, record/map'ler ve config değerleri de tanımlanır
- Props interface'leri ve domain type'ları bu dosyada tanımlanır
- Component sadece implementasyon içerir — type'lar ve constant'lar `.interface.ts` dosyasından import edilir
- API'den gelen response tipleri de burada tutulur
- **Her component kendi klasöründe** olmalıdır — `Badge/Badge.tsx` + `Badge/Badge.interface.ts`, asla `Badge.tsx` + `Badge.interface.ts` şeklinde düz dosya değil
- Atomlar `atoms/<ComponentName>/`, moleküller `molecules/<Domain>/<ComponentName>/` altında
- **Eğer bir constant/config/record birden çok component tarafından kullanılıyorsa** — ancak o zaman `src/utils/<domain>/` altına taşınır
- Import yolu: `../../atoms/Badge/Badge`, `../../molecules/Navbar/Navbar.interface`

## Component Props Pattern

```tsx
// src/components/atoms/Badge/Badge.interface.ts
export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}
```

```tsx
// src/components/atoms/Badge/Badge.tsx
import { clsx } from "clsx";
import type { BadgeProps, BadgeVariant } from "./Badge.interface";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-900 text-green-300",
  warning: "bg-yellow-900 text-yellow-300",
  danger: "bg-red-900 text-red-300",
  info: "bg-blue-900 text-blue-300",
  neutral: "bg-gray-700 text-gray-300",
};

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span className={clsx("px-2 py-1 rounded text-xs font-medium", variantStyles[variant], className)}>
      {label}
    </span>
  );
}
```

**Rules:**
- Every component that accepts props defines a co-located `<name>.interface.ts` file
- Export the interface for reuse
- Use `className?: string` for style extension
- Use `children?: React.ReactNode` for wrapper components

### Inline Helper / Sub-component Rules

Component dosyasında **inline helper fonksiyon, config map veya alt-component tanımı YAPILMAZ**. Her şeyin yeri ayrıdır:

| Öğe | Nereye? | Örnek |
|---|---|---|
| **Component'e özel type/constant/record/map/config** | Component'in kendi `.interface.ts` dosyası | `molecules/Navbar/Navbar.interface.ts` — `navItems` |
| **Birden çok component'te kullanılan type/constant/util** | `src/utils/<domain>/` (nadiren, sadece gerçekten ortaksa) | `src/utils/positions/statusVariant.ts` |
| **Sayfaya özel küçük UI component** (2-3 prop, tek amaç) | `components/molecules/<Domain>/<ComponentName>/` | `molecules/Positions/DirectionIcon/DirectionIcon.tsx` |
| **Birden çok sayfada kullanılan UI component** | `components/atoms/<ComponentName>/` | `atoms/Badge/Badge.tsx` |
| **Component'in interface/constant dosyası** | Component ile aynı klasörde `<name>.interface.ts` | `atoms/Badge/Badge.interface.ts` |

**Kural:** Bir component dosyasında `function XxxHelper(...)` veya `const xxxMap = {...}` şeklinde inline tanım varsa, bu ya `.interface.ts` dosyasına ya da ayrı bir molecule/atom'a taşınmalıdır. Component sadece JSX ve state/logic binding'ini içerir.

### Enum Kullanımı

Raw string literal union (`"long" | "short"`) yerine **`enum`** kullan. Enum'lar `.interface.ts` dosyasında tanımlanır ve hem type hem de runtime value olarak çalışır.

```ts
// ❌ Yanlış
type Direction = "long" | "short";
if (direction === "long") { ... }

// ✅ Doğru
export enum Direction {
  Long = "long",
  Short = "short",
}
if (direction === Direction.Long) { ... }
```

**Kural:** Barkod string karşılaştırmaları (`=== "xyz"`) yasaktır. Her domain enum değeri bir `enum` ile tanımlanmalıdır. API'den gelen string değerler enum value ile eşleşir.

---

## State Management Guidelines

| State Type | Where | Example |
|---|---|---|
| **UI-local state** | `useState` in component | Form input values, dropdown open/close, tab selection |
| **Derived state** | `useMemo` / `useCallback` | Filtered list, computed totals |
| **Server state** | TanStack Query | Portfolios, signals, chat messages |
| **Shared client state** | Zustand store | Auth state, SSE connection status, theme preference |
| **Global context** | React Context (sparingly) | SSE event stream, theme provider |

### When to use Zustand vs Context vs Inline

- **Inline (`useState`):** State only matters to one component and its direct children. Example: form input, accordion open/close.
- **Context:** State is read-only or changes rarely, consumed by many descendants. Example: SSE connection, theme. Use sparingly — Context re-renders all consumers.
- **Zustand:** State is read/write, shared across unrelated components, or has complex update logic. Example: auth token, app preferences, notification queue.

```ts
// src/store/useAuthStore.ts
import { create } from "zustand";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("auth_token"),
  isAuthenticated: !!localStorage.getItem("auth_token"),
  setToken: (token) => {
    localStorage.setItem("auth_token", token);
    set({ token, isAuthenticated: true });
  },
  clearToken: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, isAuthenticated: false });
  },
}));
```

---

## Atomic Design Component Hierarchy

### Atoms (smallest, reusable)

```
Badge           → variant, label
Button          → variant, size, onClick, disabled
Input           → value, onChange, placeholder, error
Card            → children, className
Spinner         → size
Tooltip         → content, children
Icon            → name, size (lucide-react)
ErrorMessage    → message, onRetry
EmptyState      → title, description, action?
```

### Molecules (composed atoms)

```
SignalCard      → Card + Badge + Icon + formatted data
PortfolioRow    → Row + Badge + numeric values
WatchlistItem   → Card + Badge + Icon + timeframe
ChatBubble      → message content + timestamp + role indicator
SessionItem     → title + date + delete button
```

### Organisms (complex sections)

```
SignalTable     → list of SignalCard, sorting, filtering
PortfolioPanel  → portfolio summary + holdings list + allocation chart
ChatWindow      → message list + input + session sidebar
SSEStreamPanel  → event filters + live event log
```

### Templates (page layouts)

```
PageLayout      → header + sidebar + main content + footer
SidebarLayout   → narrow sidebar + content area
```

### Pages (route-level, composes organisms + templates)

```
PortfolioPage   → PageLayout + PortfolioPanel + PortfolioSummary
ProcessingPage  → PageLayout + SSEStreamPanel + worker status
SignalsPage     → PageLayout + SignalTable + filters
ChatPage        → SidebarLayout + ChatWindow
```

---

## Complex Logic Rules

- **Never put complex business logic inside a component.**
- Pure calculations → helper functions in `lib/helpers/`
- State mutations → Zustand store actions
- Data transformations → TanStack Query `select` option or helper
- Heavy computations → `useMemo`

```ts
// lib/helpers/signal.ts — pure helper, no React
export function getConfidenceLabel(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function formatCurrency(value: string, currency: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(num);
}
```

```tsx
// In component — clean, no inline logic
import { getConfidenceLabel } from "../lib/helpers/signal";

function SignalCard({ signal }: SignalCardProps) {
  const confidence = getConfidenceLabel(signal.confidence);
  return <Badge variant={confidence === "high" ? "success" : "warning"} label={confidence} />;
}
```

---

## SSE Patterns

```ts
// src/lib/sse.ts — SSE connection manager
type SSECallback = (data: unknown) => void;

class SSEManager {
  private source: EventSource | null = null;
  private listeners = new Map<string, SSECallback[]>();

  connect(url: string) {
    this.source = new EventSource(url);
    this.source.onopen = () => console.log("SSE connected");
    this.source.onerror = () => console.error("SSE error");
  }

  on(event: string, callback: SSECallback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
    this.source?.addEventListener(event, (e) => callback(JSON.parse(e.data)));
  }

  disconnect() {
    this.source?.close();
    this.source = null;
  }
}

export const sse = new SSEManager();
```

```tsx
// In Processing page:
import { useEffect } from "react";
import { sse } from "../lib/sse";
import { getSSEUrl } from "../lib/api";

function ProcessingPage() {
  useEffect(() => {
    sse.connect(getSSEUrl());
    sse.on("signal.created", (data) => { /* handle */ });
    sse.on("worker.heartbeat", (data) => { /* handle */ });
    return () => sse.disconnect();
  }, []);
}
```

---

## Design Tokens (Tailwind Config)

Design tokens are defined in `tailwind.config.js`. The theme uses a dark-first approach.

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Surface (backgrounds)
        surface: {
          base:    "#0a0a0f",
          raised:  "#111118",
          overlay: "#1a1a25",
          border:  "#2a2a3a",
          hover:   "#252535",
        },
        // Text
        text: {
          primary:   "#f0f0f5",
          secondary: "#a0a0b0",
          muted:     "#6b6b80",
          inverse:   "#0a0a0f",
        },
        // Semantic (status)
        semantic: {
          success:  "#22c55e",
          warning:  "#eab308",
          danger:   "#ef4444",
          info:     "#3b82f6",
        },
        // Signal risk levels
        risk: {
          low:    "#22c55e",
          medium: "#eab308",
          high:   "#ef4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};
```

Usage in components:
```tsx
<div className="bg-surface-raised border border-surface-border rounded-lg p-4">
  <h2 className="text-text-primary text-lg font-semibold">Portfolio</h2>
  <p className="text-text-secondary text-sm">Track your assets</p>
</div>
```

---

## CSS Conventions

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0a0a0f;  /* surface-base */
  color: #f0f0f5;       /* text-primary */
}
```

- Use Tailwind utility classes first
- Custom CSS only for animations or third-party overrides
- No CSS modules, no styled-components, no CSS-in-JS
- Dark theme is default; no light theme in MVP

---

## Env Variables

Only `VITE_` prefixed variables are exposed to the client bundle:
- `VITE_API_BASE_URL` — Backend API URL (default: `http://localhost:3000`)
- `VITE_SSE_URL` — SSE stream URL (falls back to `${VITE_API_BASE_URL}/api/v1/events/stream`)
- `VITE_DEFAULT_TOKEN` — Default auth token for local dev
- Never put secrets in frontend env variables

---

## No-Nos

- No Axios (use `http` client from `lib/api.ts`)
- No Next.js (plain React + Vite)
- No SSR (client-side only)
- No direct database access from frontend
- No secret/API key in client code
- No raw chain-of-thought display
- No business logic in components
- No `any` types
- No `useEffect` for data fetching (use TanStack Query)
- No inline styles (use Tailwind classes)
- No PropTypes (use TypeScript interfaces)
