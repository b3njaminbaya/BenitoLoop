import { supabase } from "@/lib/supabase";

export type MyRewards = { referralCode: string; creditBalance: number };

// Fetched fresh (not from the cached auth-context profile) since balance
// can change from actions elsewhere -- a referral reward landing while
// browsing, credit spent on an earlier order in another tab, etc.
export async function getMyRewards(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("referral_code, credit_balance")
    .eq("id", userId)
    .single();
  if (error || !data) return { data: null, error: error?.message ?? null };
  return {
    data: { referralCode: data.referral_code, creditBalance: Number(data.credit_balance) } as MyRewards,
    error: null,
  };
}
