import { SupabaseClient } from "@supabase/supabase-js"

export interface Account {
  id: number,
  userId: string,
  name: string,
}

interface AccountRepository {
  create(name:string, user_id:string): Promise<Account>,
  findById(id: number): Promise<Account | null>,
}

export function createAccountRepository(
  supabase: SupabaseClient
) : AccountRepository {
  return {
    async create(name, user_id) {
      const { data, error } = await supabase
        .from("accounts")
        .insert({name, user_id})
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findById(id) {
      const { data, error } = await supabase
        .from("account")
        .select()
        .eq("id", id)
        .maybeSingle()
      if (error) throw error;
      return data ? data: null;
    }
  }
}