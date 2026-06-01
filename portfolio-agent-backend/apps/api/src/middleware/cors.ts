import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

export function setupCors(app: Elysia): Elysia {
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  return app.use(
    cors({
      origin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}
