import { supabase } from "@/lib/supabase";

export type UserRole = "donor" | "buyer" | "partner" | "admin";

export type UserWithRole = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export async function listUsersWithRoles() {
  const { data, error } = await supabase.rpc("list_users_with_roles");
  return { data: (data as UserWithRole[] | null) ?? [], error: error?.message ?? null };
}

export async function setUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.rpc("set_user_role", { p_user_id: userId, p_role: role });
  return { error: error?.message ?? null };
}
