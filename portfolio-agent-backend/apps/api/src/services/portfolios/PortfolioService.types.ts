import { createPortfolio } from "@portfolio-agent/db/repositories/portfolios";

export type CreatePortfolioInput = Parameters<typeof createPortfolio>[0];
