import {
  listPortfolios,
  getPortfolioById,
  createPortfolio,
} from "@portfolio-agent/db/repositories/portfolios";
import type { CreatePortfolioInput } from "./PortfolioService.types";

export { type CreatePortfolioInput };

export class PortfolioService {
  async list() {
    const data = await listPortfolios();
    return { data };
  }

  async getById(id: string) {
    const result = await getPortfolioById(id);
    if (!result) return { error: "Not found" };
    return { data: result };
  }

  async create(input: CreatePortfolioInput) {
    const data = await createPortfolio(input);
    return { data };
  }
}
