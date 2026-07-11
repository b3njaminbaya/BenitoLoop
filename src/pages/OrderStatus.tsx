import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { getOrder, type Order } from "@/lib/orders";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

const statusCopy: Record<Order["status"], { title: string; description: string }> = {
  pending_payment: {
    title: "Check your phone",
    description: "We've sent an M-Pesa prompt to your phone. Enter your PIN to complete payment.",
  },
  awaiting_manual_payment: {
    title: "Order received",
    description: "M-Pesa checkout isn't set up on this store yet — our team will contact you to arrange payment.",
  },
  paid: {
    title: "Payment received",
    description: "Thank you! Your order is confirmed and will be prepared for delivery.",
  },
  payment_failed: {
    title: "Payment didn't go through",
    description: "The M-Pesa payment wasn't completed. You can contact us to try again.",
  },
  shipped: {
    title: "On its way",
    description: "Your order has been dispatched — see the tracking details below.",
  },
  fulfilled: {
    title: "Order fulfilled",
    description: "This order has been delivered. Thanks for supporting circular fashion.",
  },
  cancelled: {
    title: "Order cancelled",
    description: "This order was cancelled.",
  },
};

const statusIcon = (status: Order["status"]) => {
  if (status === "paid" || status === "shipped" || status === "fulfilled")
    return <CheckCircle2 className="text-primary" size={48} />;
  if (status === "payment_failed" || status === "cancelled") return <XCircle className="text-destructive" size={48} />;
  return <Clock className="text-gold" size={48} />;
};

const OrderStatus = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      const { order: fetched } = await getOrder(id);
      if (cancelled) return;
      setOrder(fetched);
      setLoading(false);

      attempts += 1;
      if (fetched?.status === "pending_payment" && attempts < POLL_MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <Button asChild className="mt-6 bg-primary hover:bg-primary-dark">
          <Link to="/marketplace">Back to marketplace</Link>
        </Button>
      </div>
    );
  }

  const copy = statusCopy[order.status];

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <Seo title="Order status — Nyuzi" />
      <div className="flex justify-center">{statusIcon(order.status)}</div>
      <h1 className="mt-4 text-2xl font-bold">{copy.title}</h1>
      <p className="mt-2 text-muted-foreground">{copy.description}</p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order</span>
          <span className="font-mono">{order.id.slice(0, 8)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground">Delivering to</span>
          <span className="text-right">{order.shipping_address}</span>
        </div>
        {order.mpesa_receipt_number && (
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">M-Pesa receipt</span>
            <span className="font-mono">{order.mpesa_receipt_number}</span>
          </div>
        )}
        {order.tracking_number && (
          <>
            {order.shipping_carrier && (
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Carrier</span>
                <span>{order.shipping_carrier}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Tracking number</span>
              <span className="font-mono">{order.tracking_number}</span>
            </div>
          </>
        )}
      </div>

      <Button asChild variant="outline" className="mt-8">
        <Link to="/marketplace">Continue shopping</Link>
      </Button>
    </div>
  );
};

export default OrderStatus;
