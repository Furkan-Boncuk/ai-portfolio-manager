import { app } from "./app";
import { getEnv } from "@portfolio-agent/shared";

const env = getEnv();

app.listen({ port: env.API_PORT, hostname: "0.0.0.0" });

console.log(`API server running on port ${env.API_PORT}`);
