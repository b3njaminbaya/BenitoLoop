import { supabase } from "@/lib/supabase";

export type LinkedDonation = {
  linkId: string;
  donationId: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
};

export type ProvenanceEntry = {
  donationId: string;
  title: string;
  category: string;
  donatedAt: string;
};

// Admin: donations currently linked to a product, for the linking editor.
export async function listLinkedDonations(productId: string) {
  const { data, error } = await supabase
    .from("product_donations")
    .select("id, donation_id, donations(title, category, status, created_at)")
    .eq("product_id", productId);

  type Row = {
    id: string;
    donation_id: string;
    donations: { title: string; category: string; status: string; created_at: string } | null;
  };

  const linked = ((data as unknown as Row[] | null) ?? [])
    .filter((row) => row.donations)
    .map((row) => ({
      linkId: row.id,
      donationId: row.donation_id,
      title: row.donations!.title,
      category: row.donations!.category,
      status: row.donations!.status,
      createdAt: row.donations!.created_at,
    }));

  return { data: linked as LinkedDonation[], error: error?.message ?? null };
}

// Admin: search donations by title to find candidates to link.
export async function searchDonationsToLink(query: string) {
  let q = supabase
    .from("donations")
    .select("id, title, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (query.trim()) {
    q = q.ilike("title", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  return { data: data ?? [], error: error?.message ?? null };
}

export async function linkDonationToProduct(productId: string, donationId: string) {
  const { error } = await supabase.from("product_donations").insert({
    product_id: productId,
    donation_id: donationId,
  });
  return { error: error?.message ?? null };
}

export async function unlinkDonation(linkId: string) {
  const { error } = await supabase.from("product_donations").delete().eq("id", linkId);
  return { error: error?.message ?? null };
}

// Public storefront: the traceability story for a product, scoped server-side
// to only what's safe to show (see migration 0019 — no donor identity, ever).
export async function getProductProvenance(productId: string) {
  const { data, error } = await supabase.rpc("get_product_provenance", { p_product_id: productId });
  const entries: ProvenanceEntry[] = (data ?? []).map((row: { donation_id: string; title: string; category: string; donated_at: string }) => ({
    donationId: row.donation_id,
    title: row.title,
    category: row.category,
    donatedAt: row.donated_at,
  }));
  return { data: entries, error: error?.message ?? null };
}
