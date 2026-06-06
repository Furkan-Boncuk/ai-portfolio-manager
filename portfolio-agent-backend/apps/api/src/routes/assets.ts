import { Elysia, t } from "elysia";
import { AssetService } from "../services/assets/AssetService";

const assetService = new AssetService();

export const assetsRoutes = new Elysia({ prefix: "/assets" })
  .get("/", () => assetService.list())
  .post("/", ({ body }) => assetService.create(body), {
    body: t.Object({
      symbol: t.String(),
      name: t.String(),
      assetType: t.Union([
        t.Literal("CRYPTO"),
        t.Literal("STOCK"),
        t.Literal("ETF"),
        t.Literal("FOREX"),
        t.Literal("COMMODITY"),
      ]),
      exchange: t.Optional(t.String()),
      quoteCurrency: t.Optional(t.String()),
      provider: t.Optional(t.String()),
      providerSymbol: t.Optional(t.String()),
    }),
  })
  .get("/:id", ({ params }) => assetService.getById(params.id));
