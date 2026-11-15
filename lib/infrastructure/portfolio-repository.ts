import { SupabaseClient } from "@supabase/supabase-js";

export interface Portfolio {
  id: number;
  name: string;
}

interface PortfolioRepository {
  create(name: string, user_id: string): Promise<Portfolio | null>;
  findById(portfolio_id: number, user_id: string): Promise<Portfolio | null>;
  findByUser(user_id: string): Promise<Portfolio[]>;
  updateById(
    id: number,
    name: string,
    user_id: string,
  ): Promise<Portfolio | null>;
  deleteById(id: number, user_id: string): void;
}

export function createPortfolioRepository(
  supabase: SupabaseClient,
): PortfolioRepository {
  return {
    async create(name, user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({ name, user_id })
        .select("id, name")
        .maybeSingle();
      if (error) throw error;
      return data ? data : null;
    },
    async findById(portfolio_id, user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .select("id, name")
        .eq("id", portfolio_id)
        .eq("user_id", user_id)
        .maybeSingle();
      if (error) throw error;
      return data ? data : null;
    },
    async findByUser(user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .select("id, name")
        .eq("user_id", user_id);
      if (error) throw error;
      return data ? data : [];
    },
    async updateById(id, name, user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .update({ name })
        .eq("id", id)
        .eq("user_id", user_id)
        .select("id, name")
        .maybeSingle();
      if (error) throw error;
      return data ? data : null;
    },
    async deleteById(id, user_id) {
      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);
      if (error) throw error;
    },
  };
}
