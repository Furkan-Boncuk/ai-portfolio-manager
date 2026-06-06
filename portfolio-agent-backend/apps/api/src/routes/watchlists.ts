import { Elysia } from "elysia";
import { WatchlistService } from "../services/watchlists/WatchlistService";

const watchlistService = new WatchlistService();

export const watchlistRoutes = new Elysia({ prefix: "/watchlists" })
  .get("/", () => watchlistService.list())
  .post("/", () => watchlistService.create())
  .get("/:id", () => watchlistService.getById())
  .patch("/:id", () => watchlistService.update())
  .delete("/:id", () => watchlistService.delete());
