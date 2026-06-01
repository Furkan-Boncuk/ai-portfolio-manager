import { Elysia, t } from "elysia";
import { listPortfolios, getPortfolioById, createPortfolio } from "@portfolio-agent/db/repositories/portfolios";

export const portfolioRoutes = new Elysia({ prefix: "/portfolios" })
  .get("/", async () => {
    const result = await listPortfolios();
    return { data: result };
  })
  .post(
    "/",
    async ({ body }) => {
      const result = await createPortfolio({
        userId: body.userId,
        workspaceId: body.workspaceId,
        name: body.name,
        baseCurrency: body.baseCurrency,
        description: body.description,
      });
      return { data: result };
    },
    {
      body: t.Object({
        userId: t.String(),
        workspaceId: t.String(),
        name: t.String(),
        baseCurrency: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ params }) => {
    const result = await getPortfolioById(params.id);
    if (!result) return { error: "Not found" };
    return { data: result };
  });
