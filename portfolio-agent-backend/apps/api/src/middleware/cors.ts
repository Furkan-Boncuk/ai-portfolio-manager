import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { getEnv } from "@portfolio-agent/shared";

export function setupCors(app: Elysia): Elysia {
  const env = getEnv();

  return app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}
