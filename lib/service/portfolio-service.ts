import { createPortfolioRepository } from "@/lib/infrastructure/portfolio-repository";
import { Portfolio } from "@/lib/infrastructure/portfolio-repository";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { AppError } from "../error/error";

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
): Promise<Portfolio | null> {
  const portfolioRepository = createPortfolioRepository(supabase);
  const portfolio = await portfolioRepository.create(name, user.id);
  return portfolio;
}

export async function updatePortfolio(
  portfolio_id: number,
  name: string,
  user_id: string,
  supabase: SupabaseClient,
): Promise<Portfolio | null> {
  const portfolioRepository = createPortfolioRepository(supabase);
  const portfolio = await portfolioRepository.updateById(
    portfolio_id,
    name,
    user_id,
  );
  return portfolio;
}

export async function deletePortfolio(
  portfolio_id: number,
  user_id: string,
  supabase: SupabaseClient,
) {
  const portfolioRepository = createPortfolioRepository(supabase);
  const portfolio = await portfolioRepository.findById(portfolio_id, user_id);
  if (!portfolio)
    throw new AppError(`You do not own this portfolio id: ${portfolio_id}`, {
      status: 403,
    });
  await portfolioRepository.deleteById(portfolio_id, user_id);
}
