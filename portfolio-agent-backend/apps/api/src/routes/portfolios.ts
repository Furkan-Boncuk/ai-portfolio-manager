import { Elysia, t } from "elysia";
import { PortfolioService } from "../services/portfolios/PortfolioService";

const portfolioService = new PortfolioService();

export const portfolioRoutes = new Elysia({ prefix: "/portfolios" })
  .get("/", () => portfolioService.list())
  .post("/", ({ body }) => portfolioService.create(body), {
    body: t.Object({
      userId: t.String(),
      workspaceId: t.String(),
      name: t.String(),
      baseCurrency: t.Optional(t.String()),
      description: t.Optional(t.String()),
    }),
  })
  .get("/:id", ({ params }) => portfolioService.getById(params.id));
