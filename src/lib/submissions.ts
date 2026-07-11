import { supabase } from "@/lib/supabase";

export type DonationSubmission = {
  title: string;
  category: "clothing" | "shoes" | "accessories" | "other";
  condition: number;
  notes?: string;
  photoCount: number;
  pickupRequested: boolean;
  aiSuggestedCategory?: string;
  aiConfidence?: number;
};

export type PartnerApplication = {
  fullName: string;
  email: string;
  organization: string;
  partnershipType: "Upcycling Studio" | "Recycler" | "Logistics Provider" | "NGO";
  message: string;
};

export async function submitDonation(entry: DonationSubmission) {
  // Generated client-side, same reasoning as orders: a guest insert can't
  // rely on `.select()` to read its own row back afterward, and we need
  // the id right away to attach uploaded photos to it.
  const id = crypto.randomUUID();

  const { error } = await supabase.from("donations").insert({
    id,
    title: entry.title,
    category: entry.category,
    condition: entry.condition,
    notes: entry.notes || null,
    photo_count: entry.photoCount,
    pickup_requested: entry.pickupRequested,
    ai_suggested_category: entry.aiSuggestedCategory ?? null,
    ai_confidence: entry.aiConfidence ?? null,
  });

  if (error) return { donationId: null, error: error.message };
  return { donationId: id, error: null };
}

export async function submitPartnerApplication(entry: PartnerApplication) {
  const { error } = await supabase.from("partner_applications").insert({
    full_name: entry.fullName,
    email: entry.email,
    organization: entry.organization,
    partnership_type: entry.partnershipType,
    message: entry.message,
  });
  return { error: error?.message ?? null };
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

export async function submitNewsletterSignup(email: string) {
  const { error } = await supabase.from("newsletter_signups").insert({ email });
  if (error && error.code === POSTGRES_UNIQUE_VIOLATION) {
    // Already subscribed — treat as success rather than surfacing an error.
    return { error: null };
  }
  return { error: error?.message ?? null };
}

export type MyDonation = {
  id: string;
  title: string;
  category: string;
  condition: number;
  status: "submitted" | "scheduled" | "collected" | "processed";
  pickup_requested: boolean;
  created_at: string;
};

export async function listMyDonations(userId: string) {
  const { data, error } = await supabase
    .from("donations")
    .select("id, title, category, condition, status, pickup_requested, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data as MyDonation[] | null) ?? [], error: error?.message ?? null };
}
