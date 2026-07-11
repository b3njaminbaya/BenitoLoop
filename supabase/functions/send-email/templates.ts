const INDIGO = "#29406b";
const TERRACOTTA = "#c2542e";
const CANVAS = "#f7f4ee";

function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CANVAS};font-family:Georgia,'Times New Roman',serif;color:#1f2430;">
    <span style="display:none;font-size:1px;color:${CANVAS};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${INDIGO};padding:24px 32px;border-top:4px solid ${TERRACOTTA};">
                <span style="font-size:22px;font-weight:bold;color:#f7f4ee;letter-spacing:0.03em;">Nyuzi</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:${CANVAS};font-size:12px;color:#6b7280;">
                Nyuzi &mdash; giving Kenyan textiles a second life.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type EmailContent = { subject: string; html: string };

type Payload = Record<string, unknown>;

const money = (v: unknown) => `KES ${Number(v ?? 0).toLocaleString()}`;

export function renderTemplate(template: string, payload: Payload): EmailContent | null {
  switch (template) {
    case "order_confirmation": {
      const name = String(payload.customerName ?? "there");
      return {
        subject: "We've received your Nyuzi order",
        html: layout(
          "Your order is in and we're getting it ready.",
          `<p>Hi ${name},</p>
           <p>Thanks for shopping with Nyuzi. We've received your order and will confirm payment shortly.</p>
           <p style="margin:16px 0;padding:16px;background:${CANVAS};border-radius:8px;">
             <strong>Order:</strong> ${String(payload.orderId ?? "")}<br/>
             <strong>Total:</strong> ${money(payload.totalAmount)}<br/>
             <strong>Delivering to:</strong> ${String(payload.shippingAddress ?? "")}
           </p>
           <p>We'll email you again once payment is confirmed.</p>`
        ),
      };
    }
    case "order_paid": {
      const name = String(payload.customerName ?? "there");
      const receipt = payload.mpesaReceipt ? `<br/><strong>M-Pesa receipt:</strong> ${String(payload.mpesaReceipt)}` : "";
      return {
        subject: "Payment received — your Nyuzi order is confirmed",
        html: layout(
          "Payment received, your order is confirmed.",
          `<p>Hi ${name},</p>
           <p>Your payment came through. Your order is confirmed and will be prepared for delivery.</p>
           <p style="margin:16px 0;padding:16px;background:${CANVAS};border-radius:8px;">
             <strong>Order:</strong> ${String(payload.orderId ?? "")}<br/>
             <strong>Total paid:</strong> ${money(payload.totalAmount)}${receipt}
           </p>`
        ),
      };
    }
    case "order_shipped": {
      const name = String(payload.customerName ?? "there");
      const carrier = payload.shippingCarrier ? String(payload.shippingCarrier) : null;
      return {
        subject: "Your Nyuzi order is on its way",
        html: layout(
          "Your order has shipped.",
          `<p>Hi ${name},</p>
           <p>Your order has been dispatched${carrier ? ` with ${carrier}` : ""}.</p>
           <p style="margin:16px 0;padding:16px;background:${CANVAS};border-radius:8px;">
             <strong>Order:</strong> ${String(payload.orderId ?? "")}<br/>
             ${carrier ? `<strong>Carrier:</strong> ${carrier}<br/>` : ""}
             <strong>Tracking number:</strong> ${String(payload.trackingNumber ?? "")}
           </p>`
        ),
      };
    }
    case "referral_reward_referrer": {
      return {
        subject: "You've earned Nyuzi credit for a referral",
        html: layout(
          "A friend you referred just made their first purchase.",
          `<p>Good news — a friend you referred to Nyuzi just completed their first order.</p>
           <p style="margin:16px 0;padding:16px;background:${CANVAS};border-radius:8px;">
             <strong>Credit earned:</strong> ${money(payload.amount)}
           </p>
           <p>Your new balance is ready to use on your next order — apply it at checkout.</p>`
        ),
      };
    }
    case "referral_reward_referee": {
      return {
        subject: "Welcome credit added to your Nyuzi account",
        html: layout(
          "You've received welcome credit.",
          `<p>Thanks for your first Nyuzi order — as a thank-you for joining through a friend's referral, we've added credit to your account.</p>
           <p style="margin:16px 0;padding:16px;background:${CANVAS};border-radius:8px;">
             <strong>Credit added:</strong> ${money(payload.amount)}
           </p>
           <p>Use it on your next order at checkout.</p>`
        ),
      };
    }
    case "donation_acknowledgement": {
      const pickup = payload.pickupRequested
        ? "We'll be in touch by email to arrange collection."
        : "Thank you for choosing to donate this item.";
      return {
        subject: "Thank you for your donation to Nyuzi",
        html: layout(
          "Your donation was received.",
          `<p>Hi,</p>
           <p>We've logged your donation: <strong>${String(payload.title ?? "")}</strong> (${String(payload.category ?? "")}).</p>
           <p>${pickup}</p>
           <p>Every donation keeps textiles out of landfill and gives them a second life — thank you.</p>`
        ),
      };
    }
    case "partner_application_received": {
      return {
        subject: "We've received your Nyuzi partner application",
        html: layout(
          "Your partner application was received.",
          `<p>Hi ${String(payload.fullName ?? "")},</p>
           <p>Thanks for applying to partner with Nyuzi as a <strong>${String(payload.partnershipType ?? "")}</strong> on behalf of ${String(payload.organization ?? "")}.</p>
           <p>Our team will review your application and follow up by email.</p>`
        ),
      };
    }
    case "partner_application_approved": {
      return {
        subject: "Your Nyuzi partner application was approved",
        html: layout(
          "Your partner application was approved.",
          `<p>Hi ${String(payload.fullName ?? "")},</p>
           <p>Good news — ${String(payload.organization ?? "your organization")}'s partner application has been approved. We'll reach out shortly with next steps.</p>`
        ),
      };
    }
    case "partner_application_rejected": {
      return {
        subject: "An update on your Nyuzi partner application",
        html: layout(
          "An update on your partner application.",
          `<p>Hi ${String(payload.fullName ?? "")},</p>
           <p>Thanks for your interest in partnering with Nyuzi. After review, we're not able to move forward with ${String(payload.organization ?? "your application")} at this time.</p>
           <p>We'd welcome a future application if your circumstances change.</p>`
        ),
      };
    }
    default:
      return null;
  }
}
