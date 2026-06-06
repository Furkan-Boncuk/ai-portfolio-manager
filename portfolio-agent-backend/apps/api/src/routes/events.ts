import { Elysia } from "elysia";
import { SSEService } from "../services/events/SSEService";

const sseService = new SSEService();

export const eventsRoutes = new Elysia({ prefix: "/events" }).get(
  "/stream",
  ({ set }) => {
    set.headers["content-type"] = "text/event-stream";
    set.headers["cache-control"] = "no-cache";
    set.headers["connection"] = "keep-alive";
    return sseService.createStream();
  },
);
