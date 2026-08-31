import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

// Verify HMAC SHA-256 of raw body against shared secret
async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const incoming = signature.replace(/^sha256=/i, "").trim().toLowerCase();
  return incoming === hex;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const WEBHOOK_SECRET = Deno.env.get("PRINTIFY_WEBHOOK_SECRET");
  if (!WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("X-Printify-Hmac-SHA256") || req.headers.get("x-printify-signature");
  const ok = await verifySignature(rawBody, sig, WEBHOOK_SECRET);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = JSON.parse(rawBody);
    const event = body.type || body.event;

    if (event === "order:shipped" || event === "order:delivery") {
      const externalId = body.resource?.external_id || body.data?.external_id;
      if (externalId) {
        const newStatus = event === "order:shipped" ? "shipped" : "delivered";
        await supabase
          .from("orders")
          .update({ status: newStatus } as any)
          .eq("id", externalId);
      }
    }

    if (event === "product:updated") {
      const productId = body.resource?.id || body.data?.id;
      if (productId) {
        console.log("Product updated on Printify:", productId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
