import { Elysia } from "elysia";
import { SignalService } from "../services/signals/SignalService";

const signalService = new SignalService();

export const signalRoutes = new Elysia({ prefix: "/signals" })
  .get("/", () => signalService.list())
  .get("/:id", ({ params }) => signalService.getById(params.id));
