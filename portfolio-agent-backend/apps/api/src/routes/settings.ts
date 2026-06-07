import { Elysia, t } from "elysia";
import { getDb } from "@portfolio-agent/db";
import { getEnv } from "@portfolio-agent/shared";
import { SettingsService } from "../services/settings/SettingsService";

const db = getDb();
const settingsService = new SettingsService(db);

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .get("/", async () => {
    const userId = getEnv().DEFAULT_USER_ID;
    const [preferences, system, availableModels] = await Promise.all([
      settingsService.getModelPreferences(userId),
      settingsService.getSystemInfo(),
      settingsService.getAvailableModels(),
    ]);

    return { preferences, system, availableModels };
  })
  .get("/models", async () => {
    const userId = getEnv().DEFAULT_USER_ID;
    const [models, availableModels] = await Promise.all([
      settingsService.getModelPreferences(userId),
      settingsService.getAvailableModels(),
    ]);

    return { models, availableModels };
  })
  .patch(
    "/models",
    async ({ body }) => {
      const userId = getEnv().DEFAULT_USER_ID;
      const current = await settingsService.getModelPreferences(userId);
      const models = await settingsService.updateModelPreferences(userId, {
        fastModel: body.fastModel ?? current.fastModel,
        thinkingModel: body.thinkingModel ?? current.thinkingModel,
      });
      return { models };
    },
    {
      body: t.Object({
        fastModel: t.Optional(t.String()),
        thinkingModel: t.Optional(t.String()),
      }),
    },
  );
