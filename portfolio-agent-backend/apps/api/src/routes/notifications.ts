import { Elysia } from "elysia";
import { TelegramProvider } from "@portfolio-agent/notifications";
import { NotificationService } from "../services/notifications/NotificationService";

const telegram = new TelegramProvider();
const notificationService = new NotificationService(telegram);

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .post("/telegram/test", () => notificationService.sendTelegramTest())
  .get("/", () => ({ message: "Not implemented", status: 501 }));
