import { SupabaseClient } from "@supabase/supabase-js";

export interface Portfolio {
  id: number;
  user_id: string;
  name: string;
}

interface PortfolioRepository {
  create(name: string, user_id: string): Promise<Portfolio>;
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
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findById(id) {
      const { data, error } = await supabase
        .from("portfolios")
        .select()
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? data : null;
    },
    async findByUser(user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .select()
        .eq("user_id", user_id);
      if (error) throw error;
      return data ? data : [];
    },
  };
}
