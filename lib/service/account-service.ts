import { createAccountRepository } from "../infrastructure/account-repository";
import { Account } from "../infrastructure/account-repository";
import { SupabaseClient, User } from "@supabase/supabase-js";

export async function createAccount(name: string, user: User, supabase: SupabaseClient): Promise<Account> {
  const accountRepository = createAccountRepository(supabase);
  const account = await accountRepository.create(name, user.id);
  return account
}