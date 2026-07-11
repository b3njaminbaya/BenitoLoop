// Sends a transactional email via Resend, invoked by Postgres triggers
// (through pg_net) rather than directly by clients. Authenticated with a
// shared secret stored in Supabase Vault -- see migration 0016.
//
// Deliberately never throws on missing config -- if RESEND_API_KEY isn't
// set yet, it logs 'skipped_not_configured' and returns 200 so the
// triggering database write is never affected by email being unconfigured.
import { createClient } from "npm:@supabase/supabase-js@2";
import { renderTemplate } from "./templates.ts";

const WEBHOOK_SECRET = Deno.env.get("EMAIL_WEBHOOK_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Nyuzi <onboarding@resend.dev>";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function markLog(logId: string | undefined, status: string, error?: string) {
  if (!logId) return;
  await supabase.from("email_log").update({ status, error: error ?? null }).eq("id", logId);
}

Deno.serve(async (req) => {
  let body: { logId?: string; template?: string; recipient?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { logId, template, recipient, payload } = body;

  if (!RESEND_API_KEY) {
    await markLog(logId, "skipped_not_configured");
    return new Response(JSON.stringify({ status: "skipped_not_configured" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!template || !recipient) {
    await markLog(logId, "failed", "missing template or recipient");
    return new Response(JSON.stringify({ error: "missing template or recipient" }), { status: 400 });
  }

  const content = renderTemplate(template, payload ?? {});
  if (!content) {
    await markLog(logId, "failed", `unknown template: ${template}`);
    return new Response(JSON.stringify({ error: "unknown template" }), { status: 400 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipient,
        subject: content.subject,
        html: content.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      await markLog(logId, "failed", errText.slice(0, 500));
      return new Response(JSON.stringify({ status: "failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    await markLog(logId, "sent");
    return new Response(JSON.stringify({ status: "sent" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    await markLog(logId, "failed", String(err).slice(0, 500));
    return new Response(JSON.stringify({ status: "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
