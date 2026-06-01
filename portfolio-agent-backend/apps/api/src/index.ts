import { app } from "./app";

const port = parseInt(process.env.API_PORT ?? "3000", 10);

app.listen({ port, hostname: "0.0.0.0" });

console.log(`API server running on port ${port}`);
