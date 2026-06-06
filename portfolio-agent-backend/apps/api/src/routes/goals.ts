import { Elysia } from "elysia";
import { GoalService } from "../services/goals/GoalService";

const goalService = new GoalService();

export const goalsRoutes = new Elysia({ prefix: "/goals" })
  .get("/", () => goalService.list())
  .post("/", () => goalService.create())
  .get("/:id", () => goalService.getById())
  .patch("/:id", () => goalService.update());
