import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/lib/cart-context";

export type OrderStatus =
  | "pending_payment"
  | "awaiting_manual_payment"
  | "paid"
  | "payment_failed"
  | "shipped"
  | "fulfilled"
  | "cancelled";

export type Order = {
  id: string;
  status: OrderStatus;
  payment_method: "mpesa" | "manual";
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  mpesa_checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  fulfilled_at: string | null;
  credit_applied: number;
  created_at: string;
};

export type CheckoutDetails = {
  name: string;
  phone: string;
  email?: string;
  address: string;
};

export async function createOrder(items: CartItem[], details: CheckoutDetails, applyCredit = false) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Stock is checked and decremented atomically inside this function so
  // concurrent checkouts for the same product can't oversell it -- see
  // migration 0017. It raises a descriptive error (e.g. "Only 2 left of
  // ...") if any item can't be fulfilled, and nothing is inserted. Credit
  // redemption (if requested) is capped and deducted in the same
  // transaction -- see migration 0023.
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_customer_name: details.name,
    p_customer_phone: details.phone,
    p_customer_email: details.email || null,
    p_shipping_address: details.address,
    p_items: items.map((item) => ({
      product_id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.qty,
    })),
    p_apply_credit: applyCredit,
  });

  if (error || !orderId) {
    return { order: null, error: error?.message ?? "Couldn't create order" };
  }

  const order: Order = {
    id: orderId as string,
    status: "pending_payment",
    payment_method: "mpesa",
    total_amount: total,
    customer_name: details.name,
    customer_phone: details.phone,
    customer_email: details.email ?? null,
    shipping_address: details.address,
    mpesa_checkout_request_id: null,
    mpesa_receipt_number: null,
    shipping_carrier: null,
    tracking_number: null,
    fulfilled_at: null,
    credit_applied: 0,
    created_at: new Date().toISOString(),
  };

  return { order, error: null };
}

export async function getOrder(id: string) {
  // Guests don't have a session to be checked against RLS, so lookups by a
  // known order id go through a security-definer function instead of a
  // direct table SELECT (see migration 0009).
  const { data, error } = await supabase.rpc("get_order_by_id", { order_id: id });
  const order = Array.isArray(data) ? ((data[0] as Order | undefined) ?? null) : null;
  return { order, error: error?.message ?? null };
}

export async function listMyOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data as Order[] | null) ?? [], error: error?.message ?? null };
}

export async function listAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: (data as Order[] | null) ?? [], error: error?.message ?? null };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  return { error: error?.message ?? null };
}

// Sets status and tracking info together in one atomic call, so a shipped
// order can never end up missing a tracking number (see migration 0021).
export async function markOrderShipped(id: string, carrier: string, trackingNumber: string) {
  const { error } = await supabase.rpc("mark_order_shipped", {
    p_order_id: id,
    p_carrier: carrier || null,
    p_tracking_number: trackingNumber,
  });
  return { error: error?.message ?? null };
}
