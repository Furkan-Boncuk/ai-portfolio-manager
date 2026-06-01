import { Elysia } from "elysia";

export const strategyRoutes = new Elysia({ prefix: "/strategies" })
  .get("/", () => ({ message: "Not implemented", status: 501 }))
  .post("/", () => ({ message: "Not implemented", status: 501 }))
  .get("/:id", () => ({ message: "Not implemented", status: 501 }))
  .patch("/:id", () => ({ message: "Not implemented", status: 501 }));
