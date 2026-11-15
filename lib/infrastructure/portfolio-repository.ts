import { SupabaseClient } from "@supabase/supabase-js";

export interface Portfolio {
  id: number;
  name: string;
}

interface PortfolioRepository {
  create(name: string, user_id: string): Promise<Portfolio | null>;
  findById(id: number): Promise<Portfolio | null>;
  findByUser(user_id: string): Promise<Portfolio[]>;
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
    async findById(id) {
      const { data, error } = await supabase
        .from("portfolios")
        .select("id, name")
        .eq("id", id)
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
  };
}
