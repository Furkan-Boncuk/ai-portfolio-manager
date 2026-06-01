import { Elysia } from "elysia";

export const watchlistRoutes = new Elysia({ prefix: "/watchlists" })
  .get("/", () => ({ message: "Not implemented", status: 501 }))
  .post("/", () => ({ message: "Not implemented", status: 501 }))
  .get("/:id", () => ({ message: "Not implemented", status: 501 }))
  .patch("/:id", () => ({ message: "Not implemented", status: 501 }))
  .delete("/:id", () => ({ message: "Not implemented", status: 501 }));
