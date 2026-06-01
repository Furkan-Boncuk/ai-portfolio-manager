import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { setupCors } from "./middleware/cors";
import { isPublicPath, checkAuth } from "./middleware/auth";
import { healthRoutes } from "./routes/health";
import { portfolioRoutes } from "./routes/portfolios";
import { assetsRoutes } from "./routes/assets";
import { goalsRoutes } from "./routes/goals";
import { watchlistRoutes } from "./routes/watchlists";
import { strategyRoutes } from "./routes/strategies";
import { signalRoutes } from "./routes/signals";
import { chatRoutes } from "./routes/chat";
import { agentRoutes } from "./routes/agent";
import { notificationRoutes } from "./routes/notifications";
import { eventsRoutes } from "./routes/events";

const token = process.env.LOCAL_AUTH_TOKEN ?? "";

const app = new Elysia()
  .use(
    swagger({
      path: "/api/docs",
      documentation: {
        info: {
          title: "Portfolio AI Signal Agent API",
          version: "0.1.0",
          description: "Local-first portfolio monitoring and signal generation",
        },
      },
    })
  )
  .use(setupCors)
  .onError(({ error }) => {
    console.error(`[api] error: ${(error as Error).message}`);
    return {
      status: (error as { status?: number }).status ?? 500,
      body: {
        error: {
          code: "INTERNAL_ERROR",
          message: (error as Error).message,
        },
      },
    };
  })
  .onBeforeHandle(({ path, request, set }) => {
    if (isPublicPath(path)) return;
    if (!checkAuth(token, request)) {
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Authentication required" } };
    }
  })
  .use(healthRoutes)
  .post("/api/v1/auth/local-session", ({ set }) => {
    if (!token) {
      set.status = 500;
      return { error: "Auth token not configured" };
    }
    set.headers["set-cookie"] =
      `auth_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`;
    return { ok: true };
  })
  .group("/api/v1", (api) =>
    api
      .use(healthRoutes)
      .use(portfolioRoutes)
      .use(assetsRoutes)
      .use(goalsRoutes)
      .use(watchlistRoutes)
      .use(strategyRoutes)
      .use(signalRoutes)
      .use(chatRoutes)
      .use(agentRoutes)
      .use(notificationRoutes)
      .use(eventsRoutes)
  );

export { app };
