import { supabase } from "@/lib/supabase";

export type EmailLogEntry = {
  id: string;
  template: string;
  recipient: string | null;
  entity_type: string;
  entity_id: string | null;
  status: "queued" | "sent" | "failed" | "skipped_no_email" | "skipped_not_configured";
  error: string | null;
  created_at: string;
};

export async function listEmailLog(limit = 100) {
  const { data, error } = await supabase
    .from("email_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data as EmailLogEntry[] | null) ?? [], error: error?.message ?? null };
}
