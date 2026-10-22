import { SupabaseClient } from "@supabase/supabase-js"

export interface Portfolio {
  id: number,
  userId: string,
  name: string,
}

interface PortfolioRepository {
  create(name:string, user_id:string): Promise<Portfolio>,
  findById(id: number): Promise<Portfolio | null>,
}

export function createPortfolioRepository(
  supabase: SupabaseClient
) : PortfolioRepository {
  return {
    async create(name, user_id) {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({name, user_id})
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findById(id) {
      const { data, error } = await supabase
        .from("portfolio")
        .select()
        .eq("id", id)
        .maybeSingle()
      if (error) throw error;
      return data ? data: null;
    }
  }
}