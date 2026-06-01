import { Elysia } from "elysia";

export const goalsRoutes = new Elysia({ prefix: "/goals" })
  .get("/", () => ({ message: "Not implemented", status: 501 }))
  .post("/", () => ({ message: "Not implemented", status: 501 }))
  .get("/:id", () => ({ message: "Not implemented", status: 501 }))
  .patch("/:id", () => ({ message: "Not implemented", status: 501 }));
