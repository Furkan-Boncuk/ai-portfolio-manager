import { Elysia } from "elysia";
import { StrategyService } from "../services/strategies/StrategyService";

const strategyService = new StrategyService();

export const strategyRoutes = new Elysia({ prefix: "/strategies" })
  .get("/", () => strategyService.list())
  .post("/", () => strategyService.create())
  .get("/:id", () => strategyService.getById())
  .patch("/:id", () => strategyService.update());
