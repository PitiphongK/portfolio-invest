import { createPortfolioRepository } from "@/lib/infrastructure/portfolio-repository";
import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { SupabaseClient, User } from "@supabase/supabase-js";

export async function getPortfolios(
  user: User,
  supabase: SupabaseClient,
): Promise<Portfolio[]> {
  const portfolioRepository = createPortfolioRepository(supabase);
  const portfolios = await portfolioRepository.findByUser(user.id);
  return portfolios;
}

export async function createPortfolio(
  name: string,
  user: User,
  supabase: SupabaseClient,
): Promise<Portfolio> {
  const portfolioRepository = createPortfolioRepository(supabase);
  const portfolio = await portfolioRepository.create(name, user.id);
  return portfolio;
}
